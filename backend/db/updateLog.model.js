module.exports = (sequelize, Sequelize) => {
  const UpdateLog = sequelize.define(
    "update_log",
    {
      ip: { type: Sequelize.STRING, allowNull: false },
      reason: { type: Sequelize.STRING },
    },
    {
      createdAt: false,
    }
  );
  return UpdateLog;
};
