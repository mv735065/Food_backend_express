/**
 * Routes Index
 * 
 * Main router file that combines all route modules
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const restaurantRoutes = require('./restaurantRoutes');
const menuRoutes = require('./menuRoutes');
const orderRoutes = require('./orderRoutes');
const riderRoutes = require('./riderRoutes');
const paymentRoutes = require('./paymentRoutes');
const notificationRoutes = require('./notificationRoutes');
const healthRoutes = require('./healthRoutes');
const adminRoutes = require('./adminRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/restaurants/:id/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/rider', riderRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/health', healthRoutes);
router.use('/admin', adminRoutes);

// Add more routes here as you create them
// router.use('/users', userRoutes);
// router.use('/products', productRoutes);

module.exports = router;
