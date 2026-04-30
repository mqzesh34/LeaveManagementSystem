"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Team extends Model {}
  Team.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      teamName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "team_name",
      },
      teamLeadId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "team_lead_id",
      },
    },
    {
      sequelize,
      modelName: "Team",
      tableName: "teams",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  Team.associate = (models) => {
    Team.hasMany(models.Leave, { foreignKey: "teamId", as: "leaves" });
  };

  return Team;
};
