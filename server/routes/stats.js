const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const User = require('../models/User');

// @route   GET api/stats
// @desc    Get dashboard statistics
// @access  Public
router.get('/', async (req, res) => {
    try {
        const totalIssues = await Issue.countDocuments();
        const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });
        const activeUsers = await User.countDocuments();

        // Find top category
        const categoryStats = await Issue.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        const topCategory = categoryStats.length > 0 ? categoryStats[0]._id : 'N/A';

        res.json({
            totalIssues,
            resolvedIssues,
            activeUsers,
            topCategory
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
