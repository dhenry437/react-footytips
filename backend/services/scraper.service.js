const axios = require("axios");
const cheerio = require("cheerio");

const getFixtureFromAflTables = async () => {
  const year = 2024;

  const request = await axios.get(
    `https://afltables.com/afl/seas/${year}.html`
  );

  const $ = cheerio.load(request.data);

  // Rounds
  $('table[border=2][width="100%"]').each(function () {
    const round = $(this).find("td:first").text();
    const competition = null;

    // Skip finals heading
    if (round === "Finals") return;

    console.log(`${round} ----------------`);

    // Matches
    $(this)
      .next()
      .find($('td[width="85%"]'))
      .find($('table[width="100%"][border="1"]'))
      .each(function () {
        let gametime = null;
        let day = null;
        let home_team = null;
        let away_team = null;
        let ground = null;
        let home_goals = null;
        let home_behinds = null;
        let home_points = null;
        let away_goals = null;
        let away_behinds = null;
        let away_points = null;
        let match_status = null;

        $(this)
          .find($("tr"))
          .each(function (i) {
            // each match
            // ! Handle byes by counting number of children td
            // Home
            if (i === 0) {
              home_team = $(this).find($('td[width="16%"]')).text().trim();
              home_goals = getScores(
                $(this).find($('td[width="20%"]')).text(),
                0
              );
              home_behinds = getScores(
                $(this).find($('td[width="20%"]')).text(),
                1
              );
              home_points = $(this).find($('td[width="5%"]')).text().trim();
              gametime = Date(
                $(this)
                  .find("td:not([width])")
                  .text()
                  .split(" Att:")[0]
                  .replace(/ \(.*\)/g, "")
              );
              ground = $(this)
                .find("td:not([width])")
                .text()
                .split("Venue: ")[1];
            }
            // Away
            else if (i === 1) {
              away_team = $(this).find($('td[width="16%"]')).text().trim();
              // Bye
              if (!away_team) {
              }
              away_goals = getScores(
                $(this).find($('td[width="20%"]')).text(),
                0
              );
              away_behinds = getScores(
                $(this).find($('td[width="20%"]')).text(),
                1
              );
              away_points = $(this).find($('td[width="5%"]')).text().trim();
            }
          });
        console.log(
          `${home_team} ${home_goals}.${home_behinds} ${home_points} vs. ${away_team} ${away_goals}.${away_behinds} ${away_points} @ ${ground}, ${gametime}`
        );
      });
  });
};

// Get goals or behinds from score string
// behinds: i = 0
// goals: i = 1
const getScores = (str, i) => {
  return str
    .replace(/&nbsp;/g, " ")
    .trim()
    .split(" ")
    .at(-1)
    .trim()
    .split(".")[i];
};

getFixtureFromAflTables();
