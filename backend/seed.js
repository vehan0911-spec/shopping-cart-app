const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');
const Category = require('./models/Category');

const sampleProducts = [
  // Vegetables
  {
    name: 'Fresh Carrots',
    description: 'Organic, farm-fresh carrots. Rich in vitamin A.',
    price: 2.99,
    category: 'Vegetables',
    imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=300&fit=crop',
    stock: 50,
    rating: 4.5,
  },
  {
    name: 'Broccoli',
    description: 'Fresh green broccoli, packed with nutrients.',
    price: 3.49,
    category: 'Vegetables',
    imageUrl: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400&h=300&fit=crop',
    stock: 35,
    rating: 4.2,
  },
  {
    name: 'Tomatoes',
    description: 'Juicy, ripe tomatoes, perfect for salads.',
    price: 4.99,
    category: 'Vegetables',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop',
    stock: 40,
    rating: 4.0,
  },
  
  // Fruits
  {
    name: 'Organic Apples',
    description: 'Sweet and crisp organic apples from local farms.',
    price: 5.99,
    category: 'Fruits',
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop',
    stock: 60,
    rating: 4.8,
  },
  {
    name: 'Bananas',
    description: 'Fresh bananas, rich in potassium.',
    price: 2.49,
    category: 'Fruits',
    imageUrl: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&h=300&fit=crop',
    stock: 45,
    rating: 4.3,
  },
  {
    name: 'Strawberries',
    description: 'Sweet, ripe strawberries, perfect for desserts.',
    price: 6.99,
    category: 'Fruits',
    imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4b3b6?w=400&h=300&fit=crop',
    stock: 30,
    rating: 4.7,
  },
  
  // Cakes
  {
    name: 'Chocolate Cake',
    description: 'Rich, moist chocolate cake with chocolate ganache.',
    price: 24.99,
    category: 'Cakes',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
    stock: 15,
    rating: 4.9,
  },
  {
    name: 'Vanilla Sponge Cake',
    description: 'Classic vanilla sponge cake with buttercream frosting.',
    price: 19.99,
    category: 'Cakes',
    imageUrl: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=400&h=300&fit=crop',
    stock: 20,
    rating: 4.6,
  },
  
  // Biscuits
  {
    name: 'Chocolate Chip Cookies',
    description: 'Homestyle chocolate chip cookies, soft and chewy.',
    price: 8.99,
    category: 'Biscuits',
    imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee9185835?w=400&h=300&fit=crop',
    stock: 40,
    rating: 4.4,
  },
  {
    name: 'Butter Shortbread',
    description: 'Traditional Scottish shortbread, buttery and crumbly.',
    price: 7.99,
    category: 'Biscuits',
    imageUrl: 'https://images.unsplash.com/photo-1586349908066-394225d93ed2?w=400&h=300&fit=crop',
    stock: 35,
    rating: 4.1,
  },
];

const sampleCategories = [
  { name: 'Vegetables', description: 'Fresh organic vegetables', icon: '🥬' },
  { name: 'Fruits', description: 'Sweet and fresh fruits', icon: '🍎' },
  { name: 'Cakes', description: 'Delicious cakes for every occasion', icon: '🎂' },
  { name: 'Biscuits', description: 'Crunchy and tasty biscuits', icon: '🍪' },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('🧹 Cleared existing products and categories');

    // Insert categories
    const categories = await Category.insertMany(sampleCategories);
    console.log(`✅ Inserted ${categories.length} categories`);

    // Insert products
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${products.length} products`);

    console.log('🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();