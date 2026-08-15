const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SupportRequest = require('../models/SupportRequest');
const Notification = require('../models/Notification');

// Simple in-memory rate-limiter map to prevent automated spam (email -> lastSubmissionTime)
const recentSubmissions = new Map();

// Helper to generate unique reference ID
const generateReferenceId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `CP-${randomNum}`;
};

// @route   POST api/support/appeal
// @desc    Submit a blocked account review appeal (Public, no auth token required)
// @access  Public
router.post('/appeal', async (req, res) => {
    try {
        const { email, subject, message } = req.body;

        // 1. Basic validation
        if (!email || !email.trim()) {
            return res.status(400).json({ msg: 'Email address is required.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const cleanEmail = email.trim().toLowerCase();
        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({ msg: 'Please provide a valid email address.' });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({ msg: 'Please enter your message explaining your concern.' });
        }

        const cleanMessage = message.trim();
        if (cleanMessage.length < 10) {
            return res.status(400).json({ msg: 'Message must be at least 10 characters long.' });
        }

        if (cleanMessage.length > 2000) {
            return res.status(400).json({ msg: 'Message must not exceed 2000 characters.' });
        }

        const cleanSubject = subject && subject.trim() ? subject.trim().substring(0, 200) : 'Request to review blocked account';

        // 2. Anti-Spam Rate Limit: 1 request every 60 seconds per email
        const now = Date.now();
        const lastSubmitted = recentSubmissions.get(cleanEmail);
        if (lastSubmitted && now - lastSubmitted < 60000) {
            const waitSecs = Math.ceil((60000 - (now - lastSubmitted)) / 1000);
            return res.status(429).json({ 
                msg: `You submitted an appeal recently. Please wait ${waitSecs} seconds before submitting again.` 
            });
        }
        recentSubmissions.set(cleanEmail, now);

        // 3. User lookup silently (do not expose existence)
        let userId = null;
        let userName = 'Citizen';

        try {
            const user = await User.findOne({ email: cleanEmail }).select('_id name');
            if (user) {
                userId = user._id;
                userName = user.name || 'Citizen';
            }
        } catch (lookupErr) {
            console.error('Error looking up user for appeal:', lookupErr.message);
        }

        // 4. Generate unique reference ID
        let referenceId = generateReferenceId();
        let existingRef = await SupportRequest.findOne({ referenceId });
        while (existingRef) {
            referenceId = generateReferenceId();
            existingRef = await SupportRequest.findOne({ referenceId });
        }

        // 5. Create Support Request
        const newSupportRequest = new SupportRequest({
            referenceId,
            email: cleanEmail,
            userId,
            userName,
            subject: cleanSubject,
            message: cleanMessage,
            type: 'ACCOUNT_BLOCK_APPEAL',
            status: 'pending',
            decision: 'none'
        });

        await newSupportRequest.save();

        // 6. Notify Administrators in real-time
        try {
            await Notification.create({
                type: 'ACCOUNT_BLOCK_APPEAL',
                recipientRole: 'admin',
                title: 'Account Appeal',
                message: `${userName} (${cleanEmail}) has submitted a request to review their blocked account.`,
                supportRequestId: newSupportRequest._id,
                referenceId: newSupportRequest.referenceId,
                userName,
                isRead: false
            });
        } catch (notifErr) {
            console.error('Failed to create admin notification for account appeal:', notifErr.message);
        }

        // 7. Safe response (does not expose user existence or sensitive internals)
        return res.status(201).json({
            success: true,
            referenceId: newSupportRequest.referenceId,
            message: 'Your request has been submitted successfully. An administrator will review your account appeal.'
        });

    } catch (err) {
        console.error('Error submitting support appeal:', err);
        return res.status(500).json({ msg: 'Server error. Please try again later.' });
    }
});

module.exports = router;
