"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("leaves", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      _id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "teams",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      days: {
        type: Sequelize.INTEGER,
      },
      reason: {
        type: Sequelize.STRING,
      },
      details: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "pending",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("leaves");
  },
};