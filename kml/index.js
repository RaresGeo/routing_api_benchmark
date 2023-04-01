import jsonfile from 'jsonfile';
import parseKML from 'parse-kml';
// KML To JSON From File

const fileName = 'test';

parseKML
  .toJson(`kml/input/${fileName}.kml`)
  .then((res) => {
    console.log(res);
    jsonfile.writeFile(
      `input/${fileName}.json`,
      res,
      { spaces: 2 },
      function (err) {
        console.error(err);
      }
    );
  })
  .catch(console.error);
