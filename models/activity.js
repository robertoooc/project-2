'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class activity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.activity.belongsTo(models.user)
      models.activity.belongsTo(models.playlist)
    }
  }
  activity.init({
    userId: DataTypes.INTEGER,
    playlistId: DataTypes.INTEGER,
    like: DataTypes.BOOLEAN,
    comment: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'activity',
  });
  return activity;
};