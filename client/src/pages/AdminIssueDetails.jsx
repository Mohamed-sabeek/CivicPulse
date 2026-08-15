import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, MapPin, Calendar, CheckCircle, Clock, 
    AlertCircle, ThumbsUp, MessageSquare, Trash2, User, 
    Shield, Flag, History, Check, ArrowRight, ExternalLink,
    AlertTriangle, Sparkles, Send, MoreVertical, Image as ImageIcon
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

    const handleUpdateReportStatus = async (reportId, newStatus) => {
        try {
            await api.patch(`/admin/comment-reports/${reportId}/status`, { status: newStatus });
            fetchIssueDetails();
        } catch (err) {
            console.error('Failed to update report status:', err);
            alert(err.response?.data?.msg || 'Failed to update report status.');
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
                                    <span className="text-xs text-gray-400 font-bold">Issue ID: {issue._id.slice(-8)}</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-0.5">
                                    {issue.title}
                                </h1>
                            </div>
                        </div>

                        {/* Top Action Controls: Status Progression Dropdown & Delete */}
                        <div className="flex items-center gap-3 self-start sm:self-auto">
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-gray-200 shadow-xs">
                                <span className="text-xs font-bold text-gray-500">Status:</span>
                                <StatusDropdown 
                                    status={issue.status} 
                                    onStatusChange={handleStatusUpdate} 
                                />
                            </div>

                            <button
                                onClick={handleDeleteIssue}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-2xl transition active:scale-95 shadow-xs"
                                title="Delete Issue"
                            >
                                <Trash2 size={15} />
                                <span className="hidden sm:inline">Delete</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* ========================================================================= */}
                        {/* LEFT COLUMN: Issue Evidence + Citizen Profile & Details (7 cols)         */}
                        {/* ========================================================================= */}
                        <div className="lg:col-span-7 space-y-6">
                            
                            {/* Evidence Image Container */}
                            <div className="bg-white rounded-3xl p-3 sm:p-4 border border-gray-100 shadow-sm overflow-hidden group">
                                <div className="w-full h-72 sm:h-84 md:h-96 rounded-2xl bg-slate-950 flex items-center justify-center relative overflow-hidden">
                                    {issue.imageUrl ? (
                                        <>
                                            <img 
                                                src={issue.imageUrl} 
                                                alt="" 
                                                aria-hidden="true" 
                                                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-110 pointer-events-none"
                                            />
                                            <img 
                                                src={issue.imageUrl} 
                                                alt={issue.title} 
                                                className="w-full h-full object-contain relative z-10"
                                            />
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-2 z-10">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-gray-500 border border-slate-800">
                                                <ImageIcon size={28} />
                                            </div>
                                            <p className="text-sm font-bold text-gray-300">No evidence photo attached</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Issue Overview & Details Card */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider rounded-xl border border-indigo-100">
                                            {issue.category}
                                        </span>
                                        {getStatusBadge(issue.status)}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <ThumbsUp size={14} className="text-indigo-600" />
                                            {issue.upvotes?.length || 0} Supports
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageSquare size={14} className="text-indigo-600" />
                                            {issue.comments?.length || 0} Comments
                                        </span>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                                        Issue Description
                                    </h3>
                                    <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-line bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                                        {issue.description}
                                    </p>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                                        <div className="p-2 bg-white text-indigo-600 rounded-xl shadow-2xs">
                                            <MapPin size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Location</p>
                                            <p className="text-xs font-black text-gray-900">{issue.location || 'Coimbatore'}</p>
                                        </div>
                                    </div>
                                    <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                                        <div className="p-2 bg-white text-indigo-600 rounded-xl shadow-2xs">
                                            <Calendar size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Reported Date</p>
                                            <p className="text-xs font-black text-gray-900">{formatDateTime(issue.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Reporter Citizen Card */}
                                <div className="p-4 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 rounded-2xl border border-indigo-100/70 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                                            {issue.createdBy?.name ? issue.createdBy.name.charAt(0).toUpperCase() : 'C'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-black text-gray-900 truncate">
                                                    {issue.createdBy?.name || 'Citizen'}
                                                </p>
                                                <span className={`px-2 py-0.2 rounded text-[9px] font-black uppercase ${
                                                    issue.createdBy?.status === 'blocked'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                    {issue.createdBy?.status || 'Active'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                                                {issue.createdBy?.email || 'Registered Citizen'}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate('/admin/users')}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-bold rounded-xl transition shadow-2xs whitespace-nowrap"
                                    >
                                        <span>Citizens</span>
                                        <ArrowRight size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ========================================================================= */}
                        {/* RIGHT COLUMN: Audit Timeline + Reported Comments + Discussion (5 cols)   */}
                        {/* ========================================================================= */}
                        <div className="lg:col-span-5 space-y-6">
                            
                            {/* Card 1: Issue Status Progression Audit Timeline */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <History size={18} className="text-indigo-600" />
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                                            Status Progression Timeline
                                        </h3>
                                    </div>
                                    {resolutionTime && (
                                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg border border-emerald-200">
                                            ⚡ Fixed in {resolutionTime}
                                        </span>
                                    )}
                                </div>

                                {historyLogs.length === 0 ? (
                                    <div className="p-4 bg-gray-50 rounded-2xl text-center text-xs text-gray-400 font-bold">
                                        No status changes recorded yet.
                                    </div>
                                ) : (
                                    <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                        {historyLogs.map((log, index) => (
                                            <div key={index} className="flex items-start gap-3 relative pl-6">
                                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white absolute left-2 top-1 shadow-2xs" />
                                                <div className="flex-1 bg-gray-50/80 p-3 rounded-xl border border-gray-100 text-xs">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <span className="font-black text-gray-900">
                                                            {log.previousStatus || 'Open'} → <span className="text-indigo-600">{log.newStatus}</span>
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                            {formatDateTime(log.changedAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-600">{log.note || 'Status updated'}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1 font-semibold">By: {log.changedByName || 'Admin'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Card 2: Reported Inappropriate Comments for this Issue (if any) */}
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
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-white text-gray-700 rounded-md border border-gray-200">
                                                        {rep.status}
                                                    </span>
                                                </div>
                                                <p className="text-gray-800 italic bg-white p-2.5 rounded-xl border border-red-100 font-medium text-xs">
                                                    "{rep.commentText}"
                                                </p>
                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[10px] text-gray-400">
                                                        Reported by: {rep.reportedByName || 'Citizen'}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        {rep.status !== 'dismissed' && (
                                                            <button
                                                                onClick={() => handleUpdateReportStatus(rep._id, 'dismissed')}
                                                                className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 font-bold text-[10px] rounded-lg border border-gray-200 transition"
                                                            >
                                                                Dismiss
                                                            </button>
                                                        )}
                                                        {rep.status !== 'resolved' && (
                                                            <button
                                                                onClick={() => handleUpdateReportStatus(rep._id, 'resolved')}
                                                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition shadow-2xs"
                                                            >
                                                                Resolve
                                                            </button>
                                                        )}
                                                    </div>
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
                                        issue.comments.map((comment) => {
                                            const authorName = comment.user?.name || (typeof comment.user === 'string' ? 'Citizen' : 'Citizen');
                                            const authorInitial = authorName ? authorName.charAt(0).toUpperCase() : 'C';
                                            const isAuthorAdmin = comment.user?.role === 'admin';

                                            return (
                                                <div key={comment._id} className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs space-y-1.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-[10px] text-white ${
                                                                isAuthorAdmin ? 'bg-purple-600' : 'bg-indigo-600'
                                                            }`}>
                                                                {authorInitial}
                                                            </div>
                                                            <span className="font-bold text-gray-900">{authorName}</span>
                                                            {isAuthorAdmin && (
                                                                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[9px] font-black rounded">
                                                                    Admin
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-gray-400">
                                                            {formatDateTime(comment.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 font-medium pl-8">{comment.text}</p>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="py-6 text-center text-xs text-gray-400 font-bold">
                                            No comments posted on this issue.
                                        </div>
                                    )}
                                </div>

                                {/* Admin Comment Input */}
                                <div className="pt-2 border-t border-gray-100">
                                    <div className="relative">
                                        <textarea
                                            rows="2"
                                            placeholder="Post an official admin response or update..."
                                            value={newAdminComment}
                                            onChange={(e) => setNewAdminComment(e.target.value)}
                                            className="w-full p-3 pr-11 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handlePostAdminComment();
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={handlePostAdminComment}
                                            disabled={!newAdminComment.trim()}
                                            className="absolute right-2.5 bottom-2.5 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition disabled:opacity-40 shadow-xs"
                                            title="Send Admin Comment"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AdminIssueDetails;
