import jsonfile from 'jsonfile';
import dotenv from 'dotenv';
import { Result, ResultCore } from './types.js';

dotenv.config();

const NUM_SECONDS = parseInt(process.env.NUM_SECONDS || '1', 10);
const NUM_REQUESTS = parseInt(process.env.NUM_REQUESTS || '1', 10);

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
