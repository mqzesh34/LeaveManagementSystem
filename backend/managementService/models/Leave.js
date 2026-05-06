"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Leave extends Model {}
  Leave.init(
    {
      userId: {
        type: DataTypes.STRING,
        field: "_id",
      },
      teamId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "team_id",
        references: { model: "teams", key: "id" },
      },
      startDate: {
        type: DataTypes.DATEONLY,
        field: "start_date",
      },
      days: DataTypes.FLOAT,
      reason: DataTypes.STRING,
      details: DataTypes.TEXT,
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
      },
    },
    {
      sequelize,
      modelName: "Leave",
      tableName: "leaves",
      timestamps: true,
      updatedAt: false,
    },
  );

  Leave.associate = (models) => {
    Leave.belongsTo(models.Team, { foreignKey: "teamId", as: "team" });
  };

  return Leave;
};
