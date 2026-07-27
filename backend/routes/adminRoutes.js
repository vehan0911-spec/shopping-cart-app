const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// ============ DASHBOARD STATS ============

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const [totalProducts, totalOrders, totalUsers, orders] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Order.find().select('totalAmount paymentStatus'),
    ]);

    const totalRevenue = orders
      .filter(o => o.paymentStatus === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({ totalProducts, totalOrders, totalUsers, totalRevenue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PRODUCT MANAGEMENT ============

// @route   GET /api/admin/products
router.get('/products', protect, admin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/admin/products
router.post('/products', protect, admin, async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, stock, rating } = req.body;

    if (!name || !description || !price || !category || !imageUrl) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      imageUrl,
      stock: stock ?? 10,
      rating: rating ?? 0,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/admin/products/:id
router.put('/products/:id', protect, admin, async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, stock, rating } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    if (stock !== undefined) product.stock = stock;
    if (rating !== undefined) product.rating = rating;

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/admin/products/:id
router.delete('/products/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CATEGORY MANAGEMENT ============

// @route   GET /api/admin/categories
router.get('/categories', protect, admin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/admin/categories
router.post('/categories', protect, admin, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const existing = await Category.findOne({ name });
    if (existing) return res.status(400).json({ error: 'Category already exists' });

    const category = new Category({ name, description, icon });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/admin/categories/:id
router.put('/categories/:id', protect, admin, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;

    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/admin/categories/:id
router.delete('/categories/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const count = await Product.countDocuments({ category: category.name });
    if (count > 0) {
      return res.status(400).json({
        error: `Cannot delete: ${count} product(s) still use this category.`,
      });
    }

    await category.deleteOne();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ORDER MANAGEMENT ============

// @route   GET /api/admin/orders
router.get('/orders', protect, admin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', protect, admin, async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
