'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class song extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.song.belongsToMany(models.playlist,{through:'playlists_songs'})
    }
  }
  song.init({
    track: DataTypes.INTEGER,
    name: DataTypes.STRING,
    artist: DataTypes.STRING,
    lyrics: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'song',
  });
  return song;
};