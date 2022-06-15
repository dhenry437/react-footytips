const axios = require("axios");
const csv = require("csvtojson");
const request = require("request");

const db = require("../db");
const Sequelize = db.Sequelize;
const Match = db.matches;

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
  Match.destroy({ where: {} });
  csv()
    .fromString(csvString)
    .then(csvRow => {
      Match.bulkCreate(csvRow);
    });
};

// ! This dosen't work but should be faster
const getFixtureLoadIntoDB = async () => {
  csv()
    .fromStream(request.get(process.env.FF_FIXTURE_URL))
    .subscribe(json => {
      return new Promise((resolve, reject) => {
        Match.create(json);
      });
    });
};

const getSeasonsFromDb = async () => {
  // Select disticnt values for column year
  seasons = await Match.findAll({
    attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("year")), "year"]],
  });

  // convert from [{ key: value }, { key: value }, ...] to [value, value, ...]
  seasons = seasons.map(x => x.year);

  return seasons;
};

module.exports = {
  getFixtureFromFanfooty,
  insertCsvIntoDb,
  getFixtureLoadIntoDB,
  getSeasonsFromDb,
};
