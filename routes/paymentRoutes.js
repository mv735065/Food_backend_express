/**
 * Payment Routes (Dummy)
 */

const express = require('express');
const router = express.Router();
const { payOrder } = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/auth');

router.post('/pay', authenticate, payOrder);

module.exports = router;

