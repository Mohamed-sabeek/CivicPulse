import React, { useState, useEffect } from 'react';
import { X, MapPin, Tag, Calendar, User, ThumbsUp, CheckCircle, Clock, AlertCircle, ShieldAlert, Sparkles, Timer } from 'lucide-react';
import api from '../utils/api';

const IssueTimelineModal = ({ issueId, isOpen, onClose }) => {
    const [timelineData, setTimelineData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !issueId) return;

        const fetchTimeline = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get(`/admin/issues/${issueId}/timeline`);
                setTimelineData(res.data);
            } catch (err) {
                console.error('Failed to load issue timeline:', err);
                setError('Unable to load issue history timeline.');
            } finally {
                setLoading(false);
            }
        };

        fetchTimeline();
    }, [isOpen, issueId]);

    if (!isOpen) return null;

    const issue = timelineData?.issue;
    const historyLogs = timelineData?.historyLogs || [];
    const resolutionTime = timelineData?.resolutionTime;

    const formatDateTime = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleString([], {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    const getStatusBadge = (status) => {
        const normalized = status === 'Open' ? 'Pending' : status;
        if (normalized === 'Resolved') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Resolved
                </span>
            );
        }
        if (normalized === 'In Progress') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    In Progress
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Pending
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <Sparkles size={20} className="text-blue-300" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight">Issue Details & Status Timeline</h2>
                            <p className="text-xs text-blue-200 font-medium">Complete administrative history and audit trail</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1">
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-sm font-bold text-gray-500">Loading audit history...</p>
                        </div>
                    ) : error || !issue ? (
                        <div className="py-16 text-center text-red-500">
                            <ShieldAlert size={48} className="mx-auto mb-3" />
                            <p className="font-bold">{error || 'Issue not found'}</p>
                        </div>
                    ) : (
                        <>
                            {/* Issue Overview Card */}
                            <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100">
                                <div className="flex flex-col sm:flex-row gap-6">
                                    {issue.imageUrl && (
                                        <div className="w-full sm:w-48 h-36 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 shadow-sm">
                                            <img
                                                src={issue.imageUrl}
                                                alt={issue.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 bg-white rounded-lg text-[10px] font-black uppercase tracking-wider text-indigo-600 border border-gray-200">
                                                    {issue.category}
                                                </span>
                                                {getStatusBadge(issue.status)}
                                            </div>
                                            <span className="flex items-center gap-1.5 text-xs font-black text-gray-600 bg-white px-3 py-1 rounded-lg border border-gray-200">
                                                <ThumbsUp size={13} className="text-indigo-600" />
                                                {issue.upvotes?.length || 0} Upvotes
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">{issue.title}</h3>
                                        <p className="text-xs text-gray-600 leading-relaxed font-medium mb-4">{issue.description}</p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500 font-medium">
                                            <div className="flex items-center gap-1.5 truncate">
                                                <MapPin size={14} className="text-red-500 flex-shrink-0" />
                                                <span className="truncate">{issue.location}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 truncate">
                                                <User size={14} className="text-indigo-500 flex-shrink-0" />
                                                <span>Reported by: <strong className="text-gray-800">{issue.createdBy?.name || 'Citizen'}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {resolutionTime && (
                                    <div className="mt-4 pt-4 border-t border-gray-200/60 flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50/60 px-3 py-2 rounded-xl border border-emerald-100">
                                        <Timer size={16} className="text-emerald-600 flex-shrink-0" />
                                        <span>Resolution Time: <strong>{resolutionTime}</strong></span>
                                    </div>
                                )}
                            </div>

                            {/* Status Timeline */}
                            <div>
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Clock size={16} className="text-indigo-600" />
                                    Status Progression Timeline
                                </h4>

                                <div className="relative pl-6 border-l-2 border-indigo-100 space-y-8 ml-3">
                                    {/* 1. Initial Submission Step */}
                                    <div className="relative">
                                        <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center text-amber-700">
                                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                                                <span className="text-xs font-black text-amber-800 uppercase tracking-wider">
                                                    🟡 Pending / Submitted
                                                </span>
                                                <span className="text-[11px] font-semibold text-gray-400">
                                                    {formatDateTime(issue.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 font-medium">
                                                Issue submitted by <strong>{issue.createdBy?.name || 'Citizen'}</strong> ({issue.createdBy?.email || 'Citizen'}).
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. Audit History Logs */}
                                    {historyLogs.map((log, index) => {
                                        const isResolved = log.newStatus === 'Resolved';
                                        const isInProgress = log.newStatus === 'In Progress';

                                        return (
                                            <div key={log._id || index} className="relative">
                                                <div className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center ${
                                                    isResolved
                                                        ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-700'
                                                        : isInProgress
                                                        ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                                                        : 'bg-indigo-100 border-2 border-indigo-500 text-indigo-700'
                                                }`}>
                                                    {isResolved ? (
                                                        <CheckCircle size={14} className="text-emerald-600" />
                                                    ) : (
                                                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                                                        <span className={`text-xs font-black uppercase tracking-wider ${
                                                            isResolved ? 'text-emerald-700' : 'text-blue-700'
                                                        }`}>
                                                            {isResolved ? '🟢 Resolved' : '🔵 In Progress'}
                                                        </span>
                                                        <span className="text-[11px] font-semibold text-gray-400">
                                                            {formatDateTime(log.changedAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-700 font-medium leading-relaxed">
                                                        {log.note || `Status updated from ${log.previousStatus} to ${log.newStatus}.`}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 mt-1">
                                                        Authorized by: <span className="font-semibold text-gray-600">{log.changedByName || 'Admin'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Fallback if no history records exist yet for In Progress / Resolved */}
                                    {historyLogs.length === 0 && issue.status !== 'Open' && issue.status !== 'Pending' && (
                                        <div className="relative">
                                            <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-700">
                                                <CheckCircle size={14} className="text-emerald-600" />
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                                                    <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                                                        {issue.status === 'Resolved' ? '🟢 Resolved' : '🔵 In Progress'}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-gray-400">
                                                        {formatDateTime(issue.resolvedAt || issue.updatedAt)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 font-medium">
                                                    Status updated to <strong>{issue.status}</strong> by System Administrator.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IssueTimelineModal;
