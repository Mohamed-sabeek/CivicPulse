const mongoose = require('mongoose');

const IssueHistorySchema = new mongoose.Schema({
    issueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue',
        required: true,
        index: true
    },
    previousStatus: {
        type: String,
        required: true
    },
    newStatus: {
        type: String,
        required: true
    },
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    changedByName: {
        type: String,
        default: 'System Admin'
    },
    changedAt: {
        type: Date,
        default: Date.now
    },
    note: {
        type: String
    }
});

module.exports = mongoose.model('IssueHistory', IssueHistorySchema);
