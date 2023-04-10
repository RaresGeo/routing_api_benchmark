import axios from 'axios';
import dotenv from 'dotenv';
import jsonfile from 'jsonfile';
import { Result, ResultCore } from '../utils/types.js';
import { getRandomPointInPolygon } from '../utils/utils.js';
import fs from 'fs';
import path from 'path';

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

const makeRequests = () => {
  const points = getPointsArray();
  const promises: Promise<any>[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const point = points[i];
    const promise: Promise<any> = new Promise((resolve, reject) => {
      axios
        .get(
          `${process.env.PELIAS_API_URL}:4000/v1/reverse?point.lon=${point[0]}&point.lat=${point[1]}`
        )
        .then((res) => {
          const result = {
            point,
            label: res.data.features[0].properties.label,
          };

          resolve(result);
        })
        .catch((err) => {
          reject(err);
        });
    });
    promises.push(promise);
  }

  return promises;
};

const main = async () => {
  const promises = makeRequests();

  const settledPromises = await Promise.allSettled(promises);
  const results = [] as any[];

  settledPromises.forEach(
    (settledResult: PromiseSettledResult<any>, index: number) => {
      if (settledResult.status === 'fulfilled') {
        // populate input
        results.push(settledResult.value);
      } else {
        console.error(
          `Error in promise for index ${index}:`,
          settledResult.reason
        );
      }
    }
  );

  await jsonfile.writeFile(
    `input/pelias.json`,
    results,
    { spaces: 2 },
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );

  console.log('Done populating input files with', results.length, 'results');
};

export default main;
