const express = require("express");
const router = express.Router();

const { getFixture, getSeasons } = require("../controllers/fixture.controller");

router.post("/get-data", getFixture);

// Get all seasons (years)
router.get("/seasons", getSeasons);

//GET /api/rounds?season=[YEAR]
router.get("/rounds");

// GET /api/matches?season=[YEAR]&round=[ROUND]
router.get("/matches");

module.exports = router;
