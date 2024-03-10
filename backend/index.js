require("dotenv-flow").config();

const express = require("express");
var https = require("https");
var http = require("http");
const cors = require("cors");
var compression = require("compression");
var helmet = require("helmet");

console.log(`CLIENT_CORS_ORIGIN = ${process.env.CLIENT_CORS_ORIGIN}`);

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

http.createServer(app).listen(process.env.HTTP_PORT, () => {
  console.log(`Listening on HTTP port ${process.env.HTTP_PORT}`);
});
https.createServer(app).listen(process.env.HTTPS_PORT, () => {
  console.log(`Listening on HTTPS port ${process.env.HTTPS_PORT}`);
});
