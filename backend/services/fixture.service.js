const axios = require("axios");
const csv = require("csvtojson");
const dayjs = require("dayjs");

const db = require("../db");
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
  // ? Hopefully this will handle when and if
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

// Return data from squiggle api as csv for entry into db
const getFixtureSquiggleApi = async (year, round) => {
  if (!year) year = dayjs().year();

  const response = await axios
    .get(process.env.SQUIGGLEAPI_URL, {
      params: { q: "games", year: year, round: round },
      headers: {
        "User-Agent": "footytipping.dhnode.com | dhenry437@gmail.com",
      },
    })
    .catch(function (error) {
      return error.response;
    });

  return response.data.games;
};

const insertJsonIntoDb = async json => {
  await Match.bulkCreate(json, {
    updateOnDuplicate: ["year", "hteam", "ateam", "round"],
  }); // { updateOnDuplicate: ["id"] } // ! Depending which approach is right this could cause problems
};

const logFixtureRefresh = async (req, reason) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || "dev";

  await UpdateLog.create({
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
  const seasons = await Match.findAll({
    attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("year")), "year"]],
    order: [["year", "ASC"]],
  });
  if (seasons.length === 0) return;

  // convert from [{ key: value }, { key: value }, ...] to [value, value, ...]
  seasons = seasons.map(x => x.year);

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

  if (matches.length === 0) return;

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
  getFixtureSquiggleApi,
  insertJsonIntoDb,
  logFixtureRefresh,
  canRefreshFixture,
  getSeasonsFromDb,
  getRoundsFromDb,
  getMatchesFromDb,
  getOddsFromApi,
};
