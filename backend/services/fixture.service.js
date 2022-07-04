const axios = require("axios");
const csv = require("csvtojson");

const db = require("../db");
const Sequelize = db.Sequelize;
const Match = db.matches;
const Op = Sequelize.Op;

const ffToOa = {
  "Western Bulldogs": "Western Bulldogs",
  "Brisbane Lions": "Brisbane Lions",
  "St Kilda": "St Kilda Saints",
  "Carlton": "Carlton Blues",
  "Sydney": "Sydney Swans",
  "Essendon": "Essendon Bombers",
  // ? Hopefully this will hanle when and if
  // ? the Demons change their name back from Naarm
  "Melbourne": "Melbourne Demons",
  "Naarm": "Melbourne Demons",
  "Adelaide": "Adelaide Crows",
  "North Melbourne": "North Melbourne Kangaroos",
  "Geelong": "Geelong Cats",
  "Collingwood": "Collingwood Magpies",
  "Gold Coast": "Gold Coast Suns",
  "West Coast": "West Coast Eagles",
  "Richmond": "Richmond Tigers",
  "Hawthorn": "Hawthorn Hawks",
  "GWS": "Greater Western Sydney Giants",
  "Port Adelaide": "Port Adelaide Power",
  "Fremantle": "Fremantle Dockers"
}

const getFixtureFromFanfooty = async () => {
  const csvHeader = process.env.FF_CSV_HEADER;

  // Get the fixture CSV body from the fan footy resource
  const response = await axios
    .get(process.env.FF_FIXTURE_URL)
    .catch(function (error) {
      return error.response;
    });

  // Prepend CSV column header
  const csvFixture = `${csvHeader}\n${response.data}`;

  return csvFixture;
};

const insertCsvIntoDb = async csvString => {
  Match.destroy({ where: {} });
  await csv()
    .fromString(csvString)
    .then(csvRow => {
      Match.bulkCreate(csvRow, { logging: false });
    });

  // Handle the shit that was the begining of 2022
  await Match.destroy({
    where: {
      year: 2022,
      competition: "HA",
      gametime: {
        [Op.between]: [
          new Date("2022-01-07 08:15:00.000 +00:00"),
          new Date("2022-03-13 06:10:00.000 +00:00"),
        ],
      },
    },
  });
};

const getSeasonsFromDb = async () => {
  // Select disticnt values for column year
  const matches = await Match.findAll({
    attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("year")), "year"]],
  });
  // convert from [{ key: value }, { key: value }, ...] to [value, value, ...]
  seasons = matches.map(x => x.year);

  return seasons;
};

const getRoundsFromDb = async season => {
  // Select disticnt values for column season
  let matches = await Match.findAll({
    attributes: [
      [Sequelize.fn("DISTINCT", Sequelize.col("round")), "round"],
      "competition",
    ],
    where: { year: season },
  });

  let preliminary = matches.filter(
    x => x.competition.startsWith("P") && x.round === 0
  );
  preliminary = preliminary.map(x => x.competition);

  let homeAway = matches.filter(x => x.competition === "HA");
  homeAway = homeAway.map(x => x.round);

  let finals = matches.filter(x => x.competition.endsWith("F"));
  finals = finals.map(x => x.competition);
  if (finals.includes("QF") && finals.includes("EF")) {
    finals = finals.filter(x => x !== "QF" && x !== "EF");
    finals = ["QF and EF", ...finals];
  }

  let currentRound = null;
  if (season === new Date().getFullYear()) {
    matches = await Match.findAll({
      attributes: ["gametime", "round", "competition"],
      where: { year: season },
    });

    // Taken from Zeta's answer to https://stackoverflow.com/questions/11795266/find-closest-date-in-array-with-javascript
    let testDate = new Date();
    let bestDate = matches.length;
    let bestDiff = -new Date(0, 0, 0).valueOf();
    let currDiff = 0;
    let i;

    for (i = 0; i < matches.length; ++i) {
      currDiff = Math.abs(new Date(matches[i].gametime) - testDate);
      if (currDiff < bestDiff) {
        bestDate = i;
        bestDiff = currDiff;
      }
    }

    const currentRoundDb = await Match.findAll({
      attributes: ["round", "competition"],
      where: { year: season, round: matches[bestDate].round },
    });

    if (
      currentRoundDb.some(x => x.competition == "QF") &&
      currentRoundDb.some(x => x.competition == "EF")
    ) {
      currentRound = "QF and EF";
    } else if (matches[bestDate].competition !== "HA") {
      currentRound = matches[bestDate].competition;
    } else {
      currentRound = matches[bestDate].round;
    }
  }

  if (currentRound) {
    console.log("currentRound to string");
    currentRound.toString()
  }

  return { preliminary, homeAway, finals, currentRound };
};

