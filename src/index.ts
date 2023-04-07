import axios from 'axios';
import now from 'performance-now';
import dotenv from 'dotenv';
import jsonfile from 'jsonfile';
import { getRandomPointInPolygon } from './utils.js';
import { Result, ResultCore } from './types.js';

dotenv.config();

const NUM_SECONDS = 5;
const NUM_REQUESTS = 10;

const makeRequests = (
  profileParam: string,
  startCoords: number[][],
  endCoords: number[][],
  numberOfRequests: number
) => {
  const promises: Promise<{ result: Result; resultCore: ResultCore }>[] = [];

  for (let i = 0; i < numberOfRequests; i++) {
    const startPoint = getRandomPointInPolygon(startCoords);
    const endPoint = getRandomPointInPolygon(endCoords);

    const startParam = `${startPoint[0]},${startPoint[1]}`;
    const endParam = `${endPoint[0]},${endPoint[1]}`;

    const start = now();
    const promise: Promise<{ result: Result; resultCore: ResultCore }> =
      new Promise((resolve, reject) => {
        axios
          .get(
            `${process.env.API_URL}/v2/directions/${profileParam}?start=${startParam}&end=${endParam}`
          )
          .then((res) => {
            const end = now();
            const timeElapsed = end - start;
            const requestnumber = i + 1;
            const madeAt = new Date().toISOString();

            const result = {
              madeAt,
              timeElapsed,
              requestnumber,
              params: {
                profile: profileParam,
                start: startParam,
                end: endParam,
              },
              response: res.data,
            };

            const resultCore = {
              madeAt,
              timeElapsed,
              requestnumber,
              params: {
                profile: profileParam,
                start: startParam,
                end: endParam,
              },
            };

            resolve({ result, resultCore });
          })
          .catch((err) => {
            console.log(
              'Failed with error message: ',
              err?.message,
              'for url',
              `${process.env.API_URL}/v2/directions/${profileParam}?start=${startParam}&end=${endParam}`
            );
            reject(err);
          });
      });

    promises.push(promise);
  }

  return promises;
};

const logResults = async (
  index: number,
  promises: Promise<{ result: Result; resultCore: ResultCore }>[]
) => {
  try {
    const settledPromises = await Promise.allSettled(promises);

    const results: Result[] = [];
    const resultCore: ResultCore[] = [];

    settledPromises.forEach(
      (
        settledResult: PromiseSettledResult<{
          result: Result;
          resultCore: ResultCore;
        }>
      ) => {
        if (settledResult.status === 'fulfilled') {
          results.push(settledResult.value.result);
          resultCore.push(settledResult.value.resultCore);
        } else {
          console.error(
            `Error in promise for index ${index}:`,
            settledResult.reason
          );
        }
      }
    );

    await jsonfile.writeFile(`output/results-${index}.json`, results, {
      spaces: 2,
    });
    await jsonfile.writeFile(`output/results-core-${index}.json`, resultCore, {
      spaces: 2,
    });
  } catch (err) {
    console.error(`Error logging results for index ${index}:`, err);
  }
};

const main = async () => {
  const profileParam = 'driving-car';
  const startData = jsonfile.readFileSync('input/berlin.json');
  const startCoords = startData.features[0].geometry.coordinates[0];
  const endData = jsonfile.readFileSync('input/bucharest.json');
  const endCoords = endData.features[0].geometry.coordinates[0];

  const finished = new Promise((resolve) => {
    for (let i = 0; i < NUM_SECONDS; i++) {
      const start = now();
      const promises = makeRequests(
        profileParam,
        startCoords,
        endCoords,
        NUM_REQUESTS
      );
      logResults(i, promises).then(() => {
        if (i === NUM_SECONDS - 1) {
          resolve(true);
        }
      });

      // wait at least 1000 ms
      while (now() - start < 1000) {
        // do nothing
      }
    }
  });

  return finished;
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
  let sum = 0;
  for (let i = 0; i < NUM_SECONDS; i++) {
    const averageTimeElapsed = getAverageTimeElapsed(
      `output/results-${i}.json`
    );
    sum += averageTimeElapsed;
    console.log(
      `Average time elapsed for ${i + 1}, ${NUM_REQUESTS} requests:`,
      averageTimeElapsed
    );
  }
  console.log(
    `Average time elapsed overall for ${NUM_REQUESTS * NUM_SECONDS} requests:`,
    sum / NUM_SECONDS
  );
});
