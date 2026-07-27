const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');

// Helper to get or create cart based on user status
const getCart = async (sessionId, userId) => {
  if (userId) {
    // Authenticated user – cart linked to userId, no sessionId
    let cart = await Cart.findOne({ userId, sessionId: null });
    if (!cart) {
      cart = new Cart({ userId, sessionId: null, items: [] });
      cart.calculateTotals();
      await cart.save();
    }
    return cart;
  } else {
    // Guest user – cart linked to sessionId
    const sid = sessionId || 'guest-session';
    let cart = await Cart.findOne({ sessionId: sid });
    if (!cart) {
      cart = new Cart({ sessionId: sid });
      cart.calculateTotals();
      await cart.save();
    }
    return cart;
  }
};

// GET /api/cart – Get current cart (guest or user)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || 'guest-session';
    const userId = req.user?._id;
    const cart = await getCart(sessionId, userId);

    // Auto-fix: deduplicate items by productId in case of existing bad data
    const seen = new Map();
    const before = cart.items.length;
    cart.items = cart.items.filter(item => {
      const key = item.productId.toString();
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
    if (cart.items.length !== before) {
      cart.calculateTotals();
      await cart.save();
    }

    await cart.populate('items.productId');
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cart – Add item to cart
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const sessionId = req.headers['x-session-id'] || 'guest-session';
    const userId = req.user?._id;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let cart = await getCart(sessionId, userId);

    // Check if product already in cart
    const existingIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId: product._id,
        quantity,
        price: product.price,
      });
    }

    cart.calculateTotals();
    await cart.save();
    await cart.populate('items.productId');

    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/cart/:productId – Update quantity
router.put('/:productId', optionalAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const sessionId = req.headers['x-session-id'] || 'guest-session';
    const userId = req.user?._id;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const cart = await getCart(sessionId, userId);

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.calculateTotals();
    await cart.save();
    await cart.populate('items.productId');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cart/:productId – Remove item
router.delete('/:productId', optionalAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const sessionId = req.headers['x-session-id'] || 'guest-session';
    const userId = req.user?._id;

    const cart = await getCart(sessionId, userId);

    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );

    cart.calculateTotals();
    await cart.save();
    await cart.populate('items.productId');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cart – Clear entire cart
router.delete('/', optionalAuth, async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || 'guest-session';
    const userId = req.user?._id;

    const cart = await getCart(sessionId, userId);
    cart.items = [];
    cart.calculateTotals();
    await cart.save();

    res.json({ message: 'Cart cleared', cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cart/merge – Merge guest cart into user cart (protected)
router.post('/merge', protect, async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || 'guest-session';
    const userId = req.user._id;

    // Find or create user cart (use findOneAndUpdate to avoid version conflicts)
    let userCart = await Cart.findOne({ userId, sessionId: null });
    if (!userCart) {
      userCart = new Cart({ userId, sessionId: null, items: [] });
      userCart.calculateTotals();
      await userCart.save();
    }

    // Find guest cart
    const guestCart = await Cart.findOne({ sessionId });
    if (guestCart && guestCart.items.length > 0) {
      // Build merged items array in memory
      const mergedItems = [...userCart.items];

      for (const guestItem of guestCart.items) {
        const existingIndex = mergedItems.findIndex(
          item => item.productId.toString() === guestItem.productId.toString()
        );
        if (existingIndex > -1) {
          mergedItems[existingIndex].quantity += guestItem.quantity;
        } else {
          mergedItems.push(guestItem);
        }
      }

      // Deduplicate by productId — safety net
      const seen = new Map();
      const deduped = mergedItems.filter(item => {
        const key = item.productId.toString();
        if (seen.has(key)) return false;
        seen.set(key, true);
        return true;
      });

      // Calculate totals
      const totalItems = deduped.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = deduped.reduce((sum, item) => sum + item.price * item.quantity, 0);

      // Use findByIdAndUpdate ($set) — bypasses Mongoose __v versioning entirely
      userCart = await Cart.findByIdAndUpdate(
        userCart._id,
        { $set: { items: deduped, totalItems, totalPrice, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      // Delete guest cart after merge
      await Cart.deleteOne({ _id: guestCart._id });
    } else if (guestCart) {
      // Delete empty guest cart
      await Cart.deleteOne({ _id: guestCart._id });
    }

    await userCart.populate('items.productId');
    res.json(userCart);
  } catch (error) {
    console.error('Merge error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;