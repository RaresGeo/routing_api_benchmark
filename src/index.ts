import axios from 'axios';
import now from 'performance-now';
import dotenv from 'dotenv';
import jsonfile from 'jsonfile';
import { getRandomPointInPolygon } from './utils.js';
import { Result, ResultCore } from './types.js';

dotenv.config();

const NUM_SECONDS = parseInt(process.env.NUM_SECONDS || '1', 10);
const NUM_REQUESTS = parseInt(process.env.NUM_REQUESTS || '1', 10);

const makeRequests = (
  profileParam: string,
  startPoints: number[][],
  endPoints: number[][],
  numberOfRequests: number
) => {
  const promises: Promise<{ result: Result; resultCore: ResultCore }>[] = [];

  for (let i = 0; i < numberOfRequests; i++) {
    const start = now();
    const startPoint = startPoints[i];
    const endPoint = endPoints[i];

    const promise: Promise<{ result: Result; resultCore: ResultCore }> =
      new Promise((resolve, reject) => {
        axios
          .post(
            `${process.env.API_URL}/v2/directions/${profileParam}/geojson`,
            {
              coordinates: [startPoint, endPoint],
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
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
                start: startPoint,
                end: endPoint,
              },
              response: res.data,
            };

            const resultCore = {
              madeAt,
              timeElapsed,
              requestnumber,
              params: {
                profile: profileParam,
                start: startPoint,
                end: endPoint,
              },
            };

            resolve({ result, resultCore });
          })
          .catch((err) => {
            console.log(
              'Failed with error message: ',
              err?.message,
              'for body',
              {
                coordinates: [startPoint, endPoint],
              }
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

    /* jsonfile.writeFile(`output/results-${index}.json`, results, {
      spaces: 2,
    }); */

    return [
      jsonfile.writeFile(`output/results-core-${index}.json`, resultCore, {
        spaces: 2,
      }),
    ];
  } catch (err) {
    console.error(`Error logging results for index ${index}:`, err);
    return [];
  }
};

const timer = (
  index: number,
  profileParam: string,
  startPoints: number[][],
  endPoints: number[][]
) => {
  const startPointsSection = startPoints.slice(
    NUM_REQUESTS * index,
    NUM_REQUESTS * (index + 1)
  );

  const endPointsSection = endPoints.slice(
    NUM_REQUESTS * index,
    NUM_REQUESTS * (index + 1)
  );

  const promises = makeRequests(
    profileParam,
    startPointsSection,
    endPointsSection,
    NUM_REQUESTS
  );

  console.log(
    `${index + 1}. Making requests from ${NUM_REQUESTS * index} to ${
      NUM_REQUESTS * (index + 1)
    }...`
  );

  return logResults(index, promises);
};

const getPointsForAllRequests = (
  numberOfPoints: number,
  startCoords: number[][],
  endCoords: number[][]
) => {
  const startPoints = [];
  const endPoints = [];

  for (let i = 0; i < numberOfPoints; i++) {
    const startPoint = getRandomPointInPolygon(startCoords);
    const endPoint = getRandomPointInPolygon(endCoords);

    startPoints.push(startPoint);
    endPoints.push(endPoint);
  }

  return { startPoints, endPoints };
};

const main = async () => {
  const profileParam = 'driving-car';
  const startData = jsonfile.readFileSync('input/berlin.json');
  const startCoords = startData.features[0].geometry.coordinates[0];
  const endData = jsonfile.readFileSync('input/bucharest.json');
  const endCoords = endData.features[0].geometry.coordinates[0];
  const { startPoints, endPoints } = getPointsForAllRequests(
    NUM_REQUESTS * NUM_SECONDS,
    startCoords,
    endCoords
  );

  for (let i = 0; i < NUM_SECONDS; i++) {
    setTimeout(() => {
      timer(i, profileParam, startPoints, endPoints);
    }, i * 1000);
  }
};

const getAverageTimeElapsed = (jsonPath: string) => {
  // could just use jsonFile.readFileSync instead of await
  const data = jsonfile.readFileSync(jsonPath);
  const sum = data.reduce((acc: number, curr: ResultCore) => {
    return acc + curr.timeElapsed;
  }, 0);

  return sum / data.length;
};

function formatMilliseconds(milliseconds: number): string {
  const seconds = (milliseconds / 1000).toFixed(3);
  return `${seconds}s`;
}

main(); /* .then((res) => {
  let sum = 0;
  for (let i = 0; i < NUM_SECONDS; i++) {
    const averageTimeElapsed = getAverageTimeElapsed(
      `output/results-core-${i}.json`
    );
    sum += averageTimeElapsed;
    console.log(
      `Average time elapsed for step ${i + 1}, ${NUM_REQUESTS} requests:`,
      formatMilliseconds(averageTimeElapsed)
    );
  }
  console.log(
    `Average time elapsed overall for ${NUM_REQUESTS * NUM_SECONDS} requests:`,
    formatMilliseconds(sum / NUM_SECONDS)
  );
}); */
