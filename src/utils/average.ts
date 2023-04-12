import dotenv from 'dotenv';
import jsonfile from 'jsonfile';
import { ResultCore } from './types.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import tty from 'tty';

dotenv.config();
const outputDir = 'output';

const getJsonData = (jsonPath: string) => {
  try {
    const data = jsonfile.readFileSync(jsonPath);
    let sum = 0;
    let successes = 0;

    data.forEach((result: ResultCore) => {
      sum += result.timeElapsed;
      successes += result.status === 200 ? 1 : 0;
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
  console.log('\n\n\nRunning....');
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

      const average = data[processDir].sum / data[processDir].count;
      const successRate = data[processDir].successes / data[processDir].count;

      console.log(
        `${getOutputName(processDir)}: average of ${formatMilliseconds(
          average
        )} (${successRate * 100}% success rate) for ${
          data[processDir].count
        } requests}`
      );
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

    console.log(
      `${getOutputName(subdir)} overall: average of ${formatMilliseconds(
        overallAverage
      )} (${
        overallSuccessRate * 100
      }% success rate) for ${overallCount} requests}\n\n`
    );
  });
};

const debounce = <F extends (...args: any[]) => void>(
  fn: F,
  delay: number
): ((...args: Parameters<F>) => void) => {
  let timerId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<F>) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

const main = async () => {
  const folderArg = process.argv[2];

  const outputSubdirectories = getSubdirectories(outputDir).filter(
    (subdir) => !folderArg || subdir.startsWith(join(outputDir, folderArg))
  );

  averages(outputSubdirectories);

  console.log("Press 'q' to quit, SPACE to run again");

  const stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  const handleKeyPress = (key: string) => {
    if (key === ' ') {
      averages(outputSubdirectories);
    } else if (key === 'q') {
      process.exit();
    }
  };

  const debouncedHandleKeyPress = debounce(handleKeyPress, 200);

  stdin.on('data', (key: Buffer) => {
    debouncedHandleKeyPress(key.toString());
  });
};

export default main;
