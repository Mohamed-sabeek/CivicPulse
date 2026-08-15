const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: [
            'NEW_ISSUE', 
            'ISSUE_IN_PROGRESS', 
            'ISSUE_RESOLVED', 
            'NEW_COMMENT_REPORT', 
            'REPORT_RESOLVED', 
            'new_issue', 
            'ISSUE_STATUS_UPDATE', 
            'COMMENT_REPORT', 
            'comment_reported'
        ],
        default: 'NEW_ISSUE',
    },
    recipientRole: {
        type: String,
        enum: ['admin', 'citizen'],
        default: 'admin'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String,
        required: true,
        default: 'Notification'
    },
    message: {
        type: String,
        required: true
    },
    issueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue'
    },
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommentReport'
    },
    userName: {
        type: String,
        default: 'Citizen'
    },
    issueTitle: {
        type: String
    },
    category: {
        type: String
    },
    location: {
        type: String
    },
    oldStatus: {
        type: String
    },
    newStatus: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', NotificationSchema);
