import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    MapPin, ArrowUp, MessageSquare, Calendar, ChevronLeft, CheckCircle, 
    Clock, Send, ThumbsUp, Share2, Lock, Check, Flag, MoreVertical, 
    X, AlertCircle, Image as ImageIcon
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
            case 'Resolved': return <CheckCircle className="mr-1.5" size={14} />;
            case 'In Progress': return <Clock className="mr-1.5" size={14} />;
            default: return <AlertCircle className="mr-1.5" size={14} />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Resolved': 
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {getStatusIcon(status)} 🟢 Resolved
                    </span>
                );
            case 'In Progress': 
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                        {getStatusIcon(status)} 🔵 In Progress
                    </span>
                );
            default: 
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        {getStatusIcon(status)} 🟡 Pending
                    </span>
                );
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
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex flex-col pt-24 font-sans">
            <Navbar />

            {/* Main Content Area (Allows normal document scrolling so footer is reachable) */}
            <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    
                    {/* Header: Back navigation link */}
                    <div className="mb-6">
                        <Link 
                            to="/issues" 
                            className="inline-flex items-center text-gray-500 hover:text-indigo-600 text-xs font-black uppercase tracking-wider transition-all group"
                        >
                            <div className="p-2 bg-white rounded-xl shadow-xs border border-gray-200 mr-2.5 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                                <ChevronLeft size={16} />
                            </div>
                            Back to Issues
                        </Link>
                    </div>

                    {/* Strict 2-Column Desktop Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
                        
                        {/* ========================================================================= */}
                        {/* LEFT COLUMN: [1] Issue Evidence Image + [2] Issue Information Card       */}
                        {/* ========================================================================= */}
                        <div className="lg:col-span-6 xl:col-span-7 space-y-6">
                            
                            {/* 1. Issue Evidence Image */}
                            <div className="bg-white rounded-3xl p-3 sm:p-4 border border-gray-100 shadow-sm overflow-hidden group">
                                <div className="w-full h-72 sm:h-84 md:h-96 rounded-2xl bg-slate-950 flex items-center justify-center relative overflow-hidden">
                                    {issue.imageUrl ? (
                                        <>
                                            {/* Atmospheric background glow */}
                                            <img 
                                                src={issue.imageUrl} 
                                                alt="" 
                                                aria-hidden="true" 
                                                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-110 pointer-events-none"
                                            />
                                            {/* Fully contained evidence image with zero distortion */}
                                            <img 
                                                src={issue.imageUrl} 
                                                alt={issue.title} 
                                                className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-[1.01]"
                                            />
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-3 z-10">
                                            <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-gray-500 border border-slate-800">
                                                <ImageIcon size={32} />
                                            </div>
                                            <p className="text-sm font-bold text-gray-300">No evidence image available</p>
                                            <p className="text-xs text-gray-500 max-w-xs">This community report has no attached photograph.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 2. Issue Information Card */}
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
                                
                                {/* Category & Status Row */}
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider rounded-xl border border-indigo-100">
                                        {issue.category}
                                    </span>
                                    {getStatusBadge(issue.status)}
                                </div>

                                {/* Issue Title */}
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                                        {issue.title}
                                    </h1>
                                </div>

                                {/* Metadata: Location & Dates */}
                                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500 pb-5 border-b border-gray-100">
                                    <span className="flex items-center gap-1.5 text-gray-800">
                                        <MapPin size={15} className="text-indigo-600" />
                                        {issue.location || 'Coimbatore'}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-gray-400">
                                        <Calendar size={15} />
                                        Reported: {new Date(issue.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    {issue.status === 'Resolved' && (
                                        <span className="flex items-center gap-1.5 text-emerald-600">
                                            <CheckCircle size={15} />
                                            Resolved: {new Date(issue.resolvedAt || issue.updatedAt || issue.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    )}
                                </div>

                                {/* Description Section */}
                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                        Description
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-700 font-medium leading-relaxed whitespace-pre-line">
                                        {issue.description}
                                    </p>
                                </div>

                                {/* Community Actions Row */}
                                <div className="pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        {/* Upvote Button */}
                                        <button
                                            onClick={handleVote}
                                            disabled={isResolved}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all active:scale-95 ${
                                                isResolved
                                                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-80'
                                                    : user && issue.upvotes?.includes(user._id)
                                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-black shadow-xs'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600'
                                            }`}
                                            title={isResolved ? "This issue has been resolved and community interactions are closed" : "Support this issue"}
                                        >
                                            <ThumbsUp size={16} className={user && issue.upvotes?.includes(user._id) ? 'fill-current text-indigo-600' : ''} />
                                            <span className="text-xs font-black">{issue.upvotes?.length || 0} Upvotes</span>
                                            {isResolved && <Lock size={12} className="text-gray-400" />}
                                        </button>

                                        {/* Comment Count Indicator */}
                                        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-100 text-gray-600 text-xs font-black">
                                            <MessageSquare size={16} className="text-indigo-600" />
                                            <span>{issue.comments?.length || 0} {issue.comments?.length === 1 ? 'Comment' : 'Comments'}</span>
                                        </div>
                                    </div>

                                    {/* Share Button with Toast */}
                                    <div className="relative">
                                        <button 
                                            onClick={handleShare}
                                            className="p-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-2xl border border-gray-200 transition-all active:scale-90 shadow-2xs"
                                            title="Share this issue"
                                            aria-label="Share this issue"
                                        >
                                            <Share2 size={18} />
                                        </button>

                                        {copiedToast && (
                                            <div className="absolute right-0 -top-10 z-30 px-3 py-1 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-xl flex items-center gap-1.5 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                                                <Check size={12} className="text-emerald-400" />
                                                <span>Issue link copied!</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ========================================================================= */}
                        {/* RIGHT COLUMN: Discussion Section Only (Sticky with Nested Comments Scroll)*/}
                        {/* ========================================================================= */}
                        <div className="lg:col-span-6 xl:col-span-5 lg:sticky lg:top-28">
                            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm flex flex-col h-full lg:max-h-[calc(100vh-8.5rem)] min-h-[520px]">
                                
                                {/* Fixed Discussion Header */}
                                <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <MessageSquare size={18} />
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 tracking-tight">
                                            Discussion
                                        </h3>
                                    </div>
                                    <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-black rounded-xl border border-gray-100">
                                        {issue.comments?.length || 0} Total
                                    </span>
                                </div>

                                {/* Independently Scrollable Comments List (Nested Scroll ONLY here) */}
                                <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-3.5 pr-1 custom-scrollbar">
                                    {issue.comments && issue.comments.length > 0 ? (
                                        issue.comments.map((comment) => {
                                            const authorName = comment.user?.name || (typeof comment.user === 'string' ? 'Citizen' : 'Citizen');
                                            const authorInitial = authorName ? authorName.charAt(0).toUpperCase() : 'C';
                                            const isAuthorAdmin = comment.user?.role === 'admin';

                                            return (
                                                <div 
                                                    key={comment._id} 
                                                    className="bg-gray-50/80 hover:bg-gray-50 p-4 rounded-2xl border border-gray-100 transition-all relative group"
                                                >
                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                        {/* Avatar & Author Info */}
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-2xs shrink-0 ${
                                                                isAuthorAdmin
                                                                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-100'
                                                                    : 'bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-indigo-100'
                                                            }`}>
                                                                {authorInitial}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                                                                        {authorName}
                                                                    </span>
                                                                    {isAuthorAdmin && (
                                                                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-black rounded">
                                                                            Admin
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                                                                    <Calendar size={11} className="text-gray-400" />
                                                                    <span>{formatCommentDate(comment.createdAt)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Action Menu (⋮) for Comment Reporting */}
                                                        <div className="relative shrink-0">
                                                            <button
                                                                onClick={() => setActiveDropdownCommentId(activeDropdownCommentId === comment._id ? null : comment._id)}
                                                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition"
                                                                aria-label="Comment options"
                                                                title="More options"
                                                            >
                                                                <MoreVertical size={15} />
                                                            </button>

                                                            {activeDropdownCommentId === comment._id && (
                                                                <div className="absolute right-0 top-8 z-20 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                                                                    <button
                                                                        onClick={() => openReportModal(comment)}
                                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition text-left"
                                                                    >
                                                                        <Flag size={13} className="text-red-500" />
                                                                        <span>Report Comment</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Comment Content */}
                                                    <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-line pl-10.5">
                                                        {comment.text}
                                                    </p>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 space-y-1">
                                            <MessageSquare size={32} className="text-gray-300 mb-1" />
                                            <p className="text-gray-500 font-bold text-xs">No comments yet</p>
                                            <p className="text-[11px] text-gray-400">Be the first citizen to join the discussion.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Fixed Discussion Footer (Input / Resolved Banner) */}
                                <div className="pt-3 border-t border-gray-100 shrink-0">
                                    {isResolved ? (
                                        <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5 text-center space-y-1">
                                            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                                                <Lock size={14} className="text-emerald-600" />
                                                <span>🔒 This issue has been resolved. Discussion is closed.</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500">
                                                Historical comments remain preserved as a public record.
                                            </p>
                                        </div>
                                    ) : user ? (
                                        <div className="relative">
                                            <textarea
                                                rows="2"
                                                placeholder="Add to the discussion..."
                                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3.5 pr-12 text-xs font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all shadow-2xs resize-none"
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
                                                className="absolute right-2.5 bottom-3 bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-90 disabled:opacity-40 disabled:scale-100"
                                                disabled={!newComment.trim()}
                                                title="Post Comment"
                                                aria-label="Post Comment"
                                            >
                                                <Send size={15} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 p-4 rounded-2xl text-center border border-indigo-100">
                                            <p className="text-indigo-900 font-bold text-xs mb-2">Want to join this civic conversation?</p>
                                            <Link 
                                                to="/login" 
                                                className="inline-block px-5 py-2 bg-indigo-600 text-white rounded-xl font-black text-[11px] tracking-wider uppercase hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 active:scale-95"
                                            >
                                                Login to Comment
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer is now fully reachable via normal page scrolling */}
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
                        {/* Modal Header */}
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
