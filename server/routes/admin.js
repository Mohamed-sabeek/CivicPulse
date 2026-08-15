const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const Issue = require('../models/Issue');
const IssueHistory = require('../models/IssueHistory');
const Notification = require('../models/Notification');

// @route   GET api/admin/stats
// @desc    Get system statistics
// @access  Private/Admin
router.get('/stats', [auth, admin], async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalIssues = await Issue.countDocuments();
        const pendingIssues = await Issue.countDocuments({ status: { $in: ['Open', 'Pending'] } });
        const inProgressIssues = await Issue.countDocuments({ status: 'In Progress' });
        const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });

        res.json({
            totalUsers,
            totalIssues,
            openIssues: pendingIssues,
            pendingIssues,
            inProgressIssues,
            resolvedIssues
        });
    } catch (err) {
        console.error('Error fetching admin stats:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/dashboard
// @desc    Get dashboard stats and active issues pipeline
// @access  Private/Admin
router.get('/dashboard', [auth, admin], async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalIssues = await Issue.countDocuments();
        const pendingIssues = await Issue.countDocuments({ status: { $in: ['Open', 'Pending'] } });
        const inProgressIssues = await Issue.countDocuments({ status: 'In Progress' });
        const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });

        // Active issues: only non-resolved issues
        const activeIssues = await Issue.find({ status: { $ne: 'Resolved' } })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            stats: {
                totalUsers,
                totalIssues,
                pendingIssues,
                inProgressIssues,
                resolvedIssues
            },
            activeIssues
        });
    } catch (err) {
        console.error('Error fetching admin dashboard data:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/issues/history
// @desc    Get all issues with history metadata for Issue History page
// @access  Private/Admin
router.get('/issues/history', [auth, admin], async (req, res) => {
    try {
        const issues = await Issue.find()
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ issues });
    } catch (err) {
        console.error('Error fetching issue history:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/issues/:id/timeline
// @desc    Get complete audit timeline for a specific issue
// @access  Private/Admin
router.get('/issues/:id/timeline', [auth, admin], async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id)
            .populate('createdBy', 'name email')
            .lean();

        if (!issue) {
            return res.status(404).json({ msg: 'Issue not found' });
        }

        const historyLogs = await IssueHistory.find({ issueId: req.params.id })
            .sort({ changedAt: 1 })
            .lean();

        // Calculate resolution time if resolved
        let resolutionTimeFormatted = null;
        if (issue.status === 'Resolved' && (issue.resolvedAt || issue.updatedAt)) {
            const start = new Date(issue.createdAt);
            const end = new Date(issue.resolvedAt || issue.updatedAt);
            const diffMs = Math.max(0, end - start);
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const days = Math.floor(diffHrs / 24);
            const remainingHrs = diffHrs % 24;

            if (days > 0) {
                resolutionTimeFormatted = `${days} day${days > 1 ? 's' : ''} ${remainingHrs} hr${remainingHrs !== 1 ? 's' : ''}`;
            } else if (diffHrs > 0) {
                resolutionTimeFormatted = `${diffHrs} hour${diffHrs > 1 ? 's' : ''}`;
            } else {
                const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
                resolutionTimeFormatted = `${mins} minute${mins > 1 ? 's' : ''}`;
            }
        }

        res.json({
            issue,
            historyLogs,
            resolutionTime: resolutionTimeFormatted
        });
    } catch (err) {
        console.error('Error fetching issue timeline:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/admin/issues/:id/status
// @desc    Update issue status, record in IssueHistory, and notify reporter
// @access  Private/Admin
router.put('/issues/:id/status', [auth, admin], async (req, res) => {
    try {
        let { status, note } = req.body;
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ msg: 'Issue not found' });
        }

        // Map 'Pending' to 'Open' for schema compatibility if needed or store status
        const oldStatus = issue.status === 'Open' ? 'Pending' : issue.status;
        const normalizedTargetStatus = status === 'Pending' ? 'Open' : status;
        const targetStatusDisplay = status === 'Open' ? 'Pending' : status;

        // If status is not changing, return immediately
        if (issue.status === normalizedTargetStatus) {
            return res.json(issue);
        }

        const statusOrder = { 'Open': 0, 'Pending': 0, 'In Progress': 1, 'Resolved': 2 };
        if (statusOrder[normalizedTargetStatus] < statusOrder[issue.status]) {
            return res.status(400).json({ msg: 'Status progression cannot be reversed' });
        }

        issue.status = normalizedTargetStatus;
        if (normalizedTargetStatus === 'Resolved' && !issue.resolvedAt) {
            issue.resolvedAt = new Date();
        }
        await issue.save();

        // Fetch admin user name
        const adminUser = await User.findById(req.user.id).select('name email');
        const adminName = adminUser?.name || 'Administrator';

        // 1. Create IssueHistory entry
        try {
            const defaultNote = targetStatusDisplay === 'In Progress' 
                ? 'Admin started working on the issue' 
                : targetStatusDisplay === 'Resolved' 
                ? 'Issue marked as resolved' 
                : 'Status updated';

            await IssueHistory.create({
                issueId: issue._id,
                previousStatus: oldStatus,
                newStatus: targetStatusDisplay,
                changedBy: req.user.id,
                changedByName: adminName,
                changedAt: new Date(),
                note: note || defaultNote
            });
        } catch (historyErr) {
            console.error('Failed to create IssueHistory log:', historyErr);
        }

        // 2. Create targeted in-app notification for the citizen reporter
        try {
            let notifTitle = '';
            let notifMessage = '';

            if ((oldStatus === 'Pending' || oldStatus === 'Open') && targetStatusDisplay === 'In Progress') {
                notifTitle = 'Issue In Progress 🛠️';
                notifMessage = `Your reported issue "${issue.title}" is now being worked on. Our team has started addressing this issue. Thank you for bringing it to our attention.`;
            } else if (targetStatusDisplay === 'Resolved') {
                notifTitle = 'Issue Resolved 🎉';
                notifMessage = `Your reported issue "${issue.title}" has been resolved. Thank you for bringing this concern to our attention. Your report helped us identify and address the problem. We appreciate your contribution toward improving the community, and we will continue working to prevent similar issues from happening again.`;
            } else {
                notifTitle = 'Issue Status Updated';
                notifMessage = `Your reported issue "${issue.title}" is now marked as "${targetStatusDisplay}".`;
            }

            if (issue.createdBy) {
                await Notification.create({
                    type: 'ISSUE_STATUS_UPDATE',
                    recipientRole: 'citizen',
                    userId: issue.createdBy,
                    title: notifTitle,
                    message: notifMessage,
                    issueId: issue._id,
                    issueTitle: issue.title,
                    category: issue.category,
                    location: issue.location,
                    oldStatus: oldStatus,
                    newStatus: targetStatusDisplay,
                    isRead: false
                });
            }
        } catch (notifErr) {
            console.error('Failed to create customer status notification:', notifErr);
        }

        res.json(issue);
    } catch (err) {
        console.error('Error updating issue status:', err.message);
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
        await IssueHistory.deleteMany({ issueId: req.params.id });

        res.json({ msg: 'Issue removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
