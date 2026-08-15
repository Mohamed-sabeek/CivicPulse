const mongoose = require('mongoose');

const UserModerationHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        enum: ['blocked', 'unblocked'],
        required: true,
    },
    reason: {
        type: String,
        default: 'Not specified',
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    performedByName: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('UserModerationHistory', UserModerationHistorySchema);
