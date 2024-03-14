const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.matches = require("./match.model.js")(sequelize, Sequelize);
db.updateLog = require("./updateLog.model.js")(sequelize, Sequelize);

module.exports = db;
