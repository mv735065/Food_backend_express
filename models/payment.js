/**
 * Payment Model
 *
 * Dummy payment records linked to orders.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/postgres');

const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED'];

class Payment extends Model {}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    status: {
      type: DataTypes.ENUM(...PAYMENT_STATUSES),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
    paranoid: true,
    indexes: [{ fields: ['orderId'] }, { fields: ['status'] }],
  }
);

Payment.STATUSES = PAYMENT_STATUSES;

module.exports = Payment;
