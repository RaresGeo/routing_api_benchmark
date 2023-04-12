import axios, { AxiosResponse } from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import jsonfile from 'jsonfile';
import PQueue from 'p-queue';
import path from 'path';
import { getRandomPointInPolygon } from '../utils/utils.js';
import cliProgress from 'cli-progress';

dotenv.config();

const NUM_REQUESTS = parseInt(process.env.NUM_REQUESTS || '1', 10);
const NUM_SECONDS = parseInt(process.env.NUM_SECONDS || '1', 10);
const TOTAL = NUM_REQUESTS * NUM_SECONDS;

const inputDir = 'input';

const getInputFileCoordinates = () => {
  const fileCoords = [] as number[][][];

  try {
    const files = fs.readdirSync(inputDir);
    files.forEach((file) => {
      const ext = path.extname(file);

      if (ext === '.json' && file !== 'pelias.json') {
        const data = jsonfile.readFileSync(path.join(inputDir, file));
        const coordinates = data.features[0].geometry.coordinates[0];
        fileCoords.push(coordinates);
        console.log('Got coords for', file.split('.json')[0]);
      }
    });

    return fileCoords;
  } catch (err) {
    console.error(err);
    return [];
  }
};

const getPointsArray = () => {
  const points = [] as number[][];
  const fileCoords = getInputFileCoordinates();

  if (fileCoords.length === 0) {
    throw new Error('No input files found');
  }

  for (let i = 0; i < TOTAL; i++) {
    const coordinates = fileCoords[i % fileCoords.length];
    const point = getRandomPointInPolygon(coordinates);
    points.push(point);
  }
  return points;
};

const makeTasks = () => {
  const points = getPointsArray();
  const tasks: (() => Promise<any>)[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const point = points[i];
    tasks.push(() =>
      axios
        .get(
          `${process.env.PELIAS_API_URL}:4000/v1/reverse?point.lon=${point[0]}&point.lat=${point[1]}`
        )
        .then((res) => {
          const result = {
            point,
            label: res.data.features[0].properties.label,
          };

          return result;
        })
        .catch((err) => {
          console.error(err.message);
          return undefined;
        })
    );
  }
  return tasks;
};

const main = async () => {
  const queue = new PQueue({
    concurrency: 100,
    timeout: 10000,
    autoStart: false,
  });

  const tasks = makeTasks();
  const taskResults = Array(tasks.length);
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    queue.add(async () => await task().then((res) => (taskResults[i] = res)));
  }

  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(tasks.length, 0);

  let count = 0;
  queue.on('active', () => {
    progressBar.update(count++);
  });

  await queue.start().onEmpty();
  progressBar.stop();

  const results = taskResults.filter((result) => result !== undefined);

  jsonfile.writeFile(`input/pelias.json`, results, { spaces: 2 }, (err) => {
    if (err) {
      console.error(err);
    }
  });

  console.log(
    'Done populating input files with',
    results.length,
    'results, out of a total of',
    taskResults.length,
    'requests'
  );
};

export default main;
