const axios = require("axios");
const csv = require("csvtojson");
const dayjs = require("dayjs");

const {
  isFinalDict,
  isFinalDictInverse,
  squiggleToOddsApiDict,
} = require("../dict");

const db = require("../db");
const Sequelize = db.Sequelize;
const Match = db.matches;
const UpdateLog = db.updateLog;
const Op = Sequelize.Op;

const squiggleUserAgent = "footytipping.dhnode.com | dhenry437@gmail.com";

// Return data from squiggle api as json for entry into db
const getFixtureSquiggleApi = async (year, round) => {
  if (!year) year = dayjs().year();

  const response = await axios
    .get(process.env.SQUIGGLEAPI_URL, {
      params: { q: "games", year: year, round: round },
      headers: {
        "User-Agent": squiggleUserAgent,
      },
    })
    .catch(function (error) {
      return error.response;
    });

  return response.data.games;
};

const insertJsonIntoDb = async json => {
  // const matchColumns = Object.keys(Match.rawAttributes);

  // await Match.bulkCreate(json, {
  //   // ? List of fields to update when there is a duplicate PK
  //   updateOnDuplicate: matchColumns,
  // });

  // ? JSON will be null if data.games was null from Squiggle
  if (json) {
    // Destroy matching records
    const years = [...new Set(json.map(x => x.year))];
    console.log(`years = ${years}`);
    const rounds = [...new Set(json.map(x => x.round))];
    console.log(`rounds = ${rounds}`);
    await Match.destroy({
      where: {
        year: years,
        round: rounds,
      },
    });
    // Insert new records
    await Match.bulkCreate(json);
  } else {
    console.log(
      "ERROR: insertJsonIntoDb() - data.games was null from Squiggle"
    );
  }
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

  // TODO Work out how to limit requests
  // return lastLog
  //   ? dayjs().isAfter(dayjs(lastLog.updatedAt).add(10, "minute"))
  //   : true;
  return true;
};

const getSeasonsFromDb = async () => {
  // Select distinct values for column year
  const seasons = await Match.findAll({
    attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("year")), "year"]],
    order: [["year", "ASC"]],
  });
  if (seasons.length === 0) return;

  // convert from [{ key: value }, { key: value }, ...] to [value, value, ...]
  return seasons.map(x => x.year);
};

const getRoundsFromDb = async year => {
  // Select distinct values for column year
  let matches = await Match.findAll({
    attributes: [
      [Sequelize.fn("DISTINCT", Sequelize.col("round")), "round"],
      "is_final",
    ],
    where: { year: year },
    order: [["round", "ASC"]],
  });

  if (matches.length === 0) return; // ? Is this needed?

  let homeAway = matches.filter(x => x.is_final === 0);
  homeAway = homeAway.map(x => x.round);

  let finals = matches.filter(x => x.is_final !== 0); // Filter finals (is_final != 0)
  finals = finals.map(x => isFinalDict[x.is_final]); // Map is_final to human readable
  // Combine QF and EF
  if (finals.includes("QF") && finals.includes("EF")) {
    finals = finals.filter(x => x !== "QF" && x !== "EF");
    finals = ["QF and EF", ...finals];
  }

  let currentRound = null;
  if (year === new Date().getFullYear()) {
    matches = await Match.findAll({
      attributes: ["unixtime", "hscore", "ascore", "round", "is_final"],
      where: { year: year },
      order: [["date", "ASC"]],
    });

    const nextMatch = matches.find(
      // Add 6 hours to gametime so that it is not instantly the next round
      x => dayjs.unix(x.unixtime).add(6, "hour").isAfter(dayjs())
    );

    if (
      isFinalDict[nextMatch.is_final] == "QF" ||
      isFinalDict[nextMatch.is_final] == "EF"
    ) {
      currentRound = "QF and EF";
    } else if (isFinalDict[nextMatch.is_final] !== "HA") {
      currentRound = isFinalDict[nextMatch.is_final];
    } else {
      currentRound = nextMatch.round;
    }
  }
  currentRound.toString();

  return {
    homeAway,
    finals,
    currentRound,
  };
};

const getMatchesFromDb = async (year, round) => {
  // console.log("--\ngetMatchesFromDb()\n--");
  let matches = null;

  if (!isNaN(round)) {
    matches = await Match.findAll({
      where: { year: year, round: round, is_final: isFinalDictInverse["HA"] },
      order: [["unixtime", "ASC"]],
    });
  } else if (
    round.toString().includes("QF") &&
    round.toString().includes("EF")
  ) {
    matches = await Match.findAll({
      where: {
        year: year,
        is_final: {
          [Op.or]: [isFinalDictInverse["QF"], isFinalDictInverse["EF"]],
        },
      },
      order: [["id", "ASC"]],
    });
  } else {
    matches = await Match.findAll({
      where: { year: year, is_final: isFinalDictInverse[round] },
      order: [["id", "ASC"]],
    });
  }

  if (matches.length === 0) return;

  // Keep only the properties we need
  matches = matches.map(
    ({ unixtime, complete, hteam, ateam, venue, hscore, ascore }) => ({
      unixtime,
      percentComplete: complete,
      hteam,
      ateam,
      venue,
      hscore,
      ascore,
    })
  );

  matches.map(x => (x.selected = null));

  return matches;
};

const getOddsFromApi = async (matches, year, round) => {
  const odds = await axios
    .get("https://api.the-odds-api.com/v4/sports/aussierules_afl/odds/", {
      params: {
        apiKey: process.env.ODDS_API_KEY,
        regions: "au",
        markets: "h2h",
      },
    })
    .catch(function (error) {
      return error.response;
    });

  let matchesAndOdds = [...matches];
  matches.forEach((match, i) => {
    matchesAndOdds[i].odds = {};
    odds.data.forEach(odd => {
      if (
        odd.home_team === squiggleToOddsApiDict[match.hteam] &&
        odd.away_team === squiggleToOddsApiDict[match.ateam]
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
