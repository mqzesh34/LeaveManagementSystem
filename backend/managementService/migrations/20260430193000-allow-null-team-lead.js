"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("teams", "team_lead_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("teams", "team_lead_id", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
