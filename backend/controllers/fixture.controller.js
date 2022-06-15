const {
  getFixtureFromFanfooty,
  insertCsvIntoDb,
  // getFixtureLoadIntoDB,
  getSeasonsFromDb,
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

  // getFixtureLoadIntoDB()

  res.send(200);
};

const getSeasons = async (req, res) => {
  const seasons = await getSeasonsFromDb();

  res.send(seasons);
};

module.exports = {
  getFixture,
  getSeasons,
};
