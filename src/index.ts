import dotenv from 'dotenv';
import average from './utils/average.js';
import orsBenchmark from './ors/benchmark.js';
import parseKMLDir from './utils/kml.js';
import peliasPopulate from './pelias/populateInput.js';
import { geocoding as peliasGeocodingBenchmark } from './pelias/benchmark.js';
import { autocomplete as peliasAutocompleteBenchmark } from './pelias/benchmark.js';
dotenv.config();

const STAGE = process.env.STAGE || 'ors-benchmark';
const main = async () => {
  switch (STAGE) {
    case 'parse-kml': {
      return parseKMLDir();
    }
    case 'pelias-populate': {
      return peliasPopulate();
    }
    case 'pelias-geocoding-benchmark': {
      return peliasGeocodingBenchmark();
    }
    case 'pelias-autocomplete-benchmark': {
      return peliasAutocompleteBenchmark();
    }
    case 'ors-benchmark': {
      return orsBenchmark();
    }
    case 'average': {
      return average();
    }
    default: {
      console.log('Invalid stage');
    }
  }
};

main().then(() => {
  // kill pm2
  // process.exit(0);
});
