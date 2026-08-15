const mongoose = require('mongoose');

const SupportRequestSchema = new mongoose.Schema({
    referenceId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    userName: {
        type: String,
        default: 'Citizen'
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        default: 'Request to review blocked account'
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['ACCOUNT_BLOCK_APPEAL', 'GENERAL_SUPPORT'],
        default: 'ACCOUNT_BLOCK_APPEAL'
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending'
    },
    decision: {
        type: String,
        enum: ['unblocked', 'kept_blocked', 'none'],
        default: 'none'
    },
    adminNotes: {
        type: String,
        default: ''
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedByName: {
        type: String
    },
    reviewedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SupportRequest', SupportRequestSchema);
