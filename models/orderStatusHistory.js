/**
 * OrderStatusHistory Model
 *
 * Tracks changes in order status over time.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/postgres');
const Order = require('./order');
const ORDER_STATUSES = Order.STATUSES;

class OrderStatusHistory extends Model {}

OrderStatusHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fromStatus: {
      type: DataTypes.ENUM(...ORDER_STATUSES),
      allowNull: true,
    },
    toStatus: {
      type: DataTypes.ENUM(...ORDER_STATUSES),
      allowNull: false,
    },
    changedByRole: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'OrderStatusHistory',
    tableName: 'order_status_history',
    timestamps: true,
    paranoid: false,
  }
);

module.exports = OrderStatusHistory;
