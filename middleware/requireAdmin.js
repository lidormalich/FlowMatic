// Admin role guard - replaces 6+ inline admin checks across routes
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'אין הרשאה' });
  }
  next();
};

module.exports = requireAdmin;
