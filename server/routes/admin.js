const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const Issue = require('../models/Issue');
const IssueHistory = require('../models/IssueHistory');
const Notification = require('../models/Notification');
const UserModerationHistory = require('../models/UserModerationHistory');
const CommentReport = require('../models/CommentReport');

// @route   GET api/admin/stats
// @desc    Get system statistics
// @access  Private/Admin
router.get('/stats', [auth, admin], async (req, res) => {
    try {
        const totalCitizens = await User.countDocuments({ role: { $ne: 'admin' } });
        const activeCitizens = await User.countDocuments({ role: { $ne: 'admin' }, status: { $nin: ['blocked', 'Suspended'] } });
        const blockedCitizens = await User.countDocuments({ role: { $ne: 'admin' }, status: { $in: ['blocked', 'Suspended'] } });
        const totalIssues = await Issue.countDocuments();
        const pendingIssues = await Issue.countDocuments({ status: { $in: ['Open', 'Pending'] } });
        const inProgressIssues = await Issue.countDocuments({ status: 'In Progress' });
        const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });

        res.json({
            totalUsers: totalCitizens,
            totalCitizens,
            activeCitizens,
            blockedCitizens,
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
        const totalCitizens = await User.countDocuments({ role: { $ne: 'admin' } });
        const activeCitizens = await User.countDocuments({ role: { $ne: 'admin' }, status: { $nin: ['blocked', 'Suspended'] } });
        const blockedCitizens = await User.countDocuments({ role: { $ne: 'admin' }, status: { $in: ['blocked', 'Suspended'] } });
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
                totalUsers: totalCitizens,
                totalCitizens,
                activeCitizens,
                blockedCitizens,
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

// @route   GET api/admin/issues/:id
// @desc    Get comprehensive issue details for Admin Issue Details page
// @access  Private/Admin
router.get('/issues/:id', [auth, admin], async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id)
            .populate('createdBy', 'name email phone status')
            .populate('comments.user', 'name email role status')
            .lean();

        if (!issue) {
            return res.status(404).json({ msg: 'Issue not found' });
        }

        const historyLogs = await IssueHistory.find({ issueId: req.params.id })
            .sort({ changedAt: -1 })
            .lean();

        const commentReports = await CommentReport.find({ issueId: req.params.id })
            .sort({ createdAt: -1 })
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
            commentReports,
            resolutionTime: resolutionTimeFormatted
        });
    } catch (err) {
        console.error('Error fetching admin issue details:', err.message);
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

// ==========================================
// USER MANAGEMENT ENDPOINTS
// ==========================================

// @route   GET api/admin/users
// @desc    Get paginated users with search, filtering, and civic metrics
// @access  Private/Admin
router.get('/users', [auth, admin], async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const search = req.query.search?.trim() || '';
        const statusFilter = req.query.status || 'All';
        const sortOption = req.query.sort || 'recent';

        // Base citizen filter: strictly exclude admin accounts
        let citizenFilter = {
            role: { $ne: 'admin' }
        };

        if (search) {
            citizenFilter.$and = [
                {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } },
                        { phone: { $regex: search, $options: 'i' } }
                    ]
                }
            ];
        }

        const normalizedFilterStatus = statusFilter.toLowerCase();
        if (normalizedFilterStatus === 'active') {
            citizenFilter.status = { $nin: ['blocked', 'Suspended'] };
        } else if (normalizedFilterStatus === 'blocked' || normalizedFilterStatus === 'suspended') {
            citizenFilter.status = { $in: ['blocked', 'Suspended'] };
        }

        // Summary Stats (strictly citizens, excluding admins)
        const totalCitizens = await User.countDocuments({ role: { $ne: 'admin' } });
        const activeCitizens = await User.countDocuments({ role: { $ne: 'admin' }, status: { $nin: ['blocked', 'Suspended'] } });
        const blockedCitizens = await User.countDocuments({ role: { $ne: 'admin' }, status: { $in: ['blocked', 'Suspended'] } });
        
        // Count distinct citizen reporters
        const citizenUsers = await User.find({ role: { $ne: 'admin' } }).select('_id').lean();
        const citizenIds = citizenUsers.map(u => u._id);
        const distinctReporters = await Issue.distinct('createdBy', { createdBy: { $in: citizenIds } });
        const usersWithReports = distinctReporters ? distinctReporters.length : 0;
        const totalIssuesReported = await Issue.countDocuments();

        // Fetch citizens matching filter without passwords
        let users = await User.find(citizenFilter)
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        // Attach dynamic civic issue metrics for each user
        const allIssues = await Issue.find().select('createdBy status upvotes').lean();

        const userMetricsMap = {};
        allIssues.forEach(issue => {
            if (!issue.createdBy) return;
            const creatorId = issue.createdBy.toString();
            if (!userMetricsMap[creatorId]) {
                userMetricsMap[creatorId] = {
                    totalIssues: 0,
                    pending: 0,
                    inProgress: 0,
                    resolved: 0,
                    totalUpvotes: 0
                };
            }
            userMetricsMap[creatorId].totalIssues += 1;
            const normalizedStatus = (issue.status === 'Open' || issue.status === 'Pending') ? 'pending' :
                                    issue.status === 'In Progress' ? 'inProgress' : 'resolved';
            userMetricsMap[creatorId][normalizedStatus] += 1;
            userMetricsMap[creatorId].totalUpvotes += (issue.upvotes ? issue.upvotes.length : 0);
        });

        users = users.map(user => {
            const metrics = userMetricsMap[user._id.toString()] || {
                totalIssues: 0,
                pending: 0,
                inProgress: 0,
                resolved: 0,
                totalUpvotes: 0
            };
            const isBlocked = user.status === 'blocked' || user.status === 'Suspended';
            return {
                ...user,
                status: isBlocked ? 'blocked' : 'active',
                statusDisplay: isBlocked ? 'Blocked' : 'Active',
                issuesCount: metrics.totalIssues,
                pendingCount: metrics.pending,
                inProgressCount: metrics.inProgress,
                resolvedCount: metrics.resolved,
                totalUpvotesReceived: metrics.totalUpvotes
            };
        });

        // Sorting
        if (sortOption === 'most_active') {
            users.sort((a, b) => b.issuesCount - a.issuesCount);
        } else if (sortOption === 'oldest') {
            users.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortOption === 'name') {
            users.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            // 'recent'
            users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        // Pagination
        const totalFilteredUsers = users.length;
        const totalPages = Math.ceil(totalFilteredUsers / limit) || 1;
        const startIndex = (page - 1) * limit;
        const paginatedUsers = users.slice(startIndex, startIndex + limit);

        res.json({
            users: paginatedUsers,
            stats: {
                totalUsers: totalCitizens,
                totalCitizens,
                activeUsers: activeCitizens,
                activeCitizens,
                blockedCitizens,
                usersWithReports,
                totalIssuesReported
            },
            pagination: {
                page,
                limit,
                totalUsers: totalFilteredUsers,
                totalCitizens: totalFilteredUsers,
                totalPages
            }
        });
    } catch (err) {
        console.error('Error fetching admin users:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/users/:id
// @desc    Get complete user profile with civic activity, reported issues, and moderation history
// @access  Private/Admin
router.get('/users/:id', [auth, admin], async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({ msg: 'Citizen account not found' });
        }

        const issues = await Issue.find({ createdBy: req.params.id })
            .sort({ createdAt: -1 })
            .lean();

        let pendingCount = 0;
        let inProgressCount = 0;
        let resolvedCount = 0;
        let totalUpvotes = 0;

        const normalizedIssues = issues.map(iss => {
            const isPending = iss.status === 'Open' || iss.status === 'Pending';
            const isInProgress = iss.status === 'In Progress';
            const isResolved = iss.status === 'Resolved';

            if (isPending) pendingCount++;
            else if (isInProgress) inProgressCount++;
            else if (isResolved) resolvedCount++;

            const voteCount = iss.upvotes ? iss.upvotes.length : 0;
            totalUpvotes += voteCount;

            return {
                ...iss,
                statusDisplay: isPending ? 'Pending' : iss.status,
                upvoteCount: voteCount
            };
        });

        // Fetch moderation logs
        const moderationHistory = await UserModerationHistory.find({ userId: req.params.id })
            .sort({ createdAt: -1 })
            .lean();

        // Fetch comments reported by this citizen
        const commentsReportedByCitizen = await CommentReport.find({ reportedBy: req.params.id })
            .sort({ createdAt: -1 })
            .lean();

        // Fetch comments reported against this citizen
        const commentsReportedAgainstCitizen = await CommentReport.find({ reportedCommentAuthorId: req.params.id })
            .sort({ createdAt: -1 })
            .lean();

        const isBlocked = user.status === 'blocked' || user.status === 'Suspended';

        res.json({
            user: {
                ...user,
                status: isBlocked ? 'blocked' : 'active',
                statusDisplay: isBlocked ? 'Blocked' : 'Active'
            },
            civicActivity: {
                totalIssues: issues.length,
                pendingCount,
                inProgressCount,
                resolvedCount,
                totalUpvotesReceived: totalUpvotes
            },
            reportedIssues: normalizedIssues,
            moderationHistory,
            commentsReportedByCitizen,
            commentsReportedAgainstCitizen
        });
    } catch (err) {
        console.error('Error fetching user details:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH api/admin/comment-reports/:reportId/status
// @desc    Update status of a comment report (reviewed / dismissed / resolved)
// @access  Private/Admin
router.patch('/comment-reports/:reportId/status', [auth, admin], async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'reviewed', 'dismissed', 'resolved'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid report status' });
        }

        const report = await CommentReport.findById(req.params.reportId);
        if (!report) {
            return res.status(404).json({ msg: 'Comment report not found' });
        }

        report.status = status;
        report.moderatedBy = req.user._id || req.user.id;
        report.moderatedByName = req.user.name || 'Admin';
        report.moderatedAt = new Date();
        await report.save();

        res.json({
            msg: `Report status updated to ${status}`,
            report
        });
    } catch (err) {
        console.error('Error updating comment report status:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH api/admin/users/:userId/block
// @desc    Block a citizen account with reason and audit log
// @access  Private/Admin
router.patch('/users/:userId/block', [auth, admin], async (req, res) => {
    try {
        const { reason } = req.body;
        const targetUser = await User.findById(req.params.userId);

        if (!targetUser) {
            return res.status(404).json({ msg: 'Citizen account not found' });
        }

        if (targetUser.role === 'admin') {
            return res.status(400).json({ msg: 'Administrator accounts cannot be blocked' });
        }

        targetUser.status = 'blocked';
        targetUser.blockedReason = reason?.trim() || 'Violation of platform guidelines';
        targetUser.blockedAt = new Date();
        targetUser.blockedBy = req.user._id || req.user.id;
        await targetUser.save();

        // Create moderation audit trail record
        await UserModerationHistory.create({
            userId: targetUser._id,
            action: 'blocked',
            reason: reason?.trim() || 'Violation of platform guidelines',
            performedBy: req.user._id || req.user.id,
            performedByName: req.user.name || 'Admin'
        });

        res.json({
            msg: `Account for ${targetUser.name} has been blocked successfully`,
            user: {
                _id: targetUser._id,
                name: targetUser.name,
                email: targetUser.email,
                status: 'blocked',
                statusDisplay: 'Blocked',
                blockedReason: targetUser.blockedReason,
                blockedAt: targetUser.blockedAt
            }
        });
    } catch (err) {
        console.error('Error blocking user:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH api/admin/users/:userId/unblock
// @desc    Unblock a citizen account and restore access
// @access  Private/Admin
router.patch('/users/:userId/unblock', [auth, admin], async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.userId);

        if (!targetUser) {
            return res.status(404).json({ msg: 'Citizen account not found' });
        }

        if (targetUser.role === 'admin') {
            return res.status(400).json({ msg: 'Administrator accounts cannot be modified' });
        }

        targetUser.status = 'active';
        targetUser.blockedReason = null;
        targetUser.blockedAt = null;
        targetUser.blockedBy = null;
        await targetUser.save();

        // Create moderation audit trail record
        await UserModerationHistory.create({
            userId: targetUser._id,
            action: 'unblocked',
            reason: 'Account reinstated by administrator',
            performedBy: req.user._id || req.user.id,
            performedByName: req.user.name || 'Admin'
        });

        res.json({
            msg: `Account for ${targetUser.name} has been unblocked successfully`,
            user: {
                _id: targetUser._id,
                name: targetUser.name,
                email: targetUser.email,
                status: 'active',
                statusDisplay: 'Active'
            }
        });
    } catch (err) {
        console.error('Error unblocking user:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
