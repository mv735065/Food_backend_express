/**
 * Order Model
 *
 * Represents a food order placed by a user at a restaurant.
 * Contains a JSONB items array referencing menu items and quantities.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/postgres');

const ORDER_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // JSONB array: [{ menuItemId, name, price, quantity }]
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM(...ORDER_STATUSES),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    deliveryAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    paranoid: true,
    indexes: [{ fields: ['status'] }],
  }
);

Order.STATUSES = ORDER_STATUSES;

module.exports = Order;
