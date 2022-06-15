require("dotenv").config();

const express = require("express");
const app = express();

const db = require("./db");
db.sequelize.sync();
// db.sequelize.sync({ force: true })

app.use(express.json()); //Used to parse JSON bodies

app.use(require("./routes/index.route"));

app.listen(3001, () => {
  console.log("Listening on port 3001");
});
