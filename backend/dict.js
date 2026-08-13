const sendInBlueResponseDict = {
  "email is not valid in to": 'One or more "To" addresses are malformed',
  "email is not valid in cc": 'One or more "CC" addresses are malformed',
};

const isFinalDict = {
  0: "HA", // Not a final
  1: "UN", // Some kind of final (type unspecified)
  2: "EF", // Elimination Final
  3: "QF", // Qualifying Final
  4: "SF", // Semi-Final
  5: "PF", // Preliminary Final
  6: "GF", // Grand Final
  7: "WF", // Wildcard Final
};

const squiggleToOddsApiDict = {
  "Western Bulldogs": "Western Bulldogs",
  "Brisbane Lions": "Brisbane Lions",
  "St Kilda": "St Kilda Saints",
  Carlton: "Carlton Blues",
  Sydney: "Sydney Swans",
  Essendon: "Essendon Bombers",
  Melbourne: "Melbourne Demons",
  Adelaide: "Adelaide Crows",
  "North Melbourne": "North Melbourne Kangaroos",
  Geelong: "Geelong Cats",
  Collingwood: "Collingwood Magpies",
  "Gold Coast": "Gold Coast Suns",
  "West Coast": "West Coast Eagles",
  Richmond: "Richmond Tigers",
  Hawthorn: "Hawthorn Hawks",
  "Greater Western Sydney": "Greater Western Sydney Giants",
  "Port Adelaide": "Port Adelaide Power",
  Fremantle: "Fremantle Dockers",
};

module.exports = {
  sendInBlueResponseDict,
  isFinalDict,
  squiggleToOddsApiDict,
};
