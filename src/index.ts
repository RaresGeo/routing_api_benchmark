import dotenv from 'dotenv';
import average from './ors/average.js';
import orsBenchmark from './ors/benchmark.js';
import parseKMLDir from './utils/kml.js';
import peliasPopulate from './pelias/populateInput.js';
import peliasBenchmark from './pelias/benchmark.js';
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
  case 'pelias-benchmark': {
    peliasBenchmark();
    break;
  }
  case 'ors-benchmark': {
    orsBenchmark();
    break;
  }
  case 'average': {
    average();
    break;
  }
  default: {
    console.log('Invalid stage');
  }
}
