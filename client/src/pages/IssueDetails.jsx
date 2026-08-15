import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    MapPin, ArrowUp, MessageSquare, Calendar, ChevronLeft, CheckCircle, 
    Clock, Send, ThumbsUp, Share2, Lock, Check, Flag, MoreVertical, 
    AlertTriangle, X, AlertCircle 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DetailSkeleton from '../components/DetailSkeleton';
import api from '../utils/api';

const IssueDetails = () => {
    const { id } = useParams();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [copiedToast, setCopiedToast] = useState(false);
    const [activeDropdownCommentId, setActiveDropdownCommentId] = useState(null);

    // Comment Report Modal State
    const [reportModal, setReportModal] = useState({
        isOpen: false,
        comment: null,
        reason: 'Harassment or abusive content',
        details: '',
        loading: false,
        feedback: null // { type: 'success' | 'error', message: '' }
    });

    const navigate = useNavigate();

    useEffect(() => {
        const fetchIssue = async () => {
            try {
                const res = await api.get(`/issues/${id}`);
                setIssue(res.data);
            } catch (err) {
                console.error('Error fetching issue:', err);
                setError('Issue not found or server error.');
            } finally {
                setLoading(false);
            }
        };

        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await api.get('/auth/user');
                setUser(res.data);
            } catch {
                setUser(null);
            }
        };

        fetchIssue();
        fetchUser();
    }, [id]);

    const isResolved = issue?.status === 'Resolved';

    const handleComment = async () => {
        if (isResolved) return;
        if (!newComment.trim()) return;
        try {
            const res = await api.post(`/issues/${id}/comment`, { text: newComment });
            setIssue(prev => ({ ...prev, comments: res.data }));
            setNewComment('');
        } catch (err) {
            console.error('Failed to post comment:', err);
        }
    };

    const handleVote = async () => {
        if (isResolved) return;
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            const res = await api.put(`/issues/${id}/vote`);
            setIssue(prev => ({ ...prev, upvotes: res.data }));
        } catch (err) {
            console.error('Failed to upvote issue:', err);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `CivicPulse – ${issue.title}`,
            text: issue.description ? (issue.description.slice(0, 120) + '...') : 'A civic issue reported through CivicPulse.',
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error sharing via Web Share API:', err);
                    copyToClipboard();
                }
            }
        } else {
            copyToClipboard();
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                setCopiedToast(true);
                setTimeout(() => setCopiedToast(false), 3000);
            })
            .catch(err => {
                console.error('Failed to copy link:', err);
            });
    };

    const openReportModal = (comment) => {
        setActiveDropdownCommentId(null);
        if (!user) {
            navigate('/login');
            return;
        }
        setReportModal({
            isOpen: true,
            comment,
            reason: 'Harassment or abusive content',
            details: '',
            loading: false,
            feedback: null
        });
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        if (!reportModal.comment) return;
        setReportModal(prev => ({ ...prev, loading: true, feedback: null }));

        try {
            const res = await api.post(`/issues/${id}/comments/${reportModal.comment._id}/report`, {
                reason: reportModal.reason,
                details: reportModal.details
            });
            setReportModal(prev => ({
                ...prev,
                loading: false,
                feedback: {
                    type: 'success',
                    message: res.data.msg || 'Comment report submitted successfully. An administrator will review it.'
                }
            }));
            setTimeout(() => {
                setReportModal({
                    isOpen: false,
                    comment: null,
                    reason: 'Harassment or abusive content',
                    details: '',
                    loading: false,
                    feedback: null
                });
            }, 2500);
        } catch (err) {
            setReportModal(prev => ({
                ...prev,
                loading: false,
                feedback: {
                    type: 'error',
                    message: err.response?.data?.msg || 'Failed to submit report. Please try again.'
                }
            }));
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Resolved': return <CheckCircle className="mr-1.5" size={16} />;
            case 'In Progress': return <Clock className="mr-1.5" size={16} />;
            default: return <Clock className="mr-1.5" size={16} />;
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    const formatCommentDate = (dateString) => {
        if (!dateString) return 'Just now';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col pt-24">
                <Navbar />
                <DetailSkeleton />
                <Footer />
            </div>
        );
    }

    if (error || !issue) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col pt-24">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center p-4">
                    <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                        <ArrowUp size={48} className="rotate-45" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Issue Lost?</h2>
                    <p className="text-gray-500 mb-8 font-medium max-w-xs text-center">{error || 'We couldn\'t find the issue you\'re looking for.'}</p>
                    <Link to="/issues" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">
                        Back to Community Feed
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-24 font-sans">
            <Navbar />

            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <Link to="/issues" className="group inline-flex items-center text-gray-400 hover:text-indigo-600 mb-8 font-bold transition-all">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 mr-3 group-hover:bg-indigo-50 transition-colors">
                            <ChevronLeft size={20} />
                        </div>
                        Back to Issues
                    </Link>

                    <article className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden mb-12">
                        {issue.imageUrl && (
                            <div className="h-[28rem] w-full relative group">
                                <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />
                                <div className="absolute bottom-10 left-10 right-10">
                                    <div className="flex flex-wrap gap-3 mb-6">
                                        <span className="px-4 py-2 bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest rounded-xl border border-white/20">
                                            {issue.category}
                                        </span>
                                        <span className={`flex items-center px-4 py-2 backdrop-blur-md text-xs font-black uppercase tracking-widest rounded-xl border ${getStatusStyles(issue.status)} bg-white/90`}>
                                            {getStatusIcon(issue.status)} {issue.status}
                                        </span>
                                    </div>
                                    <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight leading-tight">{issue.title}</h1>
                                    <div className="flex flex-wrap items-center gap-6 text-white/80 text-sm font-bold">
                                        <span className="flex items-center gap-2"><MapPin size={20} className="text-indigo-400" /> {issue.location}</span>
                                        <span className="flex items-center gap-2"><Calendar size={20} className="text-indigo-400" /> Reported {new Date(issue.createdAt).toLocaleDateString()}</span>
                                        {issue.status === 'Resolved' && (
                                            <span className="flex items-center gap-2 text-emerald-300"><CheckCircle size={20} className="text-emerald-400" /> Resolved {new Date(issue.resolvedAt || issue.updatedAt || issue.createdAt).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-10 sm:p-12">
                            {!issue.imageUrl && (
                                <div className="mb-10 border-b border-gray-50 pb-10">
                                    <div className="flex flex-wrap gap-3 mb-6">
                                        <span className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest rounded-xl border border-indigo-100">
                                            {issue.category}
                                        </span>
                                        <span className={`flex items-center px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl border ${getStatusStyles(issue.status)}`}>
                                            {getStatusIcon(issue.status)} {issue.status}
                                        </span>
                                    </div>
                                    <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">{issue.title}</h1>
                                    <div className="flex flex-wrap items-center gap-6 text-gray-400 text-sm font-bold">
                                        <span className="flex items-center gap-2"><MapPin size={20} className="text-indigo-500" /> {issue.location}</span>
                                        <span className="flex items-center gap-2"><Calendar size={20} className="text-indigo-500" /> Reported {new Date(issue.createdAt).toLocaleDateString()}</span>
                                        {issue.status === 'Resolved' && (
                                            <span className="flex items-center gap-2 text-emerald-600"><CheckCircle size={20} className="text-emerald-500" /> Resolved {new Date(issue.resolvedAt || issue.updatedAt || issue.createdAt).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="mb-12">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Description</h3>
                                <p className="text-xl text-gray-600 leading-relaxed font-medium whitespace-pre-line">{issue.description}</p>
                            </div>

                            <div className="flex items-center justify-between pt-10 border-t border-gray-50">
                                <div className="flex items-center gap-10">
                                    <button
                                        onClick={handleVote}
                                        disabled={isResolved}
                                        className={`flex items-center gap-3 transition-all ${
                                            isResolved 
                                                ? 'cursor-not-allowed opacity-80' 
                                                : user && issue.upvotes?.includes(user._id) 
                                                ? 'text-indigo-600' 
                                                : 'text-gray-400 hover:text-indigo-500'
                                        }`}
                                        title={isResolved ? "This issue has been resolved and community interactions are closed" : "Upvote this issue"}
                                    >
                                        <div className={`p-4 rounded-2xl ${user && issue.upvotes?.includes(user._id) ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400'} transition-colors relative`}>
                                            <ThumbsUp size={24} className={user && issue.upvotes?.includes(user._id) ? 'fill-current' : ''} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-2xl font-black">{issue.upvotes?.length || 0}</p>
                                                {isResolved && <Lock size={14} className="text-gray-400" />}
                                            </div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Upvotes</p>
                                        </div>
                                    </button>
                                    <div className="flex items-center gap-3 text-gray-400">
                                        <div className="p-4 rounded-2xl bg-gray-50">
                                            <MessageSquare size={24} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-gray-900">{issue.comments?.length || 0}</p>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Comments</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button 
                                        onClick={handleShare}
                                        className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90 relative"
                                        title="Share this issue"
                                        aria-label="Share this issue"
                                    >
                                        <Share2 size={24} />
                                    </button>

                                    {/* Issue Link Copied Toast */}
                                    {copiedToast && (
                                        <div className="absolute right-0 -top-12 z-30 px-3.5 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-xl flex items-center gap-1.5 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                                            <Check size={14} className="text-emerald-400" />
                                            <span>Issue link copied!</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* Comments & Discussion Section */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 sm:p-12">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <MessageSquare size={22} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Citizen Discussion</h3>
                                    <p className="text-xs text-gray-400 font-medium">Community feedback and conversations</p>
                                </div>
                            </div>
                            <span className="px-3.5 py-1.5 bg-gray-50 text-gray-600 text-xs font-black rounded-xl border border-gray-100">
                                {issue.comments?.length || 0} Comments
                            </span>
                        </div>

                        {/* Comment Feed */}
                        <div className="space-y-4 mb-10">
                            {issue.comments && issue.comments.length > 0 ? (
                                issue.comments.map((comment) => {
                                    const authorName = comment.user?.name || (typeof comment.user === 'string' ? 'Citizen' : 'Citizen');
                                    const authorInitial = authorName ? authorName.charAt(0).toUpperCase() : 'C';
                                    const isAuthorAdmin = comment.user?.role === 'admin';

                                    return (
                                        <div 
                                            key={comment._id} 
                                            className="bg-gray-50/60 hover:bg-gray-50 p-5 sm:p-6 rounded-3xl border border-gray-100 transition-all group relative"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                {/* Author Avatar & Info */}
                                                <div className="flex items-start gap-3.5 min-w-0">
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-sm shrink-0 ${
                                                        isAuthorAdmin
                                                            ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-100'
                                                            : 'bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-indigo-100'
                                                    }`}>
                                                        {authorInitial}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-black text-gray-900 text-sm">
                                                                {authorName}
                                                            </span>
                                                            {isAuthorAdmin && (
                                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-black rounded-md">
                                                                    Admin
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 mt-0.5">
                                                            <Calendar size={12} className="text-gray-400" />
                                                            <span>{formatCommentDate(comment.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Menu / Report Action */}
                                                <div className="relative shrink-0">
                                                    <button
                                                        onClick={() => setActiveDropdownCommentId(activeDropdownCommentId === comment._id ? null : comment._id)}
                                                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
                                                        aria-label="Comment options"
                                                        title="More options"
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>

                                                    {activeDropdownCommentId === comment._id && (
                                                        <div className="absolute right-0 top-10 z-20 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                                                            <button
                                                                onClick={() => openReportModal(comment)}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition text-left"
                                                            >
                                                                <Flag size={14} className="text-red-500" />
                                                                <span>Report Comment</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Comment Text Body */}
                                            <div className="mt-3.5 pl-0 sm:pl-13">
                                                <p className="text-gray-700 text-sm font-medium leading-relaxed whitespace-pre-line">
                                                    {comment.text}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 bg-gray-50/40 rounded-3xl border-2 border-dashed border-gray-100">
                                    <MessageSquare size={42} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">No conversation started yet</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Be the first citizen to leave a comment!</p>
                                </div>
                            )}
                        </div>

                        {/* Comment Input / Locked Banner */}
                        {isResolved ? (
                            <div className="bg-emerald-50/60 border border-emerald-100 rounded-3xl p-6 text-center flex flex-col items-center justify-center gap-2">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                    <Lock size={18} />
                                </div>
                                <h4 className="text-sm font-black text-gray-900">
                                    This issue has been resolved. Community interactions are now closed.
                                </h4>
                                <p className="text-xs text-gray-500 font-medium">
                                    All past comments and community upvotes are preserved as a permanent public record.
                                </p>
                            </div>
                        ) : user ? (
                            <div className="relative group">
                                <textarea
                                    rows="2"
                                    placeholder="Add your thoughts or updates to this civic discussion..."
                                    className="w-full bg-gray-50 border border-gray-200/80 rounded-3xl px-6 py-4 pr-16 text-xs sm:text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all shadow-xs resize-none"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleComment();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleComment}
                                    className="absolute right-3.5 bottom-3.5 bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-90 disabled:opacity-40 disabled:scale-100"
                                    disabled={!newComment.trim()}
                                    title="Post Comment"
                                    aria-label="Post Comment"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 p-8 rounded-3xl text-center border border-indigo-100 shadow-2xs">
                                <h4 className="text-indigo-900 font-black text-base mb-1">Join the Civic Discussion</h4>
                                <p className="text-indigo-600/80 text-xs font-medium mb-5">Sign in to share your thoughts, updates, and community suggestions.</p>
                                <Link to="/login" className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 active:scale-95">
                                    Login to Comment
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />

            {/* Report Comment Modal */}
            {reportModal.isOpen && (
                <div 
                    className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => setReportModal(prev => ({ ...prev, isOpen: false }))}
                >
                    <div 
                        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                                    <Flag size={20} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-gray-900">Report this comment?</h4>
                                    <p className="text-xs text-gray-500 font-medium">Help keep the CivicPulse community constructive and safe</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setReportModal(prev => ({ ...prev, isOpen: false }))}
                                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Quoted Comment Preview */}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/70">
                            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                                {reportModal.comment?.user?.name || 'Citizen'}:
                            </span>
                            <p className="text-xs text-gray-700 font-medium italic line-clamp-3">
                                "{reportModal.comment?.text}"
                            </p>
                        </div>

                        {/* Feedback Alert */}
                        {reportModal.feedback && (
                            <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                                reportModal.feedback.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                                {reportModal.feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                <span>{reportModal.feedback.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmitReport} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                                    Reason for Report <span className="text-red-500">*</span>
                                </label>
                                <div className="space-y-2">
                                    {[
                                        'Harassment or abusive content',
                                        'Spam',
                                        'Inappropriate content',
                                        'Misleading information',
                                        'Other'
                                    ].map(reasonOption => (
                                        <label 
                                            key={reasonOption}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${
                                                reportModal.reason === reasonOption 
                                                    ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900 shadow-2xs' 
                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="reportReason"
                                                value={reasonOption}
                                                checked={reportModal.reason === reasonOption}
                                                onChange={(e) => setReportModal(prev => ({ ...prev, reason: e.target.value }))}
                                                className="text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span>{reasonOption}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                                    Additional details (optional):
                                </label>
                                <textarea
                                    rows={2}
                                    value={reportModal.details}
                                    onChange={(e) => setReportModal(prev => ({ ...prev, details: e.target.value }))}
                                    placeholder="Explain why this comment should be reviewed by moderators..."
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setReportModal(prev => ({ ...prev, isOpen: false }))}
                                    disabled={reportModal.loading}
                                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={reportModal.loading}
                                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-red-200 flex items-center gap-1.5"
                                >
                                    {reportModal.loading ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IssueDetails;
