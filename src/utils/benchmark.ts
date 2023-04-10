import { AxiosError, AxiosResponse } from 'axios';
import dotenv from 'dotenv';
import jsonfile from 'jsonfile';
import now from 'performance-now';
import { Result, ResultCore } from '../utils/types.js';

dotenv.config();

const makeRequests = (
  url: string,
  body: (index: number) => { coordinates?: number[][] } | undefined,
  numberOfRequests: number,
  axiosMethod: any
) => {
  const promises: Promise<{ result: Result; resultCore: ResultCore }>[] = [];

  for (let i = 0; i < numberOfRequests; i++) {
    const start = now();

    const promise: Promise<{ result: Result; resultCore: ResultCore }> =
      new Promise((resolve, reject) => {
        axiosMethod(url, body(i), {
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((res: AxiosResponse) => {
            const end = now();
            const timeElapsed = end - start;
            const requestnumber = i + 1;
            const madeAt = new Date().toISOString();

            const result = {
              madeAt,
              timeElapsed,
              requestnumber,
              body: body(i),
              response: res.data,
            };

            const resultCore = {
              madeAt,
              timeElapsed,
              requestnumber,
              body: body(i),
            };

            resolve({ result, resultCore });
          })
          .catch((err: AxiosError) => {
            console.log(
              'Failed with error message: ',
              err?.message,
              'for url',
              url,
              body
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
  url: string,
  body: (index: number) => { coordinates?: number[][] } | undefined,
  axiosMethod: any,
  numRequests: number
) => {
  const promises = makeRequests(url, body, numRequests, axiosMethod);

  console.log(
    `${index + 1}. Making requests from ${numRequests * index} to ${
      numRequests * (index + 1)
    }...`
  );

  return logResults(index, promises);
};

const main = async (
  url: string,
  bodyGetter: (
    timerIndex: number
  ) => (index: number) => { coordinates?: number[][] } | undefined,
  axiosMethod: any,
  numRequests: number,
  numSeconds: number
) => {
  for (let i = 0; i < numSeconds; i++) {
    setTimeout(() => {
      timer(i, url, bodyGetter(i), axiosMethod, numRequests);
    }, i * 1000);
  }
};

export default main;
