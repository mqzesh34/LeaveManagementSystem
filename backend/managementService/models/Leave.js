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
      startDate: {
        type: DataTypes.DATEONLY,
        field: "start_date",
      },
      days: DataTypes.INTEGER,
      reason: DataTypes.STRING,
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
  return Leave;
};
