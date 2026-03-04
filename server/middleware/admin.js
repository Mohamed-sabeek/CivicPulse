const User = require('../models/User');

module.exports = async function (req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    next();
};
