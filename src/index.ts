import dotenv from 'dotenv';
import orsAverage from './ors/average.js';
import orsBenchmark from './ors/benchmark.js';
import parseKMLDir from './utils/kml.js';
import peliasPopulate from './pelias/populateInput.js';
dotenv.config();

const STAGE = process.env.STAGE || 'ors-benchmark';

switch (STAGE) {
  case 'parse-kml': {
    parseKMLDir();
    break;
  }
  case 'pelias-populate': {
    peliasPopulate();
    break;
  }
  case 'ors-benchmark': {
    orsBenchmark();
    break;
  }
  case 'ors-average': {
    orsAverage();
    break;
  }
  default: {
    console.log('Invalid stage');
  }
}
