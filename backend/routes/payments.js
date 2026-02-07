const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Payment methods configuration
const PAYMENT_METHODS = {
  cash: {
    name: 'Cash on Delivery',
    account: null
  },
  cbe: {
    name: 'Commercial Bank of Ethiopia',
    account: '1000668411901',
    instructions: 'Send payment to CBE account 1000668411901'
  },
  telebirr: {
    name: 'Telebirr',
    account: '0969377085',
    instructions: 'Send payment to Telebirr 0969377085'
  },
  mpesa: {
    name: 'M-Pesa Safari',
    account: '0706377085',
    instructions: 'Send payment to M-Pesa 0706377085'
  },
  abisnya: {
    name: 'Abisnya',
    account: 'Coming Soon',
    instructions: 'Coming Soon'
  },
  enat: {
    name: 'Enat Bank',
    account: 'Coming Soon',
    instructions: 'Coming Soon'
  },
  dashen: {
    name: 'Dashen Bank',
    account: 'Coming Soon',
    instructions: 'Coming Soon'
  },
  other: {
    name: 'Other',
    account: 'Contact for details',
    instructions: 'Contact us for payment details'
  }
};

// Get all payment methods
router.get('/methods', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      methods: PAYMENT_METHODS
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Process payment
router.post('/process', auth, [
  body('orderId').notEmpty(),
  body('paymentMethod').isIn(Object.keys(PAYMENT_METHODS))
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, paymentMethod, transactionId, phoneNumber } = req.body;
    const order = await Order.findOne({ orderId, user: req.user.id });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update payment details
    order.paymentMethod = paymentMethod;
    order.paymentDetails = {
      transactionId,
      phoneNumber,
      accountNumber: PAYMENT_METHODS[paymentMethod].account,
      bankName: PAYMENT_METHODS[paymentMethod].name,
      paidAt: new Date()
    };

    // If not cash, mark as paid
    if (paymentMethod !== 'cash') {
      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
    }

    await order.save();

    res.json({
      success: true,
      message: 'Payment processed successfully',
      order,
      paymentInstructions: PAYMENT_METHODS[paymentMethod].instructions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify payment
router.post('/verify/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.orderId,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // This would integrate with actual payment gateway APIs
    // For now, we'll simulate verification
    const isVerified = order.paymentStatus === 'paid';

    res.json({
      success: true,
      verified: isVerified,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
