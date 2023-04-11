import dotenv from 'dotenv';
import jsonfile from 'jsonfile';
import { ResultCore } from '../utils/types.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

dotenv.config();

const NUM_SECONDS = parseInt(process.env.NUM_SECONDS || '1', 10);
const NUM_REQUESTS = parseInt(process.env.NUM_REQUESTS || '1', 10);
const outputDir = 'output';

const getAverageTimeElapsed = (jsonPath: string) => {
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

const getSubdirectories = (srcPath: string) => {
  return readdirSync(srcPath)
    .map((file) => join(srcPath, file))
    .filter((path) => statSync(path).isDirectory());
};

const main = () => {
  const subdirectories = getSubdirectories(outputDir);
  const averages = {} as { [key: string]: { average: number; files: number } };
  let overallSum = 0;
  let overallCount = 0;
  subdirectories.forEach((subdir) => {
    const jsonFiles = readdirSync(subdir).filter(
      (file) => file.endsWith('.json') && file.startsWith('results-core')
    );
    let sum = 0;
    for (let i = 0; i < jsonFiles.length; i++) {
      const jsonPath = join(subdir, `results-core-${i}.json`);
      const averageTimeElapsed = getAverageTimeElapsed(jsonPath);
      sum += averageTimeElapsed;
      console.log(
        `Average time elapsed for step ${
          i + 1
        }, ${NUM_REQUESTS} requests (in ${subdir.replace('output/pid-', '')}):`,
        formatMilliseconds(averageTimeElapsed)
      );
    }
    const average = sum / jsonFiles.length;
    averages[subdir] = { average, files: jsonFiles.length };
    overallSum += sum;
    overallCount += jsonFiles.length;
    console.log('\n');
  });

  console.log('--- Individual Averages ---');
  Object.entries(averages).forEach(([subdir, { average, files }]) => {
    console.log(
      `Average time elapsed for all steps (${
        NUM_REQUESTS * files
      } requests) in ${subdir.replace('output/pid-', '')}:`,
      formatMilliseconds(average)
    );
  });

  const overallAverage = overallSum / overallCount;
  console.log(
    `Overall average time elapsed for all subprocesses \n(${
      overallCount * NUM_REQUESTS
    } requests total. Across ${
      Object.keys(averages).length
    } subprocesses, each sending ${
      overallCount / Object.keys(averages).length
    } requests per second for ${Math.max(
      ...Object.values(averages).map(({ files }) => files)
    )} seconds): `,
    formatMilliseconds(overallAverage)
  );
};

export default main;
