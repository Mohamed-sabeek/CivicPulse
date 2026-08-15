const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const User = require('../models/User');
const CommentReport = require('../models/CommentReport');

// @route   GET api/issues
// @desc    Get all issues (paginated)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const skip = (page - 1) * limit;

        const issues = await Issue.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
            
        const total = await Issue.countDocuments();

        res.json({
            issues,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalIssues: total
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/issues/resolved
// @desc    Get all resolved issues
// @access  Public
router.get('/resolved', async (req, res) => {
    try {
        const issues = await Issue.find({ status: 'Resolved' })
            .sort({ resolvedAt: -1, updatedAt: -1 })
            .lean();
        res.json(issues);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/issues/me
// @desc    Get current user's issues
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const issues = await Issue.find({ createdBy: req.user.id })
            .sort({ createdAt: -1 })
            .lean();
        res.json(issues);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/issues/:id
// @desc    Get issue by ID with populated comment authors
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id)
            .populate({
                path: 'comments.user',
                select: 'name email role status'
            })
            .populate('createdBy', 'name email role');

        if (!issue) {
            return res.status(404).json({ msg: 'Issue not found' });
        }
        res.json(issue);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Issue not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST api/issues
// @desc    Create an issue
// @access  Private
router.post('/', auth, async (req, res) => {
    const { title, description, category, location, imageUrl } = req.body;

    try {
        const newIssue = new Issue({
            title,
            description,
            category,
            location,
            imageUrl,
            createdBy: req.user.id,
        });

        const issue = await newIssue.save();

        // Create in-app admin notification
        try {
            const reportingUser = await User.findById(req.user.id).select('name');
            const userName = reportingUser?.name || 'Citizen';

            await Notification.create({
                type: 'new_issue',
                title: 'New Issue Reported',
                message: `${userName} reported "${title}"`,
                issueId: issue._id,
                userId: req.user.id,
                userName: userName,
                issueTitle: title,
                category: category || 'General',
                location: location || 'Not specified',
                isRead: false
            });
        } catch (notifErr) {
            console.error('Failed to create admin notification:', notifErr);
        }

        res.json(issue);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/issues/:id/vote
// @desc    Upvote an issue
// @access  Private
router.put('/:id/vote', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ msg: 'Issue not found' });
        }

        if (issue.status === 'Resolved') {
            return res.status(400).json({ msg: 'This issue has been resolved and no longer accepts new interactions.' });
        }

        // Check if the issue has already been upvoted
        if (issue.upvotes.filter(vote => vote.toString() === req.user.id).length > 0) {
            // Remove upvote
            const removeIndex = issue.upvotes.map(vote => vote.toString()).indexOf(req.user.id);
            issue.upvotes.splice(removeIndex, 1);
        } else {
            issue.upvotes.unshift(req.user.id);
        }

        await issue.save();
        res.json(issue.upvotes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/issues/:id/comment
// @desc    Comment on an issue with author association
// @access  Private
router.post('/:id/comment', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ msg: 'Issue not found' });
        }

        if (issue.status === 'Resolved') {
            return res.status(400).json({ msg: 'This issue has been resolved and no longer accepts new interactions.' });
        }

        const newComment = {
            text: req.body.text,
            user: req.user.id,
        };

        issue.comments.unshift(newComment);
        await issue.save();

        const updatedIssue = await Issue.findById(req.params.id)
            .populate({
                path: 'comments.user',
                select: 'name email role status'
            });

        res.json(updatedIssue.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/issues/:issueId/comments/:commentId/report
// @desc    Report an inappropriate comment
// @access  Private
router.post('/:issueId/comments/:commentId/report', auth, async (req, res) => {
    try {
        const { reason, details } = req.body;
        if (!reason) {
            return res.status(400).json({ msg: 'Please provide a reason for reporting this comment.' });
        }

        const issue = await Issue.findById(req.params.issueId);
        if (!issue) {
            return res.status(404).json({ msg: 'Issue not found' });
        }

        const comment = issue.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        // Check for duplicate report by this user
        const existingReport = await CommentReport.findOne({
            commentId: req.params.commentId,
            reportedBy: req.user.id
        });

        if (existingReport) {
            return res.status(400).json({ msg: 'You have already reported this comment.' });
        }

        const authorUser = await User.findById(comment.user).select('name');
        const reportingUser = await User.findById(req.user.id).select('name');

        const newReport = new CommentReport({
            commentId: comment._id,
            commentText: comment.text,
            reportedCommentAuthorId: comment.user,
            reportedCommentAuthorName: authorUser?.name || 'Citizen',
            reportedBy: req.user.id,
            reportedByName: reportingUser?.name || 'Citizen',
            issueId: issue._id,
            issueTitle: issue.title,
            reason,
            details: details?.trim() || '',
            status: 'pending'
        });

        await newReport.save();

        // Create in-app admin web notification
        try {
            await Notification.create({
                type: 'comment_reported',
                recipientRole: 'admin',
                title: 'Comment Reported 🚩',
                message: `${reportingUser?.name || 'A citizen'} reported a comment on "${issue.title}". Reason: ${reason}`,
                issueId: issue._id,
                userId: req.user.id,
                userName: reportingUser?.name || 'Citizen',
                issueTitle: issue.title,
                category: issue.category || 'Discussion',
                location: issue.location || 'CivicPulse',
                isRead: false
            });
        } catch (notifErr) {
            console.error('Failed to create admin notification for reported comment:', notifErr);
        }

        res.json({
            msg: 'Comment report submitted successfully. An administrator will review it.',
            report: newReport
        });
    } catch (err) {
        console.error('Error reporting comment:', err);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'You have already reported this comment.' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/issues/:id/status
// @desc    Update issue status
// @route   PUT api/issues/:id/status
// @desc    Update issue status
// @access  Private/Admin
router.put('/:id/status', [auth, admin], async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ msg: 'Issue not found' });
        }

        const oldStatus = issue.status;
        const newStatus = req.body.status;

        // If status is not changing, return immediately
        if (oldStatus === newStatus) {
            return res.json(issue);
        }

        issue.status = newStatus;
        if (newStatus === 'Resolved' && !issue.resolvedAt) {
            issue.resolvedAt = new Date();
        }
        await issue.save();

        // Create targeted in-app notification for the customer who reported the issue
        try {
            let notifTitle = '';
            let notifMessage = '';

            if (oldStatus === 'Open' && newStatus === 'In Progress') {
                notifTitle = 'Issue In Progress 🛠️';
                notifMessage = `Your reported issue "${issue.title}" is now being worked on. Our team has started addressing this issue. Thank you for bringing it to our attention.`;
            } else if (newStatus === 'Resolved') {
                notifTitle = 'Issue Resolved 🎉';
                notifMessage = `Your reported issue "${issue.title}" has been resolved. Thank you for bringing this concern to our attention. Your report helped us identify and address the problem. We appreciate your contribution toward improving the community, and we will continue working to prevent similar issues from happening again.`;
            } else {
                notifTitle = 'Issue Status Updated';
                notifMessage = `Your reported issue "${issue.title}" is now marked as "${newStatus}".`;
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
                    newStatus: newStatus,
                    isRead: false
                });
            }
        } catch (notifErr) {
            console.error('Failed to create customer status notification:', notifErr);
        }

        res.json(issue);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/issues/:id
// @desc    Delete issue
// @access  Private (Owner or Admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ msg: 'Issue not found' });
        }

        // Check if user is owner or admin
        if (issue.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await issue.deleteOne();

        res.json({ msg: 'Issue removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
