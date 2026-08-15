const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
    },
    status: {
        type: String,
        enum: ['active', 'blocked', 'Active', 'Suspended'],
        default: 'active',
    },
    blockedReason: {
        type: String,
    },
    blockedAt: {
        type: Date,
    },
    blockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    role: {
        type: String,
        enum: ['user', 'citizen', 'admin'],
        default: 'user',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('User', UserSchema);
