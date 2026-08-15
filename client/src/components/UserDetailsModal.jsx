import React, { useState, useEffect, useCallback } from 'react';
import { 
    X, User, Mail, Phone, Calendar, Shield, AlertCircle, 
    CheckCircle2, Clock, ThumbsUp, MapPin, 
    Activity, Ban, CheckCircle, AlertTriangle, History, Flag, 
    ShieldAlert, ArrowRight, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const UserDetailsModal = ({ userId, isOpen, onClose, onUserStatusUpdated }) => {
    const navigate = useNavigate();
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

    const handleNavigateToIssue = (issueId) => {
        if (!issueId) return;
        onClose();
        navigate(`/admin/issues/${issueId}`);
    };

    const handleNavigateToReport = (reportId) => {
        if (!reportId) return;
        onClose();
        navigate(`/admin/reports?reportId=${reportId}`);
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
    const reportsByCitizen = userData?.commentsReportedByCitizen || [];
    const reportsAgainstCitizen = userData?.commentsReportedAgainstCitizen || [];

    const reportsSubmitted = reportsByCitizen.length;
    const reportsResolved = reportsByCitizen.filter(r => r.status === 'resolved').length;
    const reportsDismissed = reportsByCitizen.filter(r => r.status === 'dismissed').length;

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

    const getReportStatusBadge = (status) => {
        switch (status) {
            case 'resolved':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        🟢 RESOLVED
                    </span>
                );
            case 'dismissed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                        ⚪ DISMISSED
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                        🟡 PENDING REVIEW
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
                            <p className="text-xs text-gray-500 font-medium">Participation metrics, historical issues, and civic summary</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-bold text-gray-500">Loading citizen profile...</p>
                        </div>
                    ) : error ? (
                        <div className="py-12 px-4 bg-red-50 rounded-2xl border border-red-200 text-center space-y-2">
                            <AlertCircle size={28} className="text-red-500 mx-auto" />
                            <p className="text-sm font-bold text-red-800">{error}</p>
                            <button
                                onClick={fetchUserDetails}
                                className="px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : user ? (
                        <>
                            {/* Section 1: User Identity Card */}
                            <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50/50 p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner ${
                                            isBlocked
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-indigo-100 text-indigo-700'
                                        }`}>
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-lg font-black text-gray-900">{user.name}</h3>
                                                {isBlocked ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-200">
                                                        <Ban size={12} /> Blocked
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle size={12} /> Active
                                                    </span>
                                                )}
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-wider">
                                                    Citizen
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1.5 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Mail size={13} className="text-gray-400" />
                                                    {user.email}
                                                </span>
                                                {user.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={13} className="text-gray-400" />
                                                        {user.phone}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={13} className="text-gray-400" />
                                                    Joined: {new Date(user.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button: Block or Unblock */}
                                    {user.role !== 'admin' && (
                                        <div className="flex items-center gap-2 shrink-0">
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

                            {/* Moderation & Report Record Summary */}
                            <div className="bg-gradient-to-r from-red-50/40 via-white to-gray-50 p-4 rounded-2xl border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <Flag size={14} className="text-red-500" />
                                        Comment Report Moderation Overview
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Reports Submitted: <strong className="text-gray-900">{reportsSubmitted}</strong> • Resolved: <strong className="text-emerald-700">{reportsResolved}</strong> • Dismissed: <strong className="text-gray-700">{reportsDismissed}</strong>
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        onClose();
                                        navigate('/admin/reports');
                                    }}
                                    className="px-4 py-2 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-700 text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5 shrink-0"
                                >
                                    <span>Manage in Reports Page</span>
                                    <ArrowRight size={13} />
                                </button>
                            </div>

                            {/* Preserved Reported Issues Feed */}
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
                                    <div className="text-center py-10 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <div className="w-10 h-10 rounded-2xl bg-white text-gray-400 mx-auto flex items-center justify-center shadow-sm mb-2">
                                            <AlertCircle size={20} />
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
                                                            <span className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition truncate">
                                                                {iss.title}
                                                            </span>
                                                            {getStatusBadge(iss.statusDisplay || iss.status)}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                                            <span className="flex items-center gap-1 text-gray-600">
                                                                <MapPin size={12} className="text-indigo-600" />
                                                                {iss.location || 'Coimbatore'}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{new Date(iss.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1 font-bold text-indigo-600">
                                                                <ThumbsUp size={11} /> {iss.upvoteCount || 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleNavigateToIssue(iss._id)}
                                                    className="px-3.5 py-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-xs font-bold rounded-xl transition border border-gray-200 group-hover:border-indigo-200 flex items-center gap-1 shrink-0 shadow-2xs"
                                                >
                                                    <span>View Issue</span>
                                                    <ArrowRight size={13} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Section: Comments Reported By This Citizen (Read-Only with View Report Action) */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Flag size={18} className="text-indigo-600" />
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                                            Comments Reported By {user.name}
                                        </h4>
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                        {reportsByCitizen.length} {reportsByCitizen.length === 1 ? 'Report' : 'Reports'}
                                    </span>
                                </div>

                                {reportsByCitizen.length === 0 ? (
                                    <div className="text-center py-8 px-4 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-xs text-gray-400 font-bold">This citizen has not reported any comments.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {reportsByCitizen.map((rep) => (
                                            <div key={rep._id} className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs transition">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-50">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-gray-900">
                                                            👤 Author: {rep.reportedCommentAuthorName || 'Citizen'}
                                                        </span>
                                                        {getReportStatusBadge(rep.status)}
                                                    </div>
                                                    <span className="text-[11px] text-gray-400 font-medium">
                                                        📅 Reported: {new Date(rep.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60 mb-3">
                                                    <p className="text-xs text-gray-700 font-medium italic">
                                                        "{rep.commentText}"
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                                                    <div className="space-y-1">
                                                        <p className="text-gray-600 font-semibold flex items-center gap-1.5">
                                                            <MapPin size={13} className="text-gray-400" />
                                                            <span>Issue: <span className="font-bold text-gray-900">{rep.issueTitle}</span></span>
                                                        </p>
                                                        <p className="text-red-600 font-bold flex items-center gap-1.5">
                                                            <Flag size={13} />
                                                            <span>Reason: {rep.reason}</span>
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-2 sm:pt-0">
                                                        <button
                                                            onClick={() => handleNavigateToIssue(rep.issueId)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-xs font-bold rounded-xl transition border border-gray-200 shadow-2xs"
                                                        >
                                                            <span>View Issue</span>
                                                            <ArrowRight size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleNavigateToReport(rep._id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition border border-indigo-200 shadow-2xs"
                                                        >
                                                            <span>View Report</span>
                                                            <ExternalLink size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Section: Comments Reported Against This Citizen (Read-Only with View Report Action) */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert size={18} className="text-red-600" />
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                                            Comments Reported Against {user.name}
                                        </h4>
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                                        reportsAgainstCitizen.length > 0
                                            ? 'text-red-700 bg-red-50 border-red-100'
                                            : 'text-gray-500 bg-gray-100 border-gray-200'
                                    }`}>
                                        {reportsAgainstCitizen.length} {reportsAgainstCitizen.length === 1 ? 'Report' : 'Reports'}
                                    </span>
                                </div>

                                {reportsAgainstCitizen.length === 0 ? (
                                    <div className="text-center py-8 px-4 bg-emerald-50/40 rounded-2xl border border-dashed border-emerald-200">
                                        <CheckCircle size={20} className="text-emerald-600 mx-auto mb-1.5" />
                                        <p className="text-xs text-emerald-800 font-bold">Good Standing: No community reports against this citizen's comments.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {reportsAgainstCitizen.map((rep) => (
                                            <div key={rep._id} className="bg-white p-4 sm:p-5 rounded-2xl border border-red-100 shadow-2xs hover:shadow-xs transition">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-red-50">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-red-700">
                                                            🚩 Reported by: {rep.reportedByName || 'Citizen'}
                                                        </span>
                                                        {getReportStatusBadge(rep.status)}
                                                    </div>
                                                    <span className="text-[11px] text-gray-400 font-medium">
                                                        📅 Reported: {new Date(rep.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                <div className="bg-red-50/50 p-3.5 rounded-xl border border-red-100 mb-3">
                                                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">Reported Comment:</span>
                                                    <p className="text-xs text-gray-800 font-medium italic">
                                                        "{rep.commentText}"
                                                    </p>
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                                    <div className="space-y-1">
                                                        <p className="text-gray-600 font-semibold flex items-center gap-1.5">
                                                            <MapPin size={13} className="text-gray-400" />
                                                            <span>Issue: <span className="font-bold text-gray-900">{rep.issueTitle}</span></span>
                                                        </p>
                                                        <p className="text-red-600 font-bold flex items-center gap-1.5">
                                                            <Flag size={13} />
                                                            <span>Report Reason: {rep.reason}</span>
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-2 sm:pt-0">
                                                        <button
                                                            onClick={() => handleNavigateToIssue(rep.issueId)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-xs font-bold rounded-xl transition border border-gray-200 shadow-2xs"
                                                        >
                                                            <span>View Issue</span>
                                                            <ArrowRight size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleNavigateToReport(rep._id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition border border-indigo-200 shadow-2xs"
                                                        >
                                                            <span>View Report</span>
                                                            <ExternalLink size={12} />
                                                        </button>
                                                    </div>
                                                </div>
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
                                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Account Moderation History</h4>
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

            {/* Moderation (Block/Unblock) Confirmation Modal */}
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
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <div>
                                {moderationAction === 'block' ? (
                                    <>
                                        This citizen will no longer be able to log in, report new issues, upvote, or submit comments. All past civic records remain preserved.
                                    </>
                                ) : (
                                    <>
                                        This citizen will regain full access to CivicPulse, allowing them to log in, report issues, and participate in discussions.
                                    </>
                                )}
                            </div>
                        </div>

                        {moderationAction === 'block' && (
                            <div className="space-y-1.5">
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
                                    Moderation Reason
                                </label>
                                <textarea
                                    rows={3}
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    placeholder="Explain why this account is being blocked (e.g. repeated spam, harassment)..."
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none"
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setModerationModalOpen(false)}
                                disabled={actionLoading}
                                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmModeration}
                                disabled={actionLoading}
                                className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5 ${
                                    moderationAction === 'block' 
                                        ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                }`}
                            >
                                {actionLoading ? 'Processing...' : (moderationAction === 'block' ? 'Confirm Block' : 'Confirm Unblock')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDetailsModal;
