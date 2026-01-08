/**
 * Restaurant Model
 *
 * Represents a restaurant owned by a user with role RESTAURANT.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/postgres');

class Restaurant extends Model {}

Restaurant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        // Convert empty string to null
        this.setDataValue('phoneNumber', value === '' || value === null ? null : value);
      },
    },
    cuisineType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'indian',
      validate: {
        notEmpty: true,
      },
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl(value) {
          // Only validate URL format if a value is provided
          if (value && value.trim() !== '') {
            const urlPattern = /^https?:\/\/.+/i;
            if (!urlPattern.test(value)) {
              throw new Error('Image URL must be a valid URL');
            }
          }
        },
        len: {
          args: [0, 2048],
          msg: 'Image URL must be less than 2048 characters',
        },
      },
      set(value) {
        // Convert empty string to null
        this.setDataValue('imageUrl', value === '' || value === null ? null : value);
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Restaurant',
    tableName: 'restaurants',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['ownerId'] },
      { fields: ['cuisineType'] },
    ],
  }
);

module.exports = Restaurant;
