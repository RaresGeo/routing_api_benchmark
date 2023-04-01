import axios from 'axios';
import now from 'performance-now';
import dotenv from 'dotenv';
import jsonfile from 'jsonfile';
import { getRandomPointInPolygon } from './utils.js';
import { Result, ResultCore } from './types.js';

dotenv.config();

const NUM_REQUESTS = 20;

const main = async () => {
  const profileParam = 'driving-car';
  const startData = jsonfile.readFileSync('input/berlin.json');
  const startCoords = startData.features[0].geometry.coordinates[0];
  const endData = jsonfile.readFileSync('input/bucharest.json');
  const endCoords = endData.features[0].geometry.coordinates[0];

  const promises = [];
  const results: Result[] = [];
  const resultCore: ResultCore[] = [];

  let successes = 0;

  for (let i = 0; i < NUM_REQUESTS; i++) {
    const startPoint = getRandomPointInPolygon(startCoords);
    const endPoint = getRandomPointInPolygon(endCoords);

    const startParam = `${startPoint[0]},${startPoint[1]}`;
    const endParam = `${endPoint[0]},${endPoint[1]}`;

    const start = now();
    const promise = axios
      .get(
        `${process.env.API_URL}/v2/directions/${profileParam}?start=${startParam}&end=${endParam}`
      )
      .then((res) => {
        const end = now();
        const timeElapsed = end - start;
        const requestnumber = i + 1;

        results.push({
          timeElapsed,
          requestnumber,
          params: {
            profile: profileParam,
            start: startParam,
            end: endParam,
          },
          response: res.data,
        });

        resultCore.push({
          timeElapsed,
          requestnumber,
          params: {
            profile: profileParam,
            start: startParam,
            end: endParam,
          },
        });

        successes++;
      })
      .catch((err: Error) => {
        console.log(
          'Failed with error message: ',
          err?.message,
          'for url',
          `${process.env.API_URL}/v2/directions/${profileParam}?start=${startParam}&end=${endParam}`
        );
      });

    promises.push(promise);
  }

  await Promise.all(promises);

  await jsonfile.writeFile('output/results.json', results, { spaces: 2 });

  await jsonfile.writeFile('output/results-core.json', resultCore, {
    spaces: 2,
  });

  return successes;
};

const getAverageTimeElapsed = (jsonPath: string) => {
  // could just use jsonFile.readFileSync instead of await
  const data = jsonfile.readFileSync(jsonPath);
  const sum = data.reduce((acc: number, curr: ResultCore) => {
    return acc + curr.timeElapsed;
  }, 0);

  return sum / data.length;
};

main().then((res) => {
  console.log(`Successes: ${res} out of ${NUM_REQUESTS}`);
  console.log(
    `Average time elapsed for ${res} requests out of ${NUM_REQUESTS}:`,
    getAverageTimeElapsed('output/results-core.json')
  );
});
