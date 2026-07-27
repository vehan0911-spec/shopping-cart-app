const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { protect } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @route   POST /api/orders
// @desc    Create a new order
router.post('/', protect, async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    const userId = req.user._id;

    // Get user's cart
    const cart = await Cart.findOne({ userId, sessionId: null });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Create order items with product details
    const orderItems = cart.items.map(item => ({
      productId: item.productId._id ? item.productId._id : item.productId, // Handle both populated and non-populated
      name: item.productId.name || 'Product', // You might need to populate this or handle if name is directly on item
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.productId.imageUrl || '',
    }));
    // Note: The above might fail if item.productId is just an ObjectId, not populated.
    // Let's populate it to be safe.
    await cart.populate('items.productId');
    
    const populatedOrderItems = cart.items.map(item => ({
      productId: item.productId._id,
      name: item.productId.name,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.productId.imageUrl,
    }));


    // Create order
    const order = new Order({
      userId,
      items: populatedOrderItems,
      totalAmount: cart.totalPrice,
      shippingAddress,
      paymentStatus: 'pending',
      orderStatus: 'pending',
    });

    await order.save();

    // Clear the cart after order creation
    cart.items = [];
    cart.calculateTotals();
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/orders
// @desc    Get user's order history
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/orders/create-payment
// @desc    Create Stripe payment intent
router.post('/create-payment', protect, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({
      _id: orderId,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Stripe uses cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/orders/webhook
// @desc    Stripe webhook to confirm payment
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'completed',
        paymentId: paymentIntent.id,
        orderStatus: 'processing',
      });
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
