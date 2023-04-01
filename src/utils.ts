export const getRandomPointInPolygon = (polygon: number[][]): number[] => {
  let minX = polygon[0][0];
  let minY = polygon[0][1];
  let maxX = polygon[0][0];
  let maxY = polygon[0][1];
  for (let i = 1; i < polygon.length; i++) {
    const x = polygon[i][0];
    const y = polygon[i][1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  let point: [number, number];
  let withinPolygon = false;
  do {
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    point = [x, y];
    withinPolygon = isPointInPolygon(point, polygon);
  } while (!withinPolygon);

  return point;
};

const isPointInPolygon = (point: number[], polygon: number[][]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersect =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};
