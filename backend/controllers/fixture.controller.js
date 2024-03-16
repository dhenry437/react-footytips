const dayjs = require("dayjs");

const {
  getFixtureFromFanfooty,
  insertCsvIntoDb,
  getSeasonsFromDb,
  getRoundsFromDb,
  getMatchesFromDb,
  getOddsFromApi,
  logFixtureRefresh,
  canRefreshFixture,
} = require("../services/fixture.service");

const getFixture = async (req, res) => {
  const { secret } = req.body;

  // ? Check secret to ensure this action is intended to avoid hitting the
  // ? fanfooty server too much
  if (secret !== process.env.GET_DATA_SECRET) {
    res.status(403).send({ type: "warning", message: "Invalid secret" });
    return;
  }

  const { status, data } = await tryRefreshFixture("manual", req);
  return res.status(status).send(data);

  // if (await canRefreshFixture()) {
  //   try {
  //     await logFixtureRefresh(
  //       req,
  //       secret === process.env.GET_DATA_SECRET ? "manual" : "auto"
  //     );
  //     const fixtureCsv = await getFixtureFromFanfooty();
  //     await insertCsvIntoDb(fixtureCsv);
  //   } catch (e) {
  //     console.log(e);
  //     res
  //       .status(500)
  //       .send({ type: "error", message: "An error occurred, check node logs" });
  //     return;
  //   }
  // } else {
  //   res.status(503).send({ type: "info", message: "Too soon to refresh" });
  //   return;
  // }

  // res.send({ type: "success", message: "Database refreshed successfully" });
};

const tryRefreshFixture = async (reason, req) => {
  if (await canRefreshFixture()) {
    try {
      await logFixtureRefresh(req, reason);
      const fixtureCsv = await getFixtureFromFanfooty();
      await insertCsvIntoDb(fixtureCsv);
    } catch (e) {
      console.log(e);
      return {
        status: 500,
        data: { type: "error", message: "An error occurred, check node logs" },
      };
    }
  } else {
    return {
      status: 503,
      data: { type: "info", message: "Too soon to refresh" },
    };
  }

  return {
    status: 200,
    data: { type: "success", message: "Database refreshed successfully" },
  };
};

const getSeasons = async (req, res) => {
  const seasons = await getSeasonsFromDb();

  res.send(seasons);
};

const getRounds = async (req, res) => {
  const season = parseInt(req.query?.season);

  if (!Number.isInteger(season)) {
    res.status(400).send('Invalid value for query parameter "season"');
    return;
  }

  const rounds = await getRoundsFromDb(season);

  res.send(rounds);
};

const getMatches = async (req, res) => {
  const season = parseInt(req.query?.season);
  const round = req.query?.round;

  if (!Number.isInteger(season)) {
    res.status(400).send('Invalid value for query parameter "season"');
    return;
  }

  const matches = await getMatchesFromDb(season, round);

  // ? If a match is 3 hours in the past but with no scores,
  // ? should indicate a db refresh is needed
  if (await canRefreshFixture()) {
    for (let match of matches) {
      const { gametime, home_points, away_points } = match;
      if (dayjs().isAfter(dayjs(gametime).add(3, "hour"))) {
        if (!home_points || !away_points) {
          const resTryRefreshFixture = await tryRefreshFixture(
            `round ${round} match at time ${dayjs(gametime).format(
              "DD/MM/YYYY HH:mm:ss"
            )} is in the past with no scores`,
            req
          );
          if (resTryRefreshFixture.status === 200) {
            await getMatches(req, res);
          }
          return;
        }
      }
    }
  }

  res.send(matches);
};

const getOdds = async (req, res) => {
  const season = parseInt(req.body?.season);
  const round = req.body?.round;
  const matches = req.body?.matches;

  if (!Number.isInteger(season)) {
    res.status(400).send('Invalid value for body parameter "season"');
    return;
  }

  const rounds = await getOddsFromApi(matches, season, round);

  res.send(rounds);
};

module.exports = {
  getFixture,
  getSeasons,
  getRounds,
  getMatches,
  getOdds,
};
