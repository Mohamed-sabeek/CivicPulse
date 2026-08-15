const mongoose = require('mongoose');

const CommentReportSchema = new mongoose.Schema({
    commentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    commentText: {
        type: String,
        required: true,
    },
    reportedCommentAuthorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reportedCommentAuthorName: {
        type: String,
        default: 'Citizen',
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reportedByName: {
        type: String,
        default: 'Citizen',
    },
    issueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue',
        required: true,
    },
    issueTitle: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        enum: [
            'Spam',
            'Harassment or abusive content',
            'Inappropriate content',
            'Misleading information',
            'Other'
        ],
        required: true,
    },
    details: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'dismissed', 'resolved'],
        default: 'pending',
    },
    moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    moderatedByName: {
        type: String,
    },
    moderatedAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index to quickly check duplicate reports by same user
CommentReportSchema.index({ commentId: 1, reportedBy: 1 }, { unique: true });

module.exports = mongoose.model('CommentReport', CommentReportSchema);
