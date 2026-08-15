import React, { useState, useEffect, useCallback } from 'react';
import { 
    X, User, Mail, Phone, Calendar, Shield, AlertCircle, 
    CheckCircle2, Clock, ThumbsUp, MapPin, ExternalLink,
    Activity, Ban, CheckCircle, AlertTriangle, History
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const UserDetailsModal = ({ userId, isOpen, onClose, onUserStatusUpdated }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Block / Unblock Modal state
    const [moderationModalOpen, setModerationModalOpen] = useState(false);
    const [moderationAction, setModerationAction] = useState('block'); // 'block' or 'unblock'
    const [blockReason, setBlockReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchUserDetails = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/admin/users/${userId}`);
            setUserData(res.data);
        } catch (err) {
            console.error('Error fetching user details:', err);
            setError(err.response?.data?.msg || 'Failed to load citizen profile. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (isOpen && userId) {
            fetchUserDetails();
        } else {
            setUserData(null);
        }
    }, [isOpen, userId, fetchUserDetails]);

    const handleConfirmModeration = async () => {
        if (!userData?.user?._id) return;
        setActionLoading(true);
        try {
            if (moderationAction === 'block') {
                await api.patch(`/admin/users/${userData.user._id}/block`, {
                    reason: blockReason.trim() || 'Violation of platform guidelines'
                });
            } else {
                await api.patch(`/admin/users/${userData.user._id}/unblock`);
            }
            setModerationModalOpen(false);
            setBlockReason('');
            fetchUserDetails();
            if (onUserStatusUpdated) onUserStatusUpdated();
        } catch (err) {
            console.error('Error updating citizen status:', err);
            alert(err.response?.data?.msg || 'Failed to update citizen standing.');
        } finally {
            setActionLoading(false);
        }
    };

    if (!isOpen) return null;

    const user = userData?.user;
    const isBlocked = user?.status === 'blocked' || user?.status === 'Suspended';
    const stats = userData?.civicActivity || {
        totalIssues: 0,
        pendingCount: 0,
        inProgressCount: 0,
        resolvedCount: 0,
        totalUpvotesReceived: 0
    };
    const issues = userData?.reportedIssues || [];
    const moderationLogs = userData?.moderationHistory || [];

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Resolved':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} /> Resolved
                    </span>
                );
            case 'In Progress':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                        <Clock size={12} /> In Progress
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle size={12} /> Pending
                    </span>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div 
                className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/80 via-white to-indigo-50/30">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-md ${
                            isBlocked 
                                ? 'bg-red-600 text-white shadow-red-200'
                                : 'bg-indigo-600 text-white shadow-indigo-200'
                        }`}>
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Citizen Profile & Activity Record</h2>
                            <p className="text-xs text-gray-500 font-medium">Participation metrics, historical issues, and account moderation</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 text-gray-400 hover:text-gray-700 rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
                    {loading ? (
                        <div className="py-16 flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-bold text-gray-500">Loading citizen profile...</p>
                        </div>
                    ) : error ? (
                        <div className="py-12 px-6 text-center space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center">
                                <AlertCircle size={24} />
                            </div>
                            <p className="text-gray-700 font-bold">{error}</p>
                            <button
                                onClick={fetchUserDetails}
                                className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition shadow"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : user ? (
                        <>
                            {/* Profile Overview Card */}
                            <div className={`rounded-3xl p-6 border shadow-sm relative overflow-hidden ${
                                isBlocked 
                                    ? 'bg-gradient-to-br from-red-50/50 via-white to-rose-50/30 border-red-100'
                                    : 'bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 border-indigo-100/60'
                            }`}>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg ${
                                            isBlocked
                                                ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-200'
                                                : 'bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-indigo-200'
                                        }`}>
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{user.name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                                                    user.role === 'admin' 
                                                        ? 'bg-purple-100 text-purple-700 border-purple-200' 
                                                        : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                                }`}>
                                                    {user.role === 'admin' ? 'Administrator' : 'Citizen'}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${
                                                    isBlocked
                                                        ? 'bg-red-50 text-red-700 border-red-200'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`}>
                                                    <span className={`w-2 h-2 rounded-full ${isBlocked ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                    {isBlocked ? 'Blocked' : 'Active'}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                                                <span className="flex items-center gap-1.5">
                                                    <Mail size={14} className="text-gray-400" />
                                                    {user.email}
                                                </span>
                                                {user.phone && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Phone size={14} className="text-gray-400" />
                                                        {user.phone}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-gray-400" />
                                                    Joined: {new Date(user.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Moderation Block/Unblock Action */}
                                    {user.role !== 'admin' && (
                                        <div>
                                            {isBlocked ? (
                                                <button
                                                    onClick={() => {
                                                        setModerationAction('unblock');
                                                        setModerationModalOpen(true);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95"
                                                >
                                                    <CheckCircle size={14} /> Unblock Account
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setModerationAction('block');
                                                        setModerationModalOpen(true);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-xl transition active:scale-95"
                                                >
                                                    <Ban size={14} /> Block Account
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Blocked Warning Banner */}
                                {isBlocked && (
                                    <div className="mt-5 p-3.5 bg-red-50/80 border border-red-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-red-800">
                                        <Ban size={16} className="text-red-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold">This citizen account is currently blocked from accessing CivicPulse.</p>
                                            {user.blockedReason && (
                                                <p className="text-[11px] text-red-700 mt-0.5">
                                                    <span className="font-bold">Reason:</span> {user.blockedReason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Civic Activity Metric Cards */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Activity size={18} className="text-indigo-600" />
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Civic Participation Summary</h4>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Reported</p>
                                        <p className="text-2xl font-black text-gray-900">{stats.totalIssues}</p>
                                    </div>
                                    <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 shadow-sm text-center">
                                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Pending</p>
                                        <p className="text-2xl font-black text-amber-700">{stats.pendingCount}</p>
                                    </div>
                                    <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 shadow-sm text-center">
                                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">In Progress</p>
                                        <p className="text-2xl font-black text-blue-700">{stats.inProgressCount}</p>
                                    </div>
                                    <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 shadow-sm text-center">
                                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Resolved</p>
                                        <p className="text-2xl font-black text-emerald-700">{stats.resolvedCount}</p>
                                    </div>
                                    <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 shadow-sm text-center col-span-2 sm:col-span-1">
                                        <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">Support Upvotes</p>
                                        <p className="text-2xl font-black text-purple-700 flex items-center justify-center gap-1">
                                            <ThumbsUp size={16} /> {stats.totalUpvotesReceived}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Reported Issues Feed */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Shield size={18} className="text-indigo-600" />
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Preserved Reported Issues</h4>
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                        {issues.length} {issues.length === 1 ? 'Report' : 'Reports'}
                                    </span>
                                </div>

                                {issues.length === 0 ? (
                                    <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <div className="w-12 h-12 rounded-2xl bg-white text-gray-400 mx-auto flex items-center justify-center shadow-sm mb-3">
                                            <AlertCircle size={24} />
                                        </div>
                                        <h5 className="font-black text-gray-800 text-sm">No Issues Reported</h5>
                                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">This citizen has not reported any community issues to CivicPulse yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {issues.map(iss => (
                                            <div 
                                                key={iss._id}
                                                className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    {iss.imageUrl ? (
                                                        <img 
                                                            src={iss.imageUrl} 
                                                            alt={iss.title} 
                                                            className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                                                            <AlertCircle size={20} />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg border border-indigo-100">
                                                                {iss.category}
                                                            </span>
                                                            {getStatusBadge(iss.statusDisplay || iss.status)}
                                                        </div>
                                                        <h5 className="font-bold text-gray-900 text-sm truncate">{iss.title}</h5>
                                                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <MapPin size={12} className="text-gray-400" />
                                                                {iss.location || 'Coimbatore'}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <ThumbsUp size={12} className="text-indigo-500" />
                                                                {iss.upvoteCount || 0} Supports
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={12} />
                                                                {new Date(iss.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Link 
                                                    to={`/issues/${iss._id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-50 group-hover:bg-indigo-50 text-gray-600 group-hover:text-indigo-600 rounded-xl text-xs font-bold transition whitespace-nowrap"
                                                >
                                                    <span>View Issue</span>
                                                    <ExternalLink size={12} />
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Moderation Audit History */}
                            {moderationLogs.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <History size={16} className="text-indigo-600" />
                                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Moderation History Log</h4>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/60 divide-y divide-gray-200/60 text-xs">
                                        {moderationLogs.map((log, idx) => (
                                            <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                                                <div>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-black text-[10px] uppercase ${
                                                        log.action === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {log.action}
                                                    </span>
                                                    <p className="text-gray-700 mt-1 font-medium">
                                                        <span className="font-bold">Reason:</span> {log.reason || 'None specified'}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400">Performed by: {log.performedByName || 'Admin'}</p>
                                                </div>
                                                <span className="text-[11px] text-gray-400 shrink-0 font-medium">
                                                    {new Date(log.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 transition shadow-sm active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Moderation Confirmation Modal */}
            {moderationModalOpen && (
                <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                moderationAction === 'block' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                                {moderationAction === 'block' ? <Ban size={24} /> : <CheckCircle size={24} />}
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-gray-900">
                                    {moderationAction === 'block' ? 'Block this account?' : 'Unblock this account?'}
                                </h4>
                                <p className="text-xs text-gray-500 font-bold">Citizen: {user?.name}</p>
                            </div>
                        </div>

                        <div className={`p-4 rounded-2xl flex items-start gap-2.5 text-xs leading-relaxed ${
                            moderationAction === 'block' 
                                ? 'bg-amber-50/70 border border-amber-200/60 text-amber-800' 
                                : 'bg-emerald-50/70 border border-emerald-200/60 text-emerald-800'
                        }`}>
                            {moderationAction === 'block' ? (
                                <>
                                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                    <p>
                                        This citizen will no longer be able to access or interact with CivicPulse. Their existing civic reports and activity history will be preserved.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                    <p>
                                        This citizen will regain access to CivicPulse and will be able to report and interact with civic issues again.
                                    </p>
                                </>
                            )}
                        </div>

                        {moderationAction === 'block' && (
                            <div>
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                                    Reason for blocking (optional):
                                </label>
                                <textarea
                                    rows={3}
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    placeholder="Repeated spam reports / abusive comments / misuse of platform..."
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none"
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setModerationModalOpen(false);
                                    setBlockReason('');
                                }}
                                disabled={actionLoading}
                                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmModeration}
                                disabled={actionLoading}
                                className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 ${
                                    moderationAction === 'block' 
                                        ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                }`}
                            >
                                {actionLoading ? 'Processing...' : moderationAction === 'block' ? 'Block Account' : 'Unblock Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDetailsModal;
