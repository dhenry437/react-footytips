const { getFixtureFromFanfooty } = require("../services/fixture.service");

const getFixture = async (req, res) => {
  // const { secret } = req.body;
  // Check secret to ensure this action is intended to avoid hitting the
  // fanfooty server too much
  // if (secret !== process.env.GET_DATA_SECRET) {
  //   res.status = 403;
  //   res.send("Invalid secret");
  //   return;
  // }

  fixture = await getFixtureFromFanfooty();

  res.send(fixture);
};

module.exports = {
  getFixture,
};
