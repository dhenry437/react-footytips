require("dotenv-flow").config();

const express = require("express");
const cors = require("cors");
var compression = require("compression");
var helmet = require("helmet");

const corsOptions = {
  origin: process.env.CLIENT_CORS_ORIGIN,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

const app = express();
app.use(cors(corsOptions));

const db = require("./db");
db.sequelize.sync();
// db.sequelize.sync({ force: true })

app.use(express.json()); // Used to parse JSON bodies

app.use(compression()); //Compress all routes
app.use(helmet());

app.use("/api", require("./routes/index.route"));

app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
