/**
 * MenuItem Model
 *
 * Menu items offered by a restaurant.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/postgres');

class MenuItem extends Model {}

MenuItem.init(
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
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'General',
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
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'restaurants',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'MenuItem',
    tableName: 'menu_items',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['restaurantId'] },
      { fields: ['category'] },
    ],
  }
);

module.exports = MenuItem;
