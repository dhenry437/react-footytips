const express = require("express");
const router = express.Router();

const { getFixture } = require("../controllers/fixture.controller");

router.post("/get-data", getFixture);

module.exports = router;
