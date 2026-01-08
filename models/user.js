/**
 * User Model
 * 
 * Single users table for all roles (customer, restaurant owner, rider, admin).
 * Stores auth credentials and role-based access information.
 */

const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/postgres');

const USER_ROLES = ['USER', 'RESTAURANT', 'RIDER', 'ADMIN'];

class User extends Model {
  /**
   * Compare plaintext password with hashed password
   * @param {string} candidatePassword
   * @returns {Promise<boolean>}
   */
  async validPassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  /**
   * Strip sensitive fields when converting to JSON
   */
  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [4, 255],
      },
    },
    role: {
      type: DataTypes.ENUM(...USER_ROLES),
      allowNull: false,
      defaultValue: 'USER',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
    scopes: {
      withPassword: { attributes: { include: ['password'] } },
    },
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['role'] },
    ],
  }
);

/**
 * Hash password before saving
 */
const hashPassword = async (user) => {
  if (user.changed('password')) {
    const saltRounds = 10;
    user.password = await bcrypt.hash(user.password, saltRounds);
  }
};

User.addHook('beforeCreate', hashPassword);
User.addHook('beforeUpdate', hashPassword);

// Expose available roles for re-use
User.ROLES = USER_ROLES;

module.exports = User;
