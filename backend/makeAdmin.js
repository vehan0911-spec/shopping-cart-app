/**
 * Run this script to promote a user to admin:
 *   node backend/makeAdmin.js your-email@example.com
 */
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function makeAdmin() {
  const email = process.argv[2];
  if (!email) {
    console.error('❌ Usage: node makeAdmin.js <email>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error(`❌ No user found with email: ${email}`);
    process.exit(1);
  }

  user.role = 'admin';
  await user.save();
  console.log(`✅ "${user.name}" (${user.email}) is now an admin!`);
  process.exit(0);
}

makeAdmin().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
