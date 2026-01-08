/**
 * Health Routes
 * 
 * Defines routes for health check endpoints
 */

const express = require('express');
const router = express.Router();
const { getHealth } = require('../controllers/healthController');

/**
 * @route   GET /api/health
 * @desc    Get server health status
 * @access  Public
 */
router.get('/', getHealth);

module.exports = router;
