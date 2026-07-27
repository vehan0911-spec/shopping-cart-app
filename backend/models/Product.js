const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Vegetables', 'Fruits', 'Cakes', 'Biscuits', 'Other'] // match your SRS
  },
  imageUrl: { type: String, required: true },
  stock: { type: Number, default: 10 },
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);