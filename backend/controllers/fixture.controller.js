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
const { roundsToSquiggleDict } = require("../dict");

const getFixture = async (req, res) => {
  const { status, data } = await tryRefreshFixture(req, "manual");
  return res.status(status).send(data);
};

const tryRefreshFixture = async (req, reason, year, round) => {
  // console.log("--\ntryRefreshFixture()\n--");
  if (await canRefreshFixture()) {
    try {
      await logFixtureRefresh(req, reason);
      const jsonFixture = await getFixtureSquiggleApi(
        year,
        roundsToSquiggleDict[round]
      );
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
  // await tryRefreshFixture(req, "page load");

  const seasons = await getSeasonsFromDb();

  if (!seasons) {
    res.status(500).send({ type: "danger", message: "Error fetching seasons" });
    return;
  }

  res.send(seasons);
};

const getRounds = async (req, res) => {
  const year = parseInt(req.query?.year);

  if (!Number.isInteger(year)) {
    res.status(400).send('Invalid value for query parameter "year"');
    return;
  }

  const rounds = await getRoundsFromDb(year);
  if (!rounds) {
    res.status(500).send({ type: "danger", message: "Error fetching rounds" });
    return;
  }

  res.send(rounds);
};

const getMatches = async (req, res) => {
  const year = parseInt(req.query?.year);
  const round = req.query?.round;

  if (!Number.isInteger(year)) {
    res.status(400).send('Invalid value for query parameter "year"');
    return;
  }

  await tryRefreshFixture(req, `get round ${round} ${year}`, year, round);
  const matches = await getMatchesFromDb(year, round);

  res.send(matches);
};

const getOdds = async (req, res) => {
  const year = parseInt(req.body?.year);
  const round = req.body?.round;
  const matches = req.body?.matches;

  if (!Number.isInteger(year)) {
    res.status(400).send('Invalid value for body parameter "year"');
    return;
  }

  const rounds = await getOddsFromApi(matches, year, round);

  res.send(rounds);
};

module.exports = {
  getFixture,
  getSeasons,
  getRounds,
  getMatches,
  getOdds,
};
