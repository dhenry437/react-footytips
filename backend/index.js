require("dotenv").config();

const express = require("express");
const app = express();

// var db = require("./db");
const { sequelize } = require("./db");

app.use(require("./routes/index.route"));

app.listen(3001, () => {
  console.log("Listening on port 3001");
});
