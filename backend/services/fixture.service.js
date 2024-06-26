const axios = require("axios");
const csv = require("csvtojson");
const dayjs = require("dayjs");

const db = require("../db");
const { addHoursToDate } = require("../util");
const Sequelize = db.Sequelize;
const Match = db.matches;
const UpdateLog = db.updateLog;
const Op = Sequelize.Op;

const ffToOa = {
  "Western Bulldogs": "Western Bulldogs",
  "Brisbane Lions": "Brisbane Lions",
  "St Kilda": "St Kilda Saints",
  Carlton: "Carlton Blues",
  Sydney: "Sydney Swans",
  Essendon: "Essendon Bombers",
  // ? Hopefully this will hanle when and if
  // ? the Demons change their name back from Naarm
  Melbourne: "Melbourne Demons",
  Naarm: "Melbourne Demons",
  Adelaide: "Adelaide Crows",
  "North Melbourne": "North Melbourne Kangaroos",
  Geelong: "Geelong Cats",
  Collingwood: "Collingwood Magpies",
  "Gold Coast": "Gold Coast Suns",
  "West Coast": "West Coast Eagles",
  Richmond: "Richmond Tigers",
  Hawthorn: "Hawthorn Hawks",
  GWS: "Greater Western Sydney Giants",
  "Port Adelaide": "Port Adelaide Power",
  Fremantle: "Fremantle Dockers",
};

const getFixtureFromFanfooty = async () => {
  const csvHeader = process.env.FF_CSV_HEADER;

  // Get the fixture CSV body from the fan footy resource
  const response = await axios
    .get(process.env.FF_FIXTURE_URL)
    .catch(function (error) {
      return error.response;
    });

  // Prepend CSV column header
  let csvFixture = `${csvHeader}\n${response.data}`;
  // ? Postgres does not like null integers of the form "", so we properly set them to null
  csvFixture = csvFixture.replaceAll(/(""|'')(,|\n|\R|$|.?)/g, "null,");

  return csvFixture;
};

const insertCsvIntoDb = async csvString => {
  await Match.destroy({ where: {} });
  await csv({ nullObject: true, trim: true })
    .fromString(csvString)
    .then(async csvRows => {
      await Match.bulkCreate(csvRows, { logging: false });
    });

  // Handle the shit that was the beginning of 2022
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

const logFixtureRefresh = async (req, reason) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || "dev";

  const updateLog = await UpdateLog.create({
    ip: ip,
    reason: reason,
  });
};

const canRefreshFixture = async () => {
  const lastLog = await UpdateLog.findOne({
    order: [["updatedAt", "DESC"]],
  });

  return lastLog
    ? dayjs().isAfter(dayjs(lastLog.updatedAt).add(10, "minute"))
    : true;
};

const getSeasonsFromDb = async () => {
  // Select distinct values for column year
  const matches = await Match.findAll({
    attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("year")), "year"]],
    order: [["year", "ASC"]],
  });
  // convert from [{ key: value }, { key: value }, ...] to [value, value, ...]
  seasons = matches.map(x => x.year);

  return seasons;
};

const getRoundsFromDb = async season => {
  // Select distinct values for column season
  let matches = await Match.findAll({
    attributes: [
      [Sequelize.fn("DISTINCT", Sequelize.col("round")), "round"],
      "competition",
    ],
    where: { year: season },
    order: [["round", "ASC"]],
  });

  if (matches.length === 0) return;

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
  let fixtureRequiresRefresh = false;
  if (season === new Date().getFullYear()) {
    matches = await Match.findAll({
      attributes: [
        "gametime",
        "home_points",
        "away_points",
        "round",
        "competition",
      ],
      where: { year: season },
      order: [["id", "ASC"]],
    });

    for (let match of matches) {
      const { gametime, home_points, away_points, round } = match;
      if (dayjs().isAfter(dayjs(gametime).add(3, "hour"))) {
        if (!home_points || !away_points) {
          fixtureRequiresRefresh = { round, gametime };
          break;
        }
      }
    }

    const nextMatch = matches.find(x =>
      dayjs(x.gametime).add(6, "hour").isAfter(dayjs())
    );

    if (nextMatch.competition == "QF" || nextMatch.competition == "EF") {
      currentRound = "QF and EF";
    } else if (nextMatch.competition !== "HA") {
      currentRound = nextMatch.competition;
    } else {
      currentRound = nextMatch.round;
    }
  }
  currentRound.toString();

  console.log({
    preliminary,
    homeAway,
    finals,
    currentRound,
    fixtureRequiresRefresh,
  });

  return {
    preliminary,
    homeAway,
    finals,
    currentRound,
    fixtureRequiresRefresh,
  };
};

const getMatchesFromDb = async (year, round) => {
  let matches = null;

  if (!isNaN(round)) {
    matches = await Match.findAll({
      where: { year: year, round: round, competition: "HA" },
      order: [["id", "ASC"]],
    });
  } else if (
    round.toString().includes("QF") &&
    round.toString().includes("EF")
  ) {
    matches = await Match.findAll({
      where: { year: year, competition: { [Op.or]: ["QF", "EF"] } },
      order: [["id", "ASC"]],
    });
  } else {
    matches = await Match.findAll({
      where: { year: year, competition: round },
      order: [["id", "ASC"]],
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
    .get(
      `https://api.the-odds-api.com/v4/sports/aussierules_afl/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=au&markets=h2h`
    )
    .catch(function (error) {
      return error.response;
    });

  let matchesAndOdds = [...matches];
  matches.forEach((match, i) => {
    matchesAndOdds[i].odds = {};
    odds.data.forEach(odd => {
      if (
        odd.home_team === ffToOa[match.home_team] &&
        odd.away_team === ffToOa[match.away_team]
      ) {
        odd.bookmakers.forEach(bookmaker => {
          matchesAndOdds[i].odds[bookmaker.title] = {};
          bookmaker.markets[0].outcomes.forEach(outcome => {
            if (outcome.name === odd.home_team) {
              matchesAndOdds[i].odds[bookmaker.title].home = outcome.price;
            } else if (outcome.name === odd.away_team) {
              matchesAndOdds[i].odds[bookmaker.title].away = outcome.price;
            }
          });
        });
      }
    });
  });

  return matchesAndOdds;
};

module.exports = {
  getFixtureFromFanfooty,
  insertCsvIntoDb,
  logFixtureRefresh,
  canRefreshFixture,
  getSeasonsFromDb,
  getRoundsFromDb,
  getMatchesFromDb,
  getOddsFromApi,
};
