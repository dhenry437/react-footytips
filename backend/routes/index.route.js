const express = require("express");
const router = express.Router();

const {
  getFixture,
  getSeasons,
  getRounds,
  getMatches,
  getOdds,
} = require("../controllers/fixture.controller");

const { sendEmail } = require("../controllers/email.controller");

router.get("/refresh-data", getFixture);

// Get all seasons (years)
router.get("/seasons", getSeasons);

//GET /api/rounds?season=[YEAR]
router.get("/rounds", getRounds);

router.get("/current-round");

// GET /api/matches?season=[YEAR]&round=[ROUND]
router.get("/matches", getMatches);

// GET /api/odds?season=[YEAR]&round=[ROUND]
router.post("/odds", getOdds);

router.post("/send-email", sendEmail);

module.exports = router;