const getMatchesFromDb = async (year, round) => {
  let matches = null;

  if (!isNaN(round)) {
    matches = await Match.findAll({
      where: { year: year, round: round },
    });
  } else if (
    round.toString().includes("QF") &&
    round.toString().includes("EF")
  ) {
    matches = await Match.findAll({
      where: { year: year, competition: { [Op.or]: ["QF", "EF"] } },
    });
  } else {
    matches = await Match.findAll({
      where: { year: year, competition: round },
    });
  }

  // Keep only the properties we need
  matches = matches.map(
    ({ gametime, home_team, away_team, ground, home_points, away_points }) => ({
      gametime,
      home_team,
      away_team,
      ground,
      home_points,
      away_points,
    })
  );

  matches.map(x => (x.selected = null));

  return matches;
};

const getOddsFromApi = async (year, round) => {
  // const odds = await axios
  //   .get(`https://api.the-odds-api.com/v4/sports/aussierules_afl/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=au&markets=h2h`)
  //   .catch(function (error) {
  //     return error.response;
  //   });

  const matches = await getMatchesFromDb(year, round)

  const odds = [
    {
      "id": "dd7aff0584aee475b4d67ab83655f379",
      "sport_key": "aussierules_afl",
      "sport_title": "AFL",
      "commence_time": "2022-06-30T09:20:00Z",
      "home_team": "Brisbane Lions",
      "away_team": "Western Bulldogs",
      "bookmakers": [
        // {
        //   "key": "unibet",
        //   "title": "Unibet",
        //   "last_update": "2022-06-29T12:14:33Z",
        //   "markets": [
        //     {
        //       "key": "h2h",
        //       "outcomes": [
        //         {
        //           "name": "Brisbane Lions",
        //           "price": 1.36
        //         },
        //         {
        //           "name": "Western Bulldogs",
        //           "price": 3.15
        //         }
        //       ]
        //     }
        //   ]
        // },
        {
          "key": "ladbrokes",
          "title": "Ladbrokes",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Brisbane Lions",
                  "price": 1.38
                },
                {
                  "name": "Western Bulldogs",
                  "price": 3.15
                }
              ]
            }
          ]
        },
        {
          "key": "neds",
          "title": "Neds",
          "last_update": "2022-06-29T12:15:30Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Brisbane Lions",
                  "price": 1.38
                },
                {
                  "name": "Western Bulldogs",
                  "price": 3.15
                }
              ]
            }
          ]
        },
        {
          "key": "tab",
          "title": "TAB",
          "last_update": "2022-06-29T12:14:53Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Brisbane Lions",
                  "price": 1.37
                },
                {
                  "name": "Western Bulldogs",
                  "price": 3.15
                }
              ]
            }
          ]
        },
        {
          "key": "betfair",
          "title": "Betfair",
          "last_update": "2022-06-29T12:18:57Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Brisbane Lions",
                  "price": 1.41
                },
                {
                  "name": "Western Bulldogs",
                  "price": 3.35
                }
              ]
            },
            {
              "key": "h2h_lay",
              "outcomes": [
                {
                  "name": "Brisbane Lions",
                  "price": 1.42
                },
                {
                  "name": "Western Bulldogs",
                  "price": 3.4
                }
              ]
            }
          ]
        },
        {
          "key": "pointsbetau",
          "title": "PointsBet (AU)",
          "last_update": "2022-06-29T12:18:06Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Brisbane Lions",
                  "price": 1.36
                },
                {
                  "name": "Western Bulldogs",
                  "price": 3.2
                }
              ]
            }
          ]
        },
        {
          "key": "sportsbet",
          "title": "SportsBet",
          "last_update": "2022-06-29T12:18:51Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Brisbane Lions",
                  "price": 1.34
                },
                {
                  "name": "Western Bulldogs",
                  "price": 3.18
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "6dcee0aa3c3f8fd009d3bdd0d7fc97c2",
      "sport_key": "aussierules_afl",
      "sport_title": "AFL",
      "commence_time": "2022-07-01T09:50:00Z",
      "home_team": "Carlton Blues",
      "away_team": "St Kilda Saints",
      "bookmakers": [
        {
          "key": "unibet",
          "title": "Unibet",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Carlton Blues",
                  "price": 1.55
                },
                {
                  "name": "St Kilda Saints",
                  "price": 2.45
                }
              ]
            }
          ]
        },
        {
          "key": "ladbrokes",
          "title": "Ladbrokes",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Carlton Blues",
                  "price": 1.55
                },
                {
                  "name": "St Kilda Saints",
                  "price": 2.45
                }
              ]
            }
          ]
        },
        {
          "key": "neds",
          "title": "Neds",
          "last_update": "2022-06-29T12:15:30Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Carlton Blues",
                  "price": 1.55
                },
                {
                  "name": "St Kilda Saints",
                  "price": 2.45
                }
              ]
            }
          ]
        },
        {
          "key": "tab",
          "title": "TAB",
          "last_update": "2022-06-29T12:14:53Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Carlton Blues",
                  "price": 1.58
                },
                {
                  "name": "St Kilda Saints",
                  "price": 2.4
                }
              ]
            }
          ]
        },
        {
          "key": "betfair",
          "title": "Betfair",
          "last_update": "2022-06-29T12:18:57Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Carlton Blues",
                  "price": 1.61
                },
                {
                  "name": "St Kilda Saints",
                  "price": 2.56
                }
              ]
            },
            {
              "key": "h2h_lay",
              "outcomes": [
                {
                  "name": "Carlton Blues",
                  "price": 1.62
                },
                {
                  "name": "St Kilda Saints",
                  "price": 2.64
                }
              ]
            }
          ]
        },
        {
          "key": "pointsbetau",
          "title": "PointsBet (AU)",
          "last_update": "2022-06-29T12:18:06Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Carlton Blues",
                  "price": 1.54
                },
                {
                  "name": "St Kilda Saints",
                  "price": 2.45
                }
              ]
            }
          ]
        },
        {
          "key": "sportsbet",
          "title": "SportsBet",
          "last_update": "2022-06-29T12:18:51Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Carlton Blues",
                  "price": 1.54
                },
                {
                  "name": "St Kilda Saints",
                  "price": 2.43
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "4b766e85f31a0ff11837dd7794cf3250",
      "sport_key": "aussierules_afl",
      "sport_title": "AFL",
      "commence_time": "2022-07-02T03:45:00Z",
      "home_team": "Essendon Bombers",
      "away_team": "Sydney Swans",
      "bookmakers": [
        {
          "key": "unibet",
          "title": "Unibet",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Essendon Bombers",
                  "price": 3.1
                },
                {
                  "name": "Sydney Swans",
                  "price": 1.37
                }
              ]
            }
          ]
        },
        {
          "key": "ladbrokes",
          "title": "Ladbrokes",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Essendon Bombers",
                  "price": 3.0
                },
                {
                  "name": "Sydney Swans",
                  "price": 1.4
                }
              ]
            }
          ]
        },
        {
          "key": "neds",
          "title": "Neds",
          "last_update": "2022-06-29T12:15:30Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Essendon Bombers",
                  "price": 3.0
                },
                {
                  "name": "Sydney Swans",
                  "price": 1.4
                }
              ]
            }
          ]
        },
        {
          "key": "betfair",
          "title": "Betfair",
          "last_update": "2022-06-29T12:18:57Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Essendon Bombers",
                  "price": 3.2
                },
                {
                  "name": "Sydney Swans",
                  "price": 1.38
                }
              ]
            },
            {
              "key": "h2h_lay",
              "outcomes": [
                {
                  "name": "Essendon Bombers",
                  "price": 3.65
                },
                {
                  "name": "Sydney Swans",
                  "price": 1.46
                }
              ]
            }
          ]
        },
        {
          "key": "tab",
          "title": "TAB",
          "last_update": "2022-06-29T12:14:53Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Essendon Bombers",
                  "price": 3.15
                },
                {
                  "name": "Sydney Swans",
                  "price": 1.37
                }
              ]
            }
          ]
        },
        {
          "key": "pointsbetau",
          "title": "PointsBet (AU)",
          "last_update": "2022-06-29T12:18:06Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Essendon Bombers",
                  "price": 3.2
                },
                {
                  "name": "Sydney Swans",
                  "price": 1.34
                }
              ]
            }
          ]
        },
        {
          "key": "sportsbet",
          "title": "SportsBet",
          "last_update": "2022-06-29T12:18:51Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Essendon Bombers",
                  "price": 3.19
                },
                {
                  "name": "Sydney Swans",
                  "price": 1.36
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "5374c348259897d28b83ab162b09964c",
      "sport_key": "aussierules_afl",
      "sport_title": "AFL",
      "commence_time": "2022-07-02T06:35:00Z",
      "home_team": "Adelaide Crows",
      "away_team": "Melbourne Demons",
      "bookmakers": [
        {
          "key": "sportsbet",
          "title": "SportsBet",
          "last_update": "2022-06-29T12:18:51Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Adelaide Crows",
                  "price": 5.5
                },
                {
                  "name": "Melbourne Demons",
                  "price": 1.15
                }
              ]
            }
          ]
        },
        {
          "key": "pointsbetau",
          "title": "PointsBet (AU)",
          "last_update": "2022-06-29T12:18:06Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Adelaide Crows",
                  "price": 5.5
                },
                {
                  "name": "Melbourne Demons",
                  "price": 1.15
                }
              ]
            }
          ]
        },
        {
          "key": "tab",
          "title": "TAB",
          "last_update": "2022-06-29T12:14:53Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Adelaide Crows",
                  "price": 5.5
                },
                {
                  "name": "Melbourne Demons",
                  "price": 1.15
                }
              ]
            }
          ]
        },
        {
          "key": "ladbrokes",
          "title": "Ladbrokes",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Adelaide Crows",
                  "price": 5.75
                },
                {
                  "name": "Melbourne Demons",
                  "price": 1.14
                }
              ]
            }
          ]
        },
        {
          "key": "neds",
          "title": "Neds",
          "last_update": "2022-06-29T12:15:30Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Adelaide Crows",
                  "price": 5.75
                },
                {
                  "name": "Melbourne Demons",
                  "price": 1.14
                }
              ]
            }
          ]
        },
        {
          "key": "betfair",
          "title": "Betfair",
          "last_update": "2022-06-29T12:18:57Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Adelaide Crows",
                  "price": 6.0
                },
                {
                  "name": "Melbourne Demons",
                  "price": 1.17
                }
              ]
            },
            {
              "key": "h2h_lay",
              "outcomes": [
                {
                  "name": "Adelaide Crows",
                  "price": 7.2
                },
                {
                  "name": "Melbourne Demons",
                  "price": 1.2
                }
              ]
            }
          ]
        },
        {
          "key": "unibet",
          "title": "Unibet",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Adelaide Crows",
                  "price": 5.4
                },
                {
                  "name": "Melbourne Demons",
                  "price": 1.15
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "e2e7e17308e49fe57888dd44d269cb25",
      "sport_key": "aussierules_afl",
      "sport_title": "AFL",
      "commence_time": "2022-07-02T09:25:00Z",
      "home_team": "Gold Coast Suns",
      "away_team": "Collingwood Magpies",
      "bookmakers": [
        {
          "key": "sportsbet",
          "title": "SportsBet",
          "last_update": "2022-06-29T12:18:51Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Collingwood Magpies",
                  "price": 2.08
                },
                {
                  "name": "Gold Coast Suns",
                  "price": 1.78
                }
              ]
            }
          ]
        },
        {
          "key": "tab",
          "title": "TAB",
          "last_update": "2022-06-29T12:14:53Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Collingwood Magpies",
                  "price": 2.05
                },
                {
                  "name": "Gold Coast Suns",
                  "price": 1.77
                }
              ]
            }
          ]
        },
        {
          "key": "ladbrokes",
          "title": "Ladbrokes",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Collingwood Magpies",
                  "price": 2.0
                },
                {
                  "name": "Gold Coast Suns",
                  "price": 1.82
                }
              ]
            }
          ]
        },
        {
          "key": "neds",
          "title": "Neds",
          "last_update": "2022-06-29T12:15:30Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Collingwood Magpies",
                  "price": 2.0
                },
                {
                  "name": "Gold Coast Suns",
                  "price": 1.82
                }
              ]
            }
          ]
        },
        {
          "key": "betfair",
          "title": "Betfair",
          "last_update": "2022-06-29T12:18:57Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Collingwood Magpies",
                  "price": 2.08
                },
                {
                  "name": "Gold Coast Suns",
                  "price": 1.86
                }
              ]
            },
            {
              "key": "h2h_lay",
              "outcomes": [
                {
                  "name": "Collingwood Magpies",
                  "price": 2.18
                },
                {
                  "name": "Gold Coast Suns",
                  "price": 1.92
                }
              ]
            }
          ]
        },
        {
          "key": "pointsbetau",
          "title": "PointsBet (AU)",
          "last_update": "2022-06-29T12:18:06Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Collingwood Magpies",
                  "price": 2.0
                },
                {
                  "name": "Gold Coast Suns",
                  "price": 1.8
                }
              ]
            }
          ]
        },
        {
          "key": "unibet",
          "title": "Unibet",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Collingwood Magpies",
                  "price": 2.1
                },
                {
                  "name": "Gold Coast Suns",
                  "price": 1.75
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "b6b7a6d81c359c9f0f58630b39b8ddca",
      "sport_key": "aussierules_afl",
      "sport_title": "AFL",
      "commence_time": "2022-07-02T09:25:00Z",
      "home_team": "Geelong Cats",
      "away_team": "North Melbourne Kangaroos",
      "bookmakers": [
        {
          "key": "sportsbet",
          "title": "SportsBet",
          "last_update": "2022-06-29T12:18:51Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Geelong Cats",
                  "price": 1.01
                },
                {
                  "name": "North Melbourne Kangaroos",
                  "price": 19.0
                }
              ]
            }
          ]
        },
        {
          "key": "pointsbetau",
          "title": "PointsBet (AU)",
          "last_update": "2022-06-29T12:18:06Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Geelong Cats",
                  "price": 1.01
                },
                {
                  "name": "North Melbourne Kangaroos",
                  "price": 21.0
                }
              ]
            }
          ]
        },
        {
          "key": "tab",
          "title": "TAB",
          "last_update": "2022-06-29T12:14:53Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Geelong Cats",
                  "price": 1.01
                },
                {
                  "name": "North Melbourne Kangaroos",
                  "price": 21.0
                }
              ]
            }
          ]
        },
        {
          "key": "ladbrokes",
          "title": "Ladbrokes",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Geelong Cats",
                  "price": 1.01
                },
                {
                  "name": "North Melbourne Kangaroos",
                  "price": 15.0
                }
              ]
            }
          ]
        },
        {
          "key": "neds",
          "title": "Neds",
          "last_update": "2022-06-29T12:15:30Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Geelong Cats",
                  "price": 1.01
                },
                {
                  "name": "North Melbourne Kangaroos",
                  "price": 15.0
                }
              ]
            }
          ]
        },
        {
          "key": "betfair",
          "title": "Betfair",
          "last_update": "2022-06-29T12:18:57Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Geelong Cats",
                  "price": 1.03
                },
                {
                  "name": "North Melbourne Kangaroos",
                  "price": 29.0
                }
              ]
            },
            {
              "key": "h2h_lay",
              "outcomes": [
                {
                  "name": "Geelong Cats",
                  "price": 1.04
                },
                {
                  "name": "North Melbourne Kangaroos",
                  "price": 30.0
                }
              ]
            }
          ]
        },
        {
          "key": "unibet",
          "title": "Unibet",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Geelong Cats",
                  "price": 1.01
                },
                {
                  "name": "North Melbourne Kangaroos",
                  "price": 19.0
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "763f8a6e9b207a63248272db6c360714",
      "sport_key": "aussierules_afl",
      "sport_title": "AFL",
      "commence_time": "2022-07-03T04:10:00Z",
      "home_team": "Richmond Tigers",
      "away_team": "West Coast Eagles",
      "bookmakers": [
        {
          "key": "unibet",
          "title": "Unibet",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Richmond Tigers",
                  "price": 1.12
                },
                {
                  "name": "West Coast Eagles",
                  "price": 6.25
                }
              ]
            }
          ]
        },
        {
          "key": "ladbrokes",
          "title": "Ladbrokes",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Richmond Tigers",
                  "price": 1.12
                },
                {
                  "name": "West Coast Eagles",
                  "price": 6.5
                }
              ]
            }
          ]
        },
        {
          "key": "neds",
          "title": "Neds",
          "last_update": "2022-06-29T12:15:30Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Richmond Tigers",
                  "price": 1.12
                },
                {
                  "name": "West Coast Eagles",
                  "price": 6.5
                }
              ]
            }
          ]
        },
        {
          "key": "tab",
          "title": "TAB",
          "last_update": "2022-06-29T12:14:53Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Richmond Tigers",
                  "price": 1.11
                },
                {
                  "name": "West Coast Eagles",
                  "price": 6.5
                }
              ]
            }
          ]
        },
        {
          "key": "betfair",
          "title": "Betfair",
          "last_update": "2022-06-29T12:18:57Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Richmond Tigers",
                  "price": 1.13
                },
                {
                  "name": "West Coast Eagles",
                  "price": 7.6
                }
              ]
            },
            {
              "key": "h2h_lay",
              "outcomes": [
                {
                  "name": "Richmond Tigers",
                  "price": 1.15
                },
                {
                  "name": "West Coast Eagles",
                  "price": 8.8
                }
              ]
            }
          ]
        },
        {
          "key": "sportsbet",
          "title": "SportsBet",
          "last_update": "2022-06-29T12:18:51Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Richmond Tigers",
                  "price": 1.12
                },
                {
                  "name": "West Coast Eagles",
                  "price": 6.4
                }
              ]
            }
          ]
        },
        {
          "key": "pointsbetau",
          "title": "PointsBet (AU)",
          "last_update": "2022-06-29T12:18:06Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Richmond Tigers",
                  "price": 1.12
                },
                {
                  "name": "West Coast Eagles",
                  "price": 6.5
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "4f65a8a038f130c954c8a6c29a117165",
      "sport_key": "aussierules_afl",
      "sport_title": "AFL",
      "commence_time": "2022-07-03T05:20:00Z",
      "home_team": "Greater Western Sydney Giants",
      "away_team": "Hawthorn Hawks",
      "bookmakers": [
        {
          "key": "sportsbet",
          "title": "SportsBet",
          "last_update": "2022-06-29T12:18:51Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Greater Western Sydney Giants",
                  "price": 1.47
                },
                {
                  "name": "Hawthorn Hawks",
                  "price": 2.71
                }
              ]
            }
          ]
        },
        {
          "key": "tab",
          "title": "TAB",
          "last_update": "2022-06-29T12:14:53Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Greater Western Sydney Giants",
                  "price": 1.48
                },
                {
                  "name": "Hawthorn Hawks",
                  "price": 2.65
                }
              ]
            }
          ]
        },
        {
          "key": "ladbrokes",
          "title": "Ladbrokes",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Greater Western Sydney Giants",
                  "price": 1.53
                },
                {
                  "name": "Hawthorn Hawks",
                  "price": 2.5
                }
              ]
            }
          ]
        },
        {
          "key": "neds",
          "title": "Neds",
          "last_update": "2022-06-29T12:15:30Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Greater Western Sydney Giants",
                  "price": 1.53
                },
                {
                  "name": "Hawthorn Hawks",
                  "price": 2.5
                }
              ]
            }
          ]
        },
        {
          "key": "betfair",
          "title": "Betfair",
          "last_update": "2022-06-29T12:18:57Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Greater Western Sydney Giants",
                  "price": 1.5
                },
                {
                  "name": "Hawthorn Hawks",
                  "price": 2.78
                }
              ]
            },
            {
              "key": "h2h_lay",
              "outcomes": [
                {
                  "name": "Greater Western Sydney Giants",
                  "price": 1.56
                },
                {
                  "name": "Hawthorn Hawks",
                  "price": 3.0
                }
              ]
            }
          ]
        },
        {
          "key": "pointsbetau",
          "title": "PointsBet (AU)",
          "last_update": "2022-06-29T12:18:06Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Greater Western Sydney Giants",
                  "price": 1.5
                },
                {
                  "name": "Hawthorn Hawks",
                  "price": 2.6
                }
              ]
            }
          ]
        },
        {
          "key": "unibet",
          "title": "Unibet",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Greater Western Sydney Giants",
                  "price": 1.47
                },
                {
                  "name": "Hawthorn Hawks",
                  "price": 2.65
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "57728a982ab34b0507f6744b5f72f3df",
      "sport_key": "aussierules_afl",
      "sport_title": "AFL",
      "commence_time": "2022-07-03T07:20:00Z",
      "home_team": "Fremantle Dockers",
      "away_team": "Port Adelaide Power",
      "bookmakers": [
        {
          "key": "sportsbet",
          "title": "SportsBet",
          "last_update": "2022-06-29T12:18:51Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Fremantle Dockers",
                  "price": 1.42
                },
                {
                  "name": "Port Adelaide Power",
                  "price": 2.9
                }
              ]
            }
          ]
        },
        {
          "key": "tab",
          "title": "TAB",
          "last_update": "2022-06-29T12:14:53Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Fremantle Dockers",
                  "price": 1.4
                },
                {
                  "name": "Port Adelaide Power",
                  "price": 3.0
                }
              ]
            }
          ]
        },
        {
          "key": "ladbrokes",
          "title": "Ladbrokes",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Fremantle Dockers",
                  "price": 1.42
                },
                {
                  "name": "Port Adelaide Power",
                  "price": 2.95
                }
              ]
            }
          ]
        },
        {
          "key": "neds",
          "title": "Neds",
          "last_update": "2022-06-29T12:15:30Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Fremantle Dockers",
                  "price": 1.42
                },
                {
                  "name": "Port Adelaide Power",
                  "price": 2.95
                }
              ]
            }
          ]
        },
        {
          "key": "betfair",
          "title": "Betfair",
          "last_update": "2022-06-29T12:18:57Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Fremantle Dockers",
                  "price": 1.44
                },
                {
                  "name": "Port Adelaide Power",
                  "price": 2.92
                }
              ]
            },
            {
              "key": "h2h_lay",
              "outcomes": [
                {
                  "name": "Fremantle Dockers",
                  "price": 1.53
                },
                {
                  "name": "Port Adelaide Power",
                  "price": 3.3
                }
              ]
            }
          ]
        },
        {
          "key": "pointsbetau",
          "title": "PointsBet (AU)",
          "last_update": "2022-06-29T12:18:06Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Fremantle Dockers",
                  "price": 1.39
                },
                {
                  "name": "Port Adelaide Power",
                  "price": 3.0
                }
              ]
            }
          ]
        },
        {
          "key": "unibet",
          "title": "Unibet",
          "last_update": "2022-06-29T12:14:33Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Fremantle Dockers",
                  "price": 1.42
                },
                {
                  "name": "Port Adelaide Power",
                  "price": 2.88
                }
              ]
            }
          ]
        }
      ]
    }
  ]

  let matchesAndOdds = [...matches];
  matches.forEach((match, i) => {
    matchesAndOdds[i].odds = {};
    odds.forEach(odd => {
      if (odd.home_team === ffToOa[match.home_team] &&
        odd.away_team === ffToOa[match.away_team]) {
        odd.bookmakers.forEach(bookmaker => {
          matchesAndOdds[i].odds[bookmaker.title] = {};
          bookmaker.markets[0].outcomes.forEach(outcome => {
            if (outcome.name === odd.home_team) {
              matchesAndOdds[i].odds[bookmaker.title].home = outcome.price;
            } else if (outcome.name === odd.away_team) {
              matchesAndOdds[i].odds[bookmaker.title].away = outcome.price;
            }
          })
        })
      }
    })
  })

  return matchesAndOdds;
}

module.exports = {
  getFixtureFromFanfooty,
  insertCsvIntoDb,
  getSeasonsFromDb,
  getRoundsFromDb,
  getMatchesFromDb,
  getOddsFromApi
};
