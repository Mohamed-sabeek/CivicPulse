const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Issue = require('../models/Issue');

// @route   GET api/issues
// @desc    Get all issues
// @access  Public
router.get('/', async (req, res) => {
    try {
        const issues = await Issue.find().sort({ date: -1 });
        res.json(issues);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/issues/:id
// @desc    Get issue by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
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
// @desc    Comment on an issue
// @access  Private
router.post('/:id/comment', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);

        const newComment = {
            text: req.body.text,
            user: req.user.id,
        };

        issue.comments.unshift(newComment);

        await issue.save();
        res.json(issue.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/issues/:id/status
// @desc    Update issue status
// @access  Private/Admin
router.put('/:id/status', [auth, admin], async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ msg: 'Issue not found' });
        }

        issue.status = req.body.status;
        await issue.save();
        res.json(issue);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/issues/:id
// @desc    Delete issue
// @access  Private/Admin
router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ msg: 'Issue not found' });
        }

        await issue.remove();

        res.json({ msg: 'Issue removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
