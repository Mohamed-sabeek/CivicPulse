import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, MapPin, Calendar, CheckCircle, Clock, 
    AlertCircle, ThumbsUp, MessageSquare, Trash2, User, 
    Shield, Flag, History, Check, ArrowRight,
    Sparkles, Send, X, Image as ImageIcon
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AdminSkeleton from '../components/AdminSkeleton';
import StatusDropdown from '../components/StatusDropdown';
import api from '../utils/api';

const AdminIssueDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [issueData, setIssueData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newAdminComment, setNewAdminComment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Comment Report Moderation Modal state
    const [reportActionModal, setReportActionModal] = useState({
        isOpen: false,
        reportId: null,
        targetStatus: null, // 'dismissed' | 'resolved'
        reportText: '',
        loading: false
    });

    const fetchIssueDetails = useCallback(async () => {
        try {
            const res = await api.get(`/admin/issues/${id}`);
            setIssueData(res.data);
        } catch (err) {
            console.error('Error fetching admin issue details:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/login');
                return;
            }
            setError(err.response?.data?.msg || 'Unable to load issue details.');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchIssueDetails();
    }, [fetchIssueDetails]);

    const handleStatusUpdate = async (newStatus) => {
        try {
            await api.put(`/admin/issues/${id}/status`, { status: newStatus });
            fetchIssueDetails();
        } catch (err) {
            console.error('Error updating status:', err);
            alert(err.response?.data?.msg || 'Failed to update issue status.');
        }
    };

    const handleDeleteIssue = async () => {
        if (!window.confirm('Are you sure you want to delete this issue permanently? This will also remove all community comments and audit records.')) {
            return;
        }
        setActionLoading(true);
        try {
            await api.delete(`/admin/issues/${id}`);
            navigate('/admin');
        } catch (err) {
            console.error('Error deleting issue:', err);
            alert(err.response?.data?.msg || 'Failed to delete issue.');
            setActionLoading(false);
        }
    };

    const handlePostAdminComment = async () => {
        if (!newAdminComment.trim()) return;
        try {
            await api.post(`/issues/${id}/comment`, { text: newAdminComment });
            setNewAdminComment('');
            fetchIssueDetails();
        } catch (err) {
            console.error('Failed to post comment:', err);
            alert(err.response?.data?.msg || 'Failed to post comment.');
        }
    };

    const handleConfirmReportAction = async () => {
        if (!reportActionModal.reportId || !reportActionModal.targetStatus) return;
        setReportActionModal(prev => ({ ...prev, loading: true }));
        try {
            await api.patch(`/admin/comment-reports/${reportActionModal.reportId}/status`, {
                status: reportActionModal.targetStatus
            });
            setReportActionModal({
                isOpen: false,
                reportId: null,
                targetStatus: null,
                reportText: '',
                loading: false
            });
            fetchIssueDetails();
        } catch (err) {
            console.error('Failed to moderate comment report:', err);
            alert(err.response?.data?.msg || 'Failed to update report status.');
            setReportActionModal(prev => ({ ...prev, loading: false }));
        }
    };

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
                    <CheckCircle size={14} className="text-emerald-500" />
                    Resolved
                </span>
            );
        }
        if (normalized === 'In Progress') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    <Clock size={14} className="text-blue-500 animate-pulse" />
                    In Progress
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle size={14} className="text-amber-500" />
                Pending
            </span>
        );
    };

    const getReportStatusBadge = (status) => {
        switch (status) {
            case 'resolved':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Check size={10} /> 🟢 RESOLVED
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col pt-24">
                <Navbar />
                <AdminSkeleton />
                <Footer />
            </div>
        );
    }

    if (error || !issueData?.issue) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col pt-24">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Issue Not Found</h2>
                    <p className="text-gray-500 text-sm max-w-sm mb-6">{error || 'The requested issue could not be found or has been deleted.'}</p>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                    >
                        Back to Admin Dashboard
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    const issue = issueData.issue;
    const historyLogs = issueData.historyLogs || [];
    const commentReports = issueData.commentReports || [];
    const resolutionTime = issueData.resolutionTime;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-24 font-sans">
            <Navbar />

            <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Header Navigation & Top Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2.5 bg-white rounded-2xl shadow-xs border border-gray-200 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition active:scale-95"
                                title="Go Back"
                                aria-label="Go Back"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                                        Admin Management
                                    </span>
                                    <span className="text-xs text-gray-400 font-semibold">•</span>
                                    <span className="text-xs text-gray-500 font-bold">Issue ID: {issue._id.slice(-6)}</span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-snug mt-1">
                                    {issue.title}
                                </h1>
                            </div>
                        </div>

                        {/* Top Action Buttons: Status Changer + Delete */}
                        <div className="flex items-center gap-3">
                            <StatusDropdown 
                                currentStatus={issue.status}
                                onStatusChange={handleStatusUpdate}
                            />

                            <button
                                onClick={handleDeleteIssue}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-xl transition shadow-xs active:scale-95"
                                title="Delete this issue permanently"
                            >
                                <Trash2 size={15} />
                                <span>Delete Issue</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Layout Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* LEFT COLUMN: Media Evidence + Primary Details + Progression Timeline */}
                        <div className="lg:col-span-7 space-y-6">
                            
                            {/* Evidence Image Card */}
                            <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm overflow-hidden">
                                <div className="w-full h-64 sm:h-80 rounded-2xl bg-slate-950 flex items-center justify-center relative overflow-hidden">
                                    {issue.imageUrl ? (
                                        <>
                                            <img 
                                                src={issue.imageUrl} 
                                                alt="" 
                                                aria-hidden="true" 
                                                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-110 pointer-events-none"
                                            />
                                            <img 
                                                src={issue.imageUrl} 
                                                alt={issue.title} 
                                                className="w-full h-full object-contain relative z-10"
                                            />
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-2">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-gray-500 border border-slate-800">
                                                <ImageIcon size={24} />
                                            </div>
                                            <p className="text-xs font-bold text-gray-300">No evidence photo attached</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Core Issue Details Card */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider rounded-xl border border-indigo-100">
                                        {issue.category || 'General'}
                                    </span>
                                    {getStatusBadge(issue.status)}
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2">
                                        Issue Description
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100 whitespace-pre-line">
                                        {issue.description || 'No detailed description provided.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                                    <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Location</span>
                                        <p className="text-xs font-bold text-gray-800 flex items-center gap-1 mt-0.5">
                                            <MapPin size={12} className="text-indigo-600" />
                                            {issue.location || 'Coimbatore'}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Reported Date</span>
                                        <p className="text-xs font-bold text-gray-800 flex items-center gap-1 mt-0.5">
                                            <Calendar size={12} className="text-gray-500" />
                                            {new Date(issue.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100 col-span-2 sm:col-span-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Community Upvotes</span>
                                        <p className="text-xs font-bold text-gray-800 flex items-center gap-1 mt-0.5">
                                            <ThumbsUp size={12} className="text-indigo-600" />
                                            {issue.upvotes?.length || 0} Citizens
                                        </p>
                                    </div>
                                </div>

                                {resolutionTime && (
                                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                                        <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                                            <CheckCircle size={14} className="text-emerald-600" />
                                            Resolution Duration:
                                        </span>
                                        <span className="font-black text-emerald-800 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                            {resolutionTime}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Progression Timeline / Audit History */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-gray-900">
                                    <History size={18} className="text-indigo-600" />
                                    <h3 className="text-sm font-black uppercase tracking-wider">
                                        Audit History & Progression Log
                                    </h3>
                                </div>

                                {historyLogs.length === 0 ? (
                                    <div className="py-6 text-center text-gray-400 text-xs font-bold">
                                        No status changes recorded yet. Issue is in initial state.
                                    </div>
                                ) : (
                                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                                        {historyLogs.map((log, index) => (
                                            <div key={index} className="relative">
                                                <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                                                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs space-y-1">
                                                    <div className="flex items-center justify-between flex-wrap gap-1">
                                                        <span className="font-black text-gray-900">
                                                            {log.previousStatus} → <span className="text-indigo-600">{log.newStatus}</span>
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-semibold">
                                                            {formatDateTime(log.changedAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 font-medium">
                                                        {log.note || 'Status updated by administrator'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">
                                                        By: <span className="font-bold text-gray-700">{log.changedByName || 'Admin'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Reporter Identity + Comment Reports + Discussion */}
                        <div className="lg:col-span-5 space-y-6">
                            
                            {/* Card 1: Citizen Reporter Details */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <User size={18} className="text-indigo-600" />
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                                            Citizen Reporter
                                        </h3>
                                    </div>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-black rounded uppercase">
                                        Original Author
                                    </span>
                                </div>

                                {issue.createdBy ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-base shadow-inner shrink-0">
                                                {issue.createdBy.name ? issue.createdBy.name.charAt(0).toUpperCase() : 'C'}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-black text-gray-900 truncate">
                                                    {issue.createdBy.name || 'Citizen'}
                                                </h4>
                                                <p className="text-xs text-gray-500 truncate font-medium">
                                                    {issue.createdBy.email || 'No email provided'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                                            <span className="text-gray-400 font-bold">Account Standing:</span>
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                🟢 Active
                                            </span>
                                        </div>

                                        <Link 
                                            to="/admin/users"
                                            className="block w-full py-2 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-xs font-bold text-center rounded-xl border border-gray-200 transition"
                                        >
                                            Manage in Citizen Accounts →
                                        </Link>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No creator profile linked to this report.</p>
                                )}
                            </div>

                            {/* Card 2: Comment Reports Filed On This Issue */}
                            {commentReports.length > 0 && (
                                <div className="bg-white rounded-3xl p-6 border border-red-100 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-red-50">
                                        <div className="flex items-center gap-2 text-red-600">
                                            <Flag size={18} />
                                            <h3 className="text-sm font-black uppercase tracking-wider">
                                                Comment Reports ({commentReports.length})
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {commentReports.map((rep) => (
                                            <div key={rep._id} className="p-3.5 bg-red-50/50 rounded-2xl border border-red-100 text-xs space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-bold text-red-700">
                                                        Reason: {rep.reason}
                                                    </span>
                                                    {getReportStatusBadge(rep.status)}
                                                </div>
                                                <p className="text-gray-800 italic bg-white p-2.5 rounded-xl border border-red-100 font-medium text-xs">
                                                    "{rep.commentText}"
                                                </p>
                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[10px] text-gray-400">
                                                        Reported by: {rep.reportedByName || 'Citizen'}
                                                    </span>
                                                    {rep.status === 'pending' && (
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => setReportActionModal({
                                                                    isOpen: true,
                                                                    reportId: rep._id,
                                                                    targetStatus: 'dismissed',
                                                                    reportText: rep.commentText,
                                                                    loading: false
                                                                })}
                                                                className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 font-bold text-[10px] rounded-lg border border-gray-200 transition"
                                                            >
                                                                Dismiss
                                                            </button>
                                                            <button
                                                                onClick={() => setReportActionModal({
                                                                    isOpen: true,
                                                                    reportId: rep._id,
                                                                    targetStatus: 'resolved',
                                                                    reportText: rep.commentText,
                                                                    loading: false
                                                                })}
                                                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition shadow-2xs"
                                                            >
                                                                Resolve
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Card 3: Discussion & Citizen Conversation */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={18} className="text-indigo-600" />
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                                            Community Discussion
                                        </h3>
                                    </div>
                                    <span className="px-2.5 py-0.5 bg-gray-50 text-gray-600 text-xs font-black rounded-lg border border-gray-100">
                                        {issue.comments?.length || 0} Total
                                    </span>
                                </div>

                                {/* Comments Feed */}
                                <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                                    {issue.comments && issue.comments.length > 0 ? (
                                        issue.comments.map((comment) => (
                                            <div 
                                                key={comment._id}
                                                className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs space-y-1.5"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-gray-900">
                                                        {comment.user?.name || 'Citizen'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(comment.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-gray-700 font-medium whitespace-pre-line leading-relaxed">
                                                    {comment.text}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-6 text-center text-gray-400 text-xs">
                                            No community comments on this issue yet.
                                        </div>
                                    )}
                                </div>

                                {/* Admin Comment Input Box */}
                                <div className="pt-3 border-t border-gray-100 space-y-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 flex items-center gap-1">
                                        <Sparkles size={12} className="text-indigo-600" /> Post Official Admin Update
                                    </span>
                                    <div className="relative">
                                        <textarea
                                            rows="2"
                                            value={newAdminComment}
                                            onChange={(e) => setNewAdminComment(e.target.value)}
                                            placeholder="Write an official administrative update for the citizens..."
                                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 pr-10 text-xs font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition resize-none"
                                        />
                                        <button
                                            onClick={handlePostAdminComment}
                                            disabled={!newAdminComment.trim()}
                                            className="absolute right-2.5 bottom-2.5 p-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-40 shadow-xs active:scale-95"
                                            title="Post official comment"
                                        >
                                            <Send size={13} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />

            {/* Comment Report Moderation (Dismiss / Resolve) Confirmation Modal */}
            {reportActionModal.isOpen && (
                <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                reportActionModal.targetStatus === 'resolved' 
                                    ? 'bg-emerald-50 text-emerald-600' 
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                                {reportActionModal.targetStatus === 'resolved' ? <Check size={24} /> : <X size={24} />}
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-gray-900">
                                    {reportActionModal.targetStatus === 'resolved' ? 'Resolve this report?' : 'Dismiss this report?'}
                                </h4>
                                <p className="text-xs text-gray-500 font-bold">This decision will be final.</p>
                            </div>
                        </div>

                        {reportActionModal.reportText && (
                            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/70 text-xs">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Reported Comment:</span>
                                <p className="italic text-gray-700">"{reportActionModal.reportText}"</p>
                            </div>
                        )}

                        <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                            reportActionModal.targetStatus === 'resolved'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}>
                            {reportActionModal.targetStatus === 'resolved' ? (
                                <p>
                                    Marking this report as <strong>RESOLVED</strong> will notify the citizen who submitted the report. The decision is permanent and cannot be reversed.
                                </p>
                            ) : (
                                <p>
                                    Marking this report as <strong>DISMISSED</strong> will archive the report with no notification sent to the reporter. The decision is permanent.
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setReportActionModal({ isOpen: false, reportId: null, targetStatus: null, reportText: '', loading: false })}
                                disabled={reportActionModal.loading}
                                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReportAction}
                                disabled={reportActionModal.loading}
                                className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5 ${
                                    reportActionModal.targetStatus === 'resolved'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                        : 'bg-gray-800 hover:bg-gray-900 shadow-gray-200'
                                }`}
                            >
                                {reportActionModal.loading ? 'Saving...' : (reportActionModal.targetStatus === 'resolved' ? 'Confirm Resolve' : 'Confirm Dismiss')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminIssueDetails;
