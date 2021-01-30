const csv = require('csv-parser');
const fs = require('fs');

const REFERENCE_PATH = "./AreaInformation.csv"

function validate(rowsToInsert) {

  const { city, state } = rowsToInsert;
  return fs.createReadStream(REFERENCE_PATH)
    .pipe(csv())
    .on('data', (row) => {
      // TODO validate here
      const { Province, City, Area} = row;
      
      // if (city == City && state == Area) return true; 
      return true;
    })
    .on('end', () => {
      console.log('CSV file successfully processed');
    });
}

module.exports = { validate }