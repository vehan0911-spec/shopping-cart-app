const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await User.findById(decoded.userId).select('-password');
        if (user) {
          req.user = user;
        }
      }
    }
  } catch (error) {
    // ignore
  }
  next();
};

module.exports = { optionalAuth };