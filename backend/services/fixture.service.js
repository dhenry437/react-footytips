const axios = require("axios");
const csv = require("csvtojson");

const db = require("../db");
const Sequelize = db.Sequelize;
const Match = db.matches;
const Op = Sequelize.Op;

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

const insertCsvIntoDb = async csvString => {
  Match.destroy({ where: {} });
  await csv()
    .fromString(csvString)
    .then(csvRow => {
      Match.bulkCreate(csvRow, { logging: false });
    });

  // Handle the shit that was the begining of 2022
  await Match.destroy({
    where: {
      year: 2022,
      competition: "HA",
      gametime: {
        [Op.between]: [
          new Date("2022-01-07 08:15:00.000 +00:00"),
          new Date("2022-03-13 06:10:00.000 +00:00"),
        ],
      },
    },
  });
};

const getSeasonsFromDb = async () => {
  // Select disticnt values for column year
  seasons = await Match.findAll({
    attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("year")), "year"]],
  });

  console.log(seasons);
  // convert from [{ key: value }, { key: value }, ...] to [value, value, ...]
  seasons = seasons.map(x => x.year);

  return seasons;
};

const getRoundsFromDb = async (year = null) => {
  // Select disticnt values for column year
  rounds = await Match.findAll({
    attributes: [
      [Sequelize.fn("DISTINCT", Sequelize.col("round")), "round"],
      "competition",
    ],
    where: { year: year },
  });

  let preliminary = rounds.filter(x => x.competition.startsWith("P"));
  preliminary = preliminary.map(x => x.competition);

  let homeAway = rounds.filter(x => x.competition === "HA");
  homeAway = homeAway.map(x => x.round);

  let finals = rounds.filter(x => x.competition.endsWith("F"));
  finals = finals.map(x => x.competition);
  if (finals.includes("QF") && finals.includes("EF")) {
    finals = finals.filter(x => x !== "QF" && x !== "EF");
    finals = ["QF and EF", ...finals];
  }

  return { preliminary, homeAway, finals };
};

module.exports = {
  getFixtureFromFanfooty,
  insertCsvIntoDb,
  getSeasonsFromDb,
  getRoundsFromDb,
};
