module.exports = (sequelize, Sequelize) => {
  const Match = sequelize.define("matches", {
    ff_draw_id: { type: Sequelize.INTEGER },
    year: { type: Sequelize.INTEGER },
    competition: { type: Sequelize.STRING }, // HA for home & away, P1/P2/P3/P4 for preseason, EF/QF/SF/PF/GF for finals
    round: { type: Sequelize.INTEGER },
    gametime: { type: Sequelize.DATE },// AET
    day: { type: Sequelize.STRING },
    home_team: { type: Sequelize.STRING },
    away_team: { type: Sequelize.STRING },
    ground: { type: Sequelize.STRING },
    timeslot: { type: Sequelize.STRING }, // D for day, T for twilight, N for night
    tv_coverage: { type: Sequelize.STRING },
    home_supergoals: { type: Sequelize.INTEGER },
    home_goals: { type: Sequelize.INTEGER },
    home_behinds: { type: Sequelize.INTEGER },
    home_points: { type: Sequelize.INTEGER },
    away_supergoals: { type: Sequelize.INTEGER },
    away_goals: { type: Sequelize.INTEGER },
    away_behinds: { type: Sequelize.INTEGER },
    away_points: { type: Sequelize.INTEGER },
    match_status: { type: Sequelize.STRING }, // either Full Time or blank type: Sequelize.STRING },
  });
  return Match;
};