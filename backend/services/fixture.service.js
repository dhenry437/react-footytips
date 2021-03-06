const axios = require("axios");
const csv = require("csvtojson");

const db = require("../db");
const Sequelize = db.Sequelize;
const Match = db.matches;
const Op = Sequelize.Op;

const ffToOa = {
  "Western Bulldogs": "Western Bulldogs",
  "Brisbane Lions": "Brisbane Lions",
  "St Kilda": "St Kilda Saints",
  "Carlton": "Carlton Blues",
  "Sydney": "Sydney Swans",
  "Essendon": "Essendon Bombers",
  // ? Hopefully this will hanle when and if
  // ? the Demons change their name back from Naarm
  "Melbourne": "Melbourne Demons",
  "Naarm": "Melbourne Demons",
  "Adelaide": "Adelaide Crows",
  "North Melbourne": "North Melbourne Kangaroos",
  "Geelong": "Geelong Cats",
  "Collingwood": "Collingwood Magpies",
  "Gold Coast": "Gold Coast Suns",
  "West Coast": "West Coast Eagles",
  "Richmond": "Richmond Tigers",
  "Hawthorn": "Hawthorn Hawks",
  "GWS": "Greater Western Sydney Giants",
  "Port Adelaide": "Port Adelaide Power",
  "Fremantle": "Fremantle Dockers"
}

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
  const matches = await Match.findAll({
    attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("year")), "year"]],
  });
  // convert from [{ key: value }, { key: value }, ...] to [value, value, ...]
  seasons = matches.map(x => x.year);

  return seasons;
};

const getRoundsFromDb = async season => {
  // Select disticnt values for column season
  let matches = await Match.findAll({
    attributes: [
      [Sequelize.fn("DISTINCT", Sequelize.col("round")), "round"],
      "competition",
    ],
    where: { year: season },
  });

  let preliminary = matches.filter(
    x => x.competition.startsWith("P") && x.round === 0
  );
  preliminary = preliminary.map(x => x.competition);

  let homeAway = matches.filter(x => x.competition === "HA");
  homeAway = homeAway.map(x => x.round);

  let finals = matches.filter(x => x.competition.endsWith("F"));
  finals = finals.map(x => x.competition);
  if (finals.includes("QF") && finals.includes("EF")) {
    finals = finals.filter(x => x !== "QF" && x !== "EF");
    finals = ["QF and EF", ...finals];
  }

  let currentRound = null;
  if (season === new Date().getFullYear()) {
    matches = await Match.findAll({
      attributes: ["gametime", "round", "competition"],
      where: { year: season },
    });

    // Taken from Zeta's answer to https://stackoverflow.com/questions/11795266/find-closest-date-in-array-with-javascript
    let testDate = new Date();
    let bestDate = matches.length;
    let bestDiff = -new Date(0, 0, 0).valueOf();
    let currDiff = 0;
    let i;

    for (i = 0; i < matches.length; ++i) {
      currDiff = Math.abs(new Date(matches[i].gametime) - testDate);
      if (currDiff < bestDiff) {
        bestDate = i;
        bestDiff = currDiff;
      }
    }

    const currentRoundDb = await Match.findAll({
      attributes: ["round", "competition"],
      where: { year: season, round: matches[bestDate].round },
    });

    if (
      currentRoundDb.some(x => x.competition == "QF") &&
      currentRoundDb.some(x => x.competition == "EF")
    ) {
      currentRound = "QF and EF";
    } else if (matches[bestDate].competition !== "HA") {
      currentRound = matches[bestDate].competition;
    } else {
      currentRound = matches[bestDate].round;
    }
  }

  if (currentRound) {
    currentRound.toString()
  }

  return { preliminary, homeAway, finals, currentRound };
};

const getMatchesFromDb = async (year, round) => {
  let matches = null;

  if (!isNaN(round)) {
    matches = await Match.findAll({
      where: { year: year, round: round },
    });
  } else if (
    round.toString().includes("QF") &&
    round.toString().includes("EF")
  ) {
    matches = await Match.findAll({
      where: { year: year, competition: { [Op.or]: ["QF", "EF"] } },
    });
  } else {
    matches = await Match.findAll({
      where: { year: year, competition: round },
    });
  }

  // Keep only the properties we need
  matches = matches.map(
    ({ gametime, home_team, away_team, ground, home_points, away_points }) => ({
      gametime,
      home_team,
      away_team,
      ground,
      home_points,
      away_points,
    })
  );

  matches.map(x => (x.selected = null));

  return matches;
};

const getOddsFromApi = async (matches, year, round) => {
  const odds = await axios
    .get(`https://api.the-odds-api.com/v4/sports/aussierules_afl/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=au&markets=h2h`)
    .catch(function (error) {
      return error.response;
    });

  let matchesAndOdds = [...matches];
  matches.forEach((match, i) => {
    matchesAndOdds[i].odds = {};
    odds.data.forEach(odd => {
      if (odd.home_team === ffToOa[match.home_team] &&
        odd.away_team === ffToOa[match.away_team]) {
        odd.bookmakers.forEach(bookmaker => {
          matchesAndOdds[i].odds[bookmaker.title] = {};
          bookmaker.markets[0].outcomes.forEach(outcome => {
            if (outcome.name === odd.home_team) {
              matchesAndOdds[i].odds[bookmaker.title].home = outcome.price;
            } else if (outcome.name === odd.away_team) {
              matchesAndOdds[i].odds[bookmaker.title].away = outcome.price;
            }
          })
        })
      }
    })
  })

  return matchesAndOdds;
}

module.exports = {
  getFixtureFromFanfooty,
  insertCsvIntoDb,
  getSeasonsFromDb,
  getRoundsFromDb,
  getMatchesFromDb,
  getOddsFromApi
};
