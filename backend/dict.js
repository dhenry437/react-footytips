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
};

const isFinalDictInverse = Object.fromEntries(
  Object.entries(isFinalDict).map(a => a.reverse())
);

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

// ! Got no idea if this may change in the future
const roundsToSquiggleDict = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
  13: 13,
  14: 14,
  15: 15,
  16: 16,
  17: 17,
  18: 18,
  19: 19,
  20: 20,
  21: 21,
  22: 22,
  23: 23,
  24: 24,
  "QF and EF": 25,
  SF: 26,
  PF: 27,
  GF: 28,
};

module.exports = {
  sendInBlueResponseDict,
  isFinalDict,
  isFinalDictInverse,
  squiggleToOddsApiDict,
  roundsToSquiggleDict,
};
