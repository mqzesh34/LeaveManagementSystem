"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("leaves", "days", {
      type: Sequelize.FLOAT,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("leaves", "days", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
