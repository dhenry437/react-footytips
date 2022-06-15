var sqlite3 = require("sqlite3").verbose();
const { Sequelize } = require("sequelize");

const DBSOURCE = "db.sqlite";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "db.sqlite",
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.fixture = require("./fixture.model.js")(sequelize, Sequelize);

module.exports = db;
