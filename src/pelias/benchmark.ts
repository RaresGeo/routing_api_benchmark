import axios from 'axios';
import dotenv from 'dotenv';
import jsonfile from 'jsonfile';
import benchmark from '../utils/benchmark.js';
import benchmarkAutocomplete from '../utils/benchmarkAutocomplete.js';

dotenv.config();

const NUM_SECONDS = parseInt(process.env.NUM_SECONDS || '1', 10);
const NUM_REQUESTS = parseInt(process.env.NUM_REQUESTS || '1', 10);

const getShuffledDataArray = () => {
  const data = jsonfile.readFileSync(`input/${process.env.START_FILE}.json`);
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }
  return data;
};

const geocoding = async () => {
  const data = getShuffledDataArray();

  const urlGetter = (timerIndex: number) => {
    return (index: number) => {
      const idx = timerIndex % data.length;

      const dataSlice = data.slice(
        NUM_REQUESTS * idx,
        NUM_REQUESTS * (idx + 1)
      );
      const { label } = dataSlice[index % dataSlice.length];
      return `${process.env.PELIAS_API_URL}:4000/v1/search?text=${label}`;
    };
  };

  const bodyGetter = (timerIndex: number) => {
    return (index: number) => {
      return undefined;
    };
  };

  return benchmark(urlGetter, bodyGetter, axios.get, NUM_REQUESTS, NUM_SECONDS);
};

const autocomplete = async () => {
  const data = getShuffledDataArray();

  const urlGetter = (timerIndex: number) => {
    return (index: number) => {
      const dataSlice = data.slice(
        NUM_REQUESTS * timerIndex,
        NUM_REQUESTS * (timerIndex + 1)
      );
      const { label } = dataSlice[index];
      return {
        url: `${process.env.PELIAS_API_URL}:4000/v1/autocomplete?text={{label}}`,
        label,
      };
    };
  };

  const bodyGetter = (timerIndex: number) => {
    return (index: number) => {
      return undefined;
    };
  };

  return benchmarkAutocomplete(
    urlGetter,
    bodyGetter,
    axios.get,
    NUM_REQUESTS,
    NUM_SECONDS
  );
};

export { geocoding, autocomplete };
