const {
  getFixtureFromFanfooty,
  insertCsvIntoDb,
  getSeasonsFromDb,
  getRoundsFromDb,
  getMatchesFromDb,
} = require("../services/fixture.service");

const getFixture = async (req, res) => {
  const { secret } = req.body;

  // ? Check secret to ensure this action is intended to avoid hitting the
  // ? fanfooty server too much
  if (secret !== process.env.GET_DATA_SECRET) {
    res.status = 403;
    res.send("Invalid secret");
    return;
  }

  fixtureCsv = await getFixtureFromFanfooty();
  await insertCsvIntoDb(fixtureCsv);

  res.send("Database refreshed succesfully");
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

  const rounds = await getMatchesFromDb(season, round);

  res.send(rounds);
};

module.exports = {
  getFixture,
  getSeasons,
  getRounds,
  getMatches,
};
