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
const SupportRequest = require('../models/SupportRequest');

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
        const pendingReports = await CommentReport.countDocuments({ status: 'pending' });
        const pendingAppeals = await SupportRequest.countDocuments({ status: 'pending', type: 'ACCOUNT_BLOCK_APPEAL' });

        res.json({
            totalUsers: totalCitizens,
            totalCitizens,
            activeCitizens,
            blockedCitizens,
            totalIssues,
            openIssues: pendingIssues,
            pendingIssues,
            inProgressIssues,
            resolvedIssues,
            pendingReports,
            pendingAppeals
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
        const pendingReports = await CommentReport.countDocuments({ status: 'pending' });
        const pendingAppeals = await SupportRequest.countDocuments({ status: 'pending', type: 'ACCOUNT_BLOCK_APPEAL' });

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
                resolvedIssues,
                pendingReports,
                pendingAppeals
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

        // 2. Create targeted in-app notification ONLY for the original citizen reporter
        try {
            let notifType = 'ISSUE_STATUS_UPDATE';
            let notifTitle = '';
            let notifMessage = '';

            if ((oldStatus === 'Pending' || oldStatus === 'Open') && targetStatusDisplay === 'In Progress') {
                notifType = 'ISSUE_IN_PROGRESS';
                notifTitle = 'Issue In Progress';
                notifMessage = `Your reported issue "${issue.title}" is now being worked on.`;
            } else if (targetStatusDisplay === 'Resolved') {
                notifType = 'ISSUE_RESOLVED';
                notifTitle = 'Issue Resolved';
                notifMessage = `Your reported issue "${issue.title}" has been resolved. Thank you for bringing this concern to CivicPulse. Your report helped us identify the problem, and we appreciate your contribution to improving the community. We will continue working to prevent similar issues from happening again.`;
            } else {
                notifTitle = 'Issue Status Updated';
                notifMessage = `Your reported issue "${issue.title}" is now marked as "${targetStatusDisplay}".`;
            }

            if (issue.createdBy) {
                await Notification.create({
                    type: notifType,
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
            console.error('Failed to create citizen status notification:', notifErr);
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

// @route   GET api/admin/comment-reports
// @desc    Get paginated, filtered comment reports for Admin moderation
// @access  Private/Admin
router.get('/comment-reports', [auth, admin], async (req, res) => {
    try {
        const { status, search, sort, page = 1, limit = 10 } = req.query;

        // Build filter
        let filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { reportedByName: searchRegex },
                { reportedCommentAuthorName: searchRegex },
                { commentText: searchRegex },
                { issueTitle: searchRegex },
                { reason: searchRegex },
                { details: searchRegex }
            ];
        }

        // Sorting
        let sortOption = { createdAt: -1 };
        if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        }

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

        const reports = await CommentReport.find(filter)
            .populate('reportedBy', 'name email status')
            .populate('reportedCommentAuthorId', 'name email status')
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum)
            .lean();

        const totalFiltered = await CommentReport.countDocuments(filter);
        const totalReports = await CommentReport.countDocuments();
        const pendingCount = await CommentReport.countDocuments({ status: 'pending' });
        const resolvedCount = await CommentReport.countDocuments({ status: 'resolved' });
        const dismissedCount = await CommentReport.countDocuments({ status: 'dismissed' });

        res.json({
            reports,
            stats: {
                total: totalReports,
                pending: pendingCount,
                resolved: resolvedCount,
                dismissed: dismissedCount
            },
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalFiltered / limitNum) || 1,
                totalReports: totalFiltered
            }
        });
    } catch (err) {
        console.error('Error fetching admin comment reports:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH api/admin/comment-reports/:reportId/status
// @desc    Update status of a comment report (dismissed / resolved) with strict one-way transition and reporter notification
// @access  Private/Admin
router.patch('/comment-reports/:reportId/status', [auth, admin], async (req, res) => {
    try {
        const { status } = req.body;
        if (!['dismissed', 'resolved'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid report status. Only "dismissed" or "resolved" are allowed.' });
        }

        const report = await CommentReport.findById(req.params.reportId);
        if (!report) {
            return res.status(404).json({ msg: 'Comment report not found' });
        }

        // Strict one-way state machine: Report can only be transitioned from pending
        if (report.status === 'dismissed' || report.status === 'resolved') {
            return res.status(400).json({ 
                msg: `This report has already been finalized as "${report.status.toUpperCase()}" and cannot be modified.` 
            });
        }

        const adminUser = await User.findById(req.user.id).select('name');
        const adminName = adminUser?.name || 'Administrator';

        report.status = status;
        report.moderatedBy = req.user.id;
        report.moderatedByName = adminName;
        report.moderatedAt = new Date();
        await report.save();

        // If report is marked RESOLVED, notify the user who submitted the report (report.reportedBy)
        if (status === 'resolved' && report.reportedBy) {
            try {
                await Notification.create({
                    type: 'REPORT_RESOLVED',
                    recipientRole: 'citizen',
                    userId: report.reportedBy,
                    title: 'Report Resolved',
                    message: 'Thank you for helping keep CivicPulse respectful. Your reported comment has been reviewed and the report has been resolved. We appreciate your concern and contribution to the community.',
                    reportId: report._id,
                    issueId: report.issueId,
                    issueTitle: report.issueTitle,
                    isRead: false
                });
            } catch (notifErr) {
                console.error('Failed to notify report submitter on resolution:', notifErr);
            }
        }

        res.json({
            msg: `Report has been permanently marked as ${status.toUpperCase()}`,
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

// @route   GET api/admin/appeals
// @desc    Get paginated, filtered account appeals
// @access  Private/Admin
router.get('/appeals', [auth, admin], async (req, res) => {
    try {
        const { status, search, sort, page = 1, limit = 10 } = req.query;

        let filter = { type: 'ACCOUNT_BLOCK_APPEAL' };
        if (status && status !== 'all') {
            filter.status = status;
        }

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { referenceId: searchRegex },
                { email: searchRegex },
                { userName: searchRegex },
                { subject: searchRegex },
                { message: searchRegex }
            ];
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        }

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

        const appeals = await SupportRequest.find(filter)
            .populate('userId', 'name email status createdAt blockedReason')
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum)
            .lean();

        const totalFiltered = await SupportRequest.countDocuments(filter);
        const totalAppeals = await SupportRequest.countDocuments({ type: 'ACCOUNT_BLOCK_APPEAL' });
        const pendingCount = await SupportRequest.countDocuments({ type: 'ACCOUNT_BLOCK_APPEAL', status: 'pending' });
        const reviewedCount = await SupportRequest.countDocuments({ type: 'ACCOUNT_BLOCK_APPEAL', status: 'reviewed' });
        const resolvedCount = await SupportRequest.countDocuments({ type: 'ACCOUNT_BLOCK_APPEAL', status: 'resolved' });

        res.json({
            appeals,
            stats: {
                total: totalAppeals,
                pending: pendingCount,
                reviewed: reviewedCount,
                resolved: resolvedCount
            },
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalFiltered / limitNum) || 1,
                totalAppeals: totalFiltered
            }
        });
    } catch (err) {
        console.error('Error fetching admin appeals:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/appeals/:id
// @desc    Get detailed appeal with citizen context
// @access  Private/Admin
router.get('/appeals/:id', [auth, admin], async (req, res) => {
    try {
        const appeal = await SupportRequest.findById(req.params.id)
            .populate('userId', 'name email status createdAt blockedReason')
            .lean();

        if (!appeal) {
            return res.status(404).json({ msg: 'Appeal request not found' });
        }

        // If a linked user exists, fetch extra civic metadata
        let userContext = null;
        if (appeal.userId?._id || appeal.email) {
            const targetUserId = appeal.userId?._id;
            const targetUser = targetUserId 
                ? await User.findById(targetUserId).lean() 
                : await User.findOne({ email: appeal.email.toLowerCase() }).lean();

            if (targetUser) {
                const totalIssues = await Issue.countDocuments({ createdBy: targetUser._id });
                const moderationLogs = await UserModerationHistory.find({ userId: targetUser._id })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .lean();

                userContext = {
                    _id: targetUser._id,
                    name: targetUser.name,
                    email: targetUser.email,
                    status: targetUser.status,
                    createdAt: targetUser.createdAt,
                    blockedReason: targetUser.blockedReason || 'Violation of platform guidelines',
                    totalIssues,
                    moderationLogs
                };
            }
        }

        res.json({
            appeal,
            userContext
        });
    } catch (err) {
        console.error('Error fetching appeal details:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/admin/appeals/:id/decision
// @desc    Handle admin decision on an account appeal (unblock / keep_blocked)
// @access  Private/Admin
router.post('/appeals/:id/decision', [auth, admin], async (req, res) => {
    try {
        const { decision, adminNotes } = req.body;

        if (!['unblock', 'keep_blocked'].includes(decision)) {
            return res.status(400).json({ msg: 'Invalid decision. Must be "unblock" or "keep_blocked".' });
        }

        const appeal = await SupportRequest.findById(req.params.id);
        if (!appeal) {
            return res.status(404).json({ msg: 'Appeal request not found' });
        }

        const adminUser = await User.findById(req.user.id).select('name');
        const adminName = adminUser?.name || 'Administrator';

        // Target user lookup
        let targetUser = null;
        if (appeal.userId) {
            targetUser = await User.findById(appeal.userId);
        } else if (appeal.email) {
            targetUser = await User.findOne({ email: appeal.email.toLowerCase() });
        }

        if (decision === 'unblock') {
            if (targetUser) {
                targetUser.status = 'active';
                targetUser.blockedReason = null;
                targetUser.blockedAt = null;
                targetUser.blockedBy = null;
                await targetUser.save();

                // Audit moderation history
                await UserModerationHistory.create({
                    userId: targetUser._id,
                    action: 'unblocked',
                    reason: `Appeal approved: ${adminNotes || 'Account restored after appeal review'}`,
                    performedBy: req.user.id,
                    performedByName: adminName
                });

                // Citizen notification
                try {
                    await Notification.create({
                        type: 'APPEAL_RESOLVED',
                        recipientRole: 'citizen',
                        userId: targetUser._id,
                        title: 'Account Restored',
                        message: 'Your account appeal has been reviewed and your CivicPulse account has been restored. You can now log in again.',
                        supportRequestId: appeal._id,
                        referenceId: appeal.referenceId,
                        isRead: false
                    });
                } catch (notifErr) {
                    console.error('Failed to notify citizen of unblock:', notifErr.message);
                }
            }

            appeal.status = 'resolved';
            appeal.decision = 'unblocked';
            appeal.adminNotes = adminNotes || 'Account restored upon appeal review';
            appeal.reviewedBy = req.user.id;
            appeal.reviewedByName = adminName;
            appeal.reviewedAt = new Date();
            await appeal.save();

            return res.json({
                msg: 'Account appeal approved and citizen account unblocked successfully.',
                appeal
            });
        } else {
            // keep_blocked
            if (targetUser) {
                await UserModerationHistory.create({
                    userId: targetUser._id,
                    action: 'blocked',
                    reason: `Appeal reviewed and maintained: ${adminNotes || 'Violation confirmed'}`,
                    performedBy: req.user.id,
                    performedByName: adminName
                });

                try {
                    await Notification.create({
                        type: 'APPEAL_RESOLVED',
                        recipientRole: 'citizen',
                        userId: targetUser._id,
                        title: 'Account Appeal Reviewed',
                        message: 'Your account appeal has been reviewed. After review, your account will remain blocked because the platform guidelines violation was confirmed.',
                        supportRequestId: appeal._id,
                        referenceId: appeal.referenceId,
                        isRead: false
                    });
                } catch (notifErr) {
                    console.error('Failed to notify citizen of confirmed block:', notifErr.message);
                }
            }

            appeal.status = 'resolved';
            appeal.decision = 'kept_blocked';
            appeal.adminNotes = adminNotes || 'Account block maintained upon review';
            appeal.reviewedBy = req.user.id;
            appeal.reviewedByName = adminName;
            appeal.reviewedAt = new Date();
            await appeal.save();

            return res.json({
                msg: 'Account appeal resolved. The account remains blocked as confirmed.',
                appeal
            });
        }
    } catch (err) {
        console.error('Error processing appeal decision:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

