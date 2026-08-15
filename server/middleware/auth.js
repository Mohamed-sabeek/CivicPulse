const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Real-time database check for account standing & blocking
        const user = await User.findById(decoded.user.id).select('-password');
        if (!user) {
            return res.status(401).json({ msg: 'User account no longer exists' });
        }

        if (user.status === 'blocked' || user.status === 'Suspended') {
            return res.status(403).json({ 
                msg: 'Your CivicPulse account has been blocked. Please contact the administrator.',
                isBlocked: true 
            });
        }

        req.user = {
            id: user._id.toString(),
            _id: user._id,
            role: user.role,
            status: user.status,
            name: user.name,
            email: user.email
        };
        next();
    } catch {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
