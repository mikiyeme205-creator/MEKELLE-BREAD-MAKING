const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Create new order
router.post('/', auth, [
  body('items').isArray().notEmpty(),
  body('deliveryAddress').isObject(),
  body('paymentMethod').isIn(['cash', 'cbe', 'telebirr', 'mpesa', 'abisnya', 'enat', 'dashen', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, deliveryAddress, paymentMethod, notes } = req.body;
    let subtotal = 0;
    const orderItems = [];

    // Calculate total and validate items
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isAvailable) {
        return res.status(400).json({ message: `Product ${item.productId} not available` });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        size: product.size
      });
    }

    const deliveryFee = subtotal > 100 ? 0 : 20; // Free delivery over 100 Birr
    const totalAmount = subtotal + deliveryFee;

    // Create order
    const order = new Order({
      user: req.user.id,
      items: orderItems,
      subtotal,
      deliveryFee,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      notes,
      orderStatus: 'pending',
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending'
    });

    await order.save();

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name price images')
      .populate('assignedTo', 'fullName phone');

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get order by ID
router.get('/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.orderId,
      user: req.user.id
    })
    .populate('items.product', 'name price images size')
    .populate('assignedTo', 'fullName phone profileImage');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel order
router.put('/:orderId/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.orderId,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Cannot cancel order at this stage' });
    }

    order.orderStatus = 'cancelled';
    order.updatedAt = new Date();
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Track order
router.get('/:orderId/track', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.orderId,
      user: req.user.id
    }).select('orderStatus estimatedDelivery deliveredAt assignedTo');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const statusMap = {
      pending: { progress: 10, message: 'Order received' },
      confirmed: { progress: 25, message: 'Order confirmed' },
      preparing: { progress: 40, message: 'Preparing your order' },
      ready: { progress: 60, message: 'Ready for delivery' },
      out_for_delivery: { progress: 80, message: 'Out for delivery' },
      delivered: { progress: 100, message: 'Delivered' },
      cancelled: { progress: 0, message: 'Cancelled' }
    };

    const trackingInfo = statusMap[order.orderStatus] || { progress: 0, message: 'Unknown' };

    res.json({
      success: true,
      tracking: {
        ...trackingInfo,
        estimatedDelivery: order.estimatedDelivery,
        deliveredAt: order.deliveredAt,
        assignedTo: order.assignedTo
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
