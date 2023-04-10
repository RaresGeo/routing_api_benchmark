import axios from 'axios';
import dotenv from 'dotenv';
import jsonfile from 'jsonfile';
import benchmark from '../utils/benchmark.js';

dotenv.config();

const NUM_SECONDS = parseInt(process.env.NUM_SECONDS || '1', 10);
const NUM_REQUESTS = parseInt(process.env.NUM_REQUESTS || '1', 10);

const getShuffledDataArray = () => {
  const data = jsonfile.readFileSync('input/pelias.json');
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }
  return data;
};

const main = async () => {
  const data = getShuffledDataArray();

  const urlGetter = (timerIndex: number) => {
    return (index: number) => {
      const dataSlice = data.slice(
        NUM_REQUESTS * timerIndex,
        NUM_REQUESTS * (timerIndex + 1)
      );
      const { label } = dataSlice[index];
      return `${process.env.PELIAS_API_URL}:4000/v1/search?text=${label}`;
    };
  };

  const bodyGetter = (timerIndex: number) => {
    return (index: number) => {
      return undefined;
    };
  };

  benchmark(urlGetter, bodyGetter, axios.get, NUM_REQUESTS, NUM_SECONDS);
};

export default main;
