import fs from 'fs';
import jsonfile from 'jsonfile';
import parseKML from 'parse-kml';
import path from 'path';

// KML To JSON From File

const inputDir = 'kml/input';

const main = () => {
  fs.readdir(inputDir, (err, files) => {
    if (err) {
      console.error(err);
      return;
    }

    files.forEach((file) => {
      const ext = path.extname(file);

      if (ext === '.kml') {
        const fileName = path.basename(file, ext);

        parseKML
          .toJson(path.join(inputDir, file))
          .then((res: any) => {
            console.log('Successfully parsed', file, 'to JSON');
            jsonfile.writeFile(
              `input/${fileName}.json`,
              res,
              { spaces: 2 },
              function (err) {
                if (err) {
                  console.error(err);
                }
              }
            );
          })
          .catch(console.error);
      }
    });
  });
};

export default main;
