const axios = require("axios");
const csv = require('csvtojson');
const request = require("request");

const db = require('../db')
const Match = db.matches

const getFixtureFromFanfooty = async () => {
  const csvHeader = process.env.FF_CSV_HEADER;

  // Get the fixture CSV body from the fan footy resource
  const response = await axios
    .get(process.env.FF_FIXTURE_URL)
    .catch(function (error) {
      return error.response;
    });

  // Prepend CSV column header
  const csvFixture = `${csvHeader}\n${response.data}`;

  return csvFixture;
};

const insertCsvIntoDb = csvString => {
  Match.destroy({ where: {} })
  csv()
    .fromString(csvString)
    .then((csvRow) => {
      Match.bulkCreate(csvRow)
    })
}

// ! This dosen't work but should be faster
const getFixtureLoadIntoDB = async () => {
  csv()
    .fromStream(request.get(process.env.FF_FIXTURE_URL))
    .subscribe((json) => {
      return new Promise((resolve, reject) => {
        Match.create(json)
      })
    });
}

module.exports = {
  getFixtureFromFanfooty,
  insertCsvIntoDb,
  getFixtureLoadIntoDB
};
