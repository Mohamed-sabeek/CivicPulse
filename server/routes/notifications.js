const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// @route   GET api/notifications
// @desc    Get notifications for logged in user (Admin sees admin notifications; Customer sees own status updates)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        let query;

        if (req.user.role === 'admin') {
            // Admin sees all new issue reports and admin alerts
            query = {
                $or: [
                    { recipientRole: 'admin' },
                    { type: 'new_issue' }
                ]
            };
        } else {
            // Customer sees only notifications sent specifically to them
            query = {
                userId: req.user.id,
                recipientRole: 'citizen'
            };
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

        res.json({
            notifications,
            unreadCount
        });
    } catch (err) {
        console.error('Error fetching notifications:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/notifications/:id/read
// @desc    Mark a single notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ msg: 'Notification not found' });
        }

        // Authorization check: Admin can mark admin notifications; Customer can only mark their own
        if (req.user.role !== 'admin' && notification.userId?.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        let query;
        if (req.user.role === 'admin') {
            query = { $or: [{ recipientRole: 'admin' }, { type: 'new_issue' }], isRead: false };
        } else {
            query = { userId: req.user.id, recipientRole: 'citizen', isRead: false };
        }

        const unreadCount = await Notification.countDocuments(query);

        res.json({
            notification,
            unreadCount
        });
    } catch (err) {
        console.error('Error marking notification read:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/notifications/mark-all-read
// @desc    Mark all user's notifications as read
// @access  Private
router.put('/mark-all-read', auth, async (req, res) => {
    try {
        let query;
        if (req.user.role === 'admin') {
            query = { $or: [{ recipientRole: 'admin' }, { type: 'new_issue' }], isRead: false };
        } else {
            query = { userId: req.user.id, recipientRole: 'citizen', isRead: false };
        }

        await Notification.updateMany(query, { isRead: true });

        res.json({
            msg: 'All notifications marked as read',
            unreadCount: 0
        });
    } catch (err) {
        console.error('Error marking all notifications read:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
