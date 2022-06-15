var sqlite3 = require("sqlite3").verbose();
const { Sequelize } = require("sequelize");

const DBSOURCE = "db.sqlite";

let db = new sqlite3.Database(DBSOURCE, err => {
  if (err) {
    // Cannot open database
    console.error(err.message);
    throw err;
  }
});

const sequelize = new Sequelize({
  dialect: DBSOURCE,
  storage: "../db.sqlite",
});

module.exports = {
  sequelize,
};
