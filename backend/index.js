require('dotenv-flow').config();

const express = require("express");
const cors = require('cors')

const corsOptions = {
  origin: process.env.CLIENT_CORS_ORIGIN,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

const app = express();
app.use(cors(corsOptions))

const db = require("./db");
db.sequelize.sync();
// db.sequelize.sync({ force: true })

app.use(express.json()); //Used to parse JSON bodies

app.use("/api", require("./routes/index.route"));

app.listen(3001, () => {
  console.log("Listening on port 3001");
});
