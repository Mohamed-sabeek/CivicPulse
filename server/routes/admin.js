const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const Issue = require('../models/Issue');

// @route   GET api/admin/stats
// @desc    Get system statistics
// @access  Private/Admin
router.get('/stats', [auth, admin], async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalIssues = await Issue.countDocuments();
        const openIssues = await Issue.countDocuments({ status: 'Open' });
        const inProgressIssues = await Issue.countDocuments({ status: 'In Progress' });
        const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });

        res.json({
            totalUsers,
            totalIssues,
            openIssues,
            inProgressIssues,
            resolvedIssues
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/admin/issues/:id/status
// @desc    Update issue status
// @access  Private/Admin
router.put('/issues/:id/status', [auth, admin], async (req, res) => {
    try {
        const { status } = req.body;
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ msg: 'Issue not found' });
        }

        const statusOrder = { 'Open': 0, 'In Progress': 1, 'Resolved': 2 };
        if (statusOrder[status] < statusOrder[issue.status]) {
            return res.status(400).json({ msg: 'Status progression cannot be reversed' });
        }

        issue.status = status;
        await issue.save();

        res.json(issue);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/admin/issues/:id
// @desc    Delete issue
// @access  Private/Admin
router.delete('/issues/:id', [auth, admin], async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ msg: 'Issue not found' });
        }

        await issue.deleteOne();

        res.json({ msg: 'Issue removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
