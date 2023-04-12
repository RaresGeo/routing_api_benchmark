import axios from 'axios';
import dotenv from 'dotenv';
import jsonfile from 'jsonfile';
import benchmark from '../utils/benchmark.js';
import { getRandomPointInPolygon } from '../utils/utils.js';

dotenv.config();

const NUM_SECONDS = parseInt(process.env.NUM_SECONDS || '1', 10);
const NUM_REQUESTS = parseInt(process.env.NUM_REQUESTS || '1', 10);

const getPointsForAllRequests = (
  numberOfPoints: number,
  startCoords: number[][],
  endCoords: number[][]
) => {
  const startPoints = [];
  const endPoints = [];

  for (let i = 0; i < numberOfPoints; i++) {
    const startPoint = getRandomPointInPolygon(startCoords);
    const endPoint = getRandomPointInPolygon(endCoords);

    startPoints.push(startPoint);
    endPoints.push(endPoint);
  }

  return { startPoints, endPoints };
};

const main = async () => {
  const profileParam = 'driving-car';
  const startData = jsonfile.readFileSync(
    `input/${process.env.START_FILE}.json`
  );
  const startCoords = startData.features[0].geometry.coordinates[0];
  const endData = jsonfile.readFileSync(`input/${process.env.END_FILE}.json`);
  const endCoords = endData.features[0].geometry.coordinates[0];
  const { startPoints, endPoints } = getPointsForAllRequests(
    NUM_REQUESTS * NUM_SECONDS,
    startCoords,
    endCoords
  );

  const urlGetter = (timerIndex: number) => {
    return (index: number) =>
      `${process.env.ORS_API_URL}/v2/directions/${profileParam}/geojson`;
  };

  const bodyGetter = (timerIndex: number) => {
    return (index: number) => {
      const startPointsSection = startPoints.slice(
        NUM_REQUESTS * timerIndex,
        NUM_REQUESTS * (timerIndex + 1)
      );

      const endPointsSection = endPoints.slice(
        NUM_REQUESTS * timerIndex,
        NUM_REQUESTS * (timerIndex + 1)
      );

      return {
        coordinates: [startPointsSection[index], endPointsSection[index]],
      };
    };
  };

  benchmark(urlGetter, bodyGetter, axios.post, NUM_REQUESTS, NUM_SECONDS);
};

export default main;
