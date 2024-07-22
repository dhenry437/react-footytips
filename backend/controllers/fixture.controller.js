const {
  getSeasonsFromDb,
  getRoundsFromDb,
  getMatchesFromDb,
  getOddsFromApi,
  logFixtureRefresh,
  canRefreshFixture,
  getFixtureSquiggleApi,
  insertJsonIntoDb,
} = require("../services/fixture.service");

const getFixture = async (req, res) => {
  const { status, data } = await tryRefreshFixture("manual", req);
  return res.status(status).send(data);
};

const tryRefreshFixture = async (reason, req) => {
  if (await canRefreshFixture()) {
    try {
      await logFixtureRefresh(req, reason);
      const jsonFixture = await getFixtureSquiggleApi();
      await insertJsonIntoDb(jsonFixture);
    } catch (e) {
      console.log(e);
      return {
        status: 500,
        data: {
          type: "error",
          message: "An error occurred, check node logs",
        },
      };
    }
  } else {
    console.log("Too soon to refresh data");
    return {
      status: 503,
      data: { type: "info", message: "Too soon to refresh data" },
    };
  }

  return {
    status: 200,
    data: { type: "success", message: "Database refreshed successfully" },
  };
};

const getSeasons = async (req, res) => {
  await tryRefreshFixture("page load", req);

  const seasons = await getSeasonsFromDb();

  if (!seasons) {
    res.status(500).send({ type: "danger", message: "Error fetching seasons" });
    return;
  }

  res.send(seasons);
};

const getRounds = async (req, res) => {
  const season = parseInt(req.query?.season);

  if (!Number.isInteger(season)) {
    res.status(400).send('Invalid value for query parameter "season"');
    return;
  }

  const rounds = await getRoundsFromDb(season);
  if (!rounds) {
    res.status(500).send({ type: "danger", message: "Error fetching rounds" });
    return;
  }
  const { fixtureRequiresRefresh } = rounds;

  // ? If a match is 3 hours in the past but with no scores,
  // ? should indicate a db refresh is needed

  res.send(rounds);
};

const getMatches = async (req, res) => {
  const season = parseInt(req.query?.season);
  const round = req.query?.round;

  if (!Number.isInteger(season)) {
    res.status(400).send('Invalid value for query parameter "season"');
    return;
  }

  await tryRefreshFixture();
  const matches = await getMatchesFromDb(season, round);

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
