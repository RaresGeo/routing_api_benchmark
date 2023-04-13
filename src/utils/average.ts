import dotenv from 'dotenv';
import { readdirSync, statSync } from 'fs';
import jsonfile, { readFileSync } from 'jsonfile';
import logUpdate from 'log-update';
import { join } from 'path';
import { ResultCore } from './types.js';

dotenv.config();
const outputDir = 'output';

const getJsonData = (jsonPath: string) => {
  try {
    const data = jsonfile.readFileSync(jsonPath);
    let sum = 0;
    let successes = 0;

    data.forEach((result: ResultCore) => {
      sum += result.timeElapsed;
      successes += !result.status.toString().startsWith('5') ? 1 : 0;
    });

    return {
      sum,
      successes,
      count: data.length,
    };
  } catch (e) {
    return {
      sum: 0,
      successes: 0,
      count: 0,
    };
  }
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

const getOutputName = (dir: string) => {
  return dir.split('/').slice(1, dir.split('/').length).join('/');
};

const averages = (outputSubdirectories: string[]) => {
  const strings: string[] = [];
  outputSubdirectories.forEach((subdir) => {
    const processDirs = getSubdirectories(subdir);
    const data = {} as {
      [key: string]: { sum: number; successes: number; count: number };
    };

    processDirs.forEach((processDir) => {
      const jsonFiles = readdirSync(processDir).filter(
        (file) => file.endsWith('.json') && file.startsWith('results-core')
      );

      if (!jsonFiles.length) {
        console.log('No json files found');
      }

      data[processDir] = {
        sum: 0,
        successes: 0,
        count: 0,
      };

      jsonFiles.forEach((jsonFile) => {
        const { sum, successes, count } = getJsonData(
          join(processDir, jsonFile)
        );

        data[processDir] = {
          sum: data[processDir].sum + sum,
          successes: data[processDir].successes + successes,
          count: data[processDir].count + count,
        };
      });

      /* const average = data[processDir].sum / data[processDir].count;
      const successRate = data[processDir].successes / data[processDir].count;

      console.log(
        `${getOutputName(processDir)}: average of ${formatMilliseconds(
          average
        )} (${successRate * 100}% success rate) for ${
          data[processDir].count
        } requests`
      ); */
    });

    let overallAverage = 0;
    let overallSuccessRate = 0;
    let overallCount = 0;

    Object.values(data).forEach(({ sum, successes, count }) => {
      overallAverage += sum;
      overallSuccessRate += successes;
      overallCount += count;
    });

    overallAverage = overallAverage / overallCount;
    overallSuccessRate = overallSuccessRate / overallCount;

    let rps = 10;

    strings.push(
      `${getOutputName(subdir).padEnd(22, ' ')} ${formatMilliseconds(
        overallAverage
      ).padStart(10, ' ')} ⏱️ ${(overallSuccessRate * 100)
        .toFixed(3)
        .padStart(10, ' ')}% ✅ ${
        overallCount.toString().padStart(10, ' ') + 'req'
      } ${rps.toFixed(2).padStart(5, ' ')} rps`
    );
  });

  return strings.join('\n');
};

const main = async () => {
  const folderArg = process.argv[2];

  const interval = setInterval(() => {
    const outputSubdirectories = getSubdirectories(outputDir).filter(
      (subdir) => !folderArg || subdir.startsWith(join(outputDir, folderArg))
    );
    const log = averages(outputSubdirectories);
    logUpdate(log);
  }, 5000);

  process.on('exit', () => {
    clearInterval(interval);
  });
};

export default main;
