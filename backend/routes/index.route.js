const express = require("express");
const router = express.Router();

const {
  getFixture,
  getSeasons,
  getRounds,
  getMatches,
} = require("../controllers/fixture.controller");

router.post("/refresh-data", getFixture);

// Get all seasons (years)
router.get("/seasons", getSeasons);

//GET /api/rounds?season=[YEAR]
router.get("/rounds", getRounds);

router.get("/current-round");

// GET /api/matches?season=[YEAR]&round=[ROUND]
router.get("/matches", getMatches);

module.exports = router;
