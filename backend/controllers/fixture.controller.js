const {
  getFixtureFromFanfooty,
  insertCsvIntoDb,
  getSeasonsFromDb,
  getRoundsFromDb,
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
  const year = parseInt(req.query?.year);

  if (!Number.isInteger(year)) {
    res.status(400).send("Invalid query parameter year");
    return;
  }

  const rounds = await getRoundsFromDb(year);

  res.send(rounds);
};

module.exports = {
  getFixture,
  getSeasons,
  getRounds,
};
