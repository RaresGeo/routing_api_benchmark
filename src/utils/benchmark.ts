import { AxiosError, AxiosResponse } from 'axios';
import dotenv from 'dotenv';
import jsonfile from 'jsonfile';
import now from 'performance-now';
import { Result, ResultCore } from '../utils/types.js';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

dotenv.config();

const makeRequests = (
  url: (index: number) => string,
  body: (index: number) => { coordinates?: number[][] } | undefined,
  numberOfRequests: number,
  axiosMethod: any
) => {
  const promises: Promise<{ result: Result; resultCore: ResultCore }>[] = [];

  for (let i = 0; i < numberOfRequests; i++) {
    const start = now();

    const promise: Promise<{ result: Result; resultCore: ResultCore }> =
      new Promise((resolve, reject) => {
        axiosMethod(url(i), body(i), {
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
              url: url(i),
              response: res.data,
            };

            const resultCore = {
              madeAt,
              timeElapsed,
              requestnumber,
              body: body(i),
              url: url(i),
            };

            resolve({ result, resultCore });
          })
          .catch((err: AxiosError) => {
            console.log(
              'Failed with error message: ',
              err?.message,
              'for url',
              url(i),
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

    const outputSubdir = `output/pid-${process.pid}`;
    if (!existsSync(outputSubdir)) {
      mkdirSync(outputSubdir, { recursive: true });
    }

    return [
      // jsonfile.writeFile(join(outputSubdir, `results-${index}.json`), results, {
      //   spaces: 2,
      // }),
      jsonfile.writeFile(
        join(outputSubdir, `results-core-${index}.json`),
        resultCore,
        {
          spaces: 2,
        }
      ),
    ];
  } catch (err) {
    console.error(`Error logging results for index ${index}:`, err);
    return [];
  }
};

const timer = (
  index: number,
  url: (index: number) => string,
  body: (index: number) => { coordinates?: number[][] } | undefined,
  axiosMethod: any,
  numRequests: number
) => {
  const promises = makeRequests(url, body, numRequests, axiosMethod);

  console.log(
    `${process.pid}/${index + 1}. Making requests from ${
      numRequests * index
    } to ${numRequests * (index + 1)}...`
  );

  return logResults(index, promises);
};

const main = async (
  urlGetter: (timerIndex: number) => (index: number) => string,
  bodyGetter: (
    timerIndex: number
  ) => (index: number) => { coordinates?: number[][] } | undefined,
  axiosMethod: any,
  numRequests: number,
  numSeconds: number
) => {
  const promise = new Promise((resolve, reject) => {
    for (let i = 0; i < numSeconds; i++) {
      setTimeout(async () => {
        const jsonPromises = await timer(
          i,
          urlGetter(i),
          bodyGetter(i),
          axiosMethod,
          numRequests
        );
        if (i === numSeconds - 1) {
          await Promise.all(jsonPromises);
          console.log(`${process.pid}. Done.`);
          resolve(true);
        }
      }, i * 1000);
    }
  });

  return promise;
};

export default main;
