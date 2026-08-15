import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, ArrowUp, MessageSquare, Calendar, ChevronLeft, CheckCircle, Clock, Send, ThumbsUp, Share2, Lock } from 'lucide-react';
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
            console.error(err);
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
            console.error(err);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-100';
            default: return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Resolved': return <CheckCircle size={16} className="mr-1.5" />;
            case 'In Progress': return <Clock size={16} className="mr-1.5" />;
            default: return <Clock size={16} className="mr-1.5" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col pt-24">
                <Navbar />
                <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                    <DetailSkeleton />
                </main>
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
        <div className="min-h-screen bg-gray-50 flex flex-col pt-24">
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
                                <button className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90">
                                    <Share2 size={24} />
                                </button>
                            </div>
                        </div>
                    </article>

                    {/* Comments Section */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10 sm:p-12">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Discussion</h3>
                            <span className="px-4 py-1.5 bg-gray-50 text-gray-500 text-xs font-black rounded-xl border border-gray-100">
                                {issue.comments?.length || 0} TOTAL
                            </span>
                        </div>

                        <div className="space-y-6 mb-12">
                            {issue.comments && issue.comments.length > 0 ? (
                                issue.comments.map((comment, idx) => (
                                    <div key={idx} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 transition-all hover:bg-gray-50">
                                        <p className="text-gray-700 font-medium leading-relaxed">{comment.text}</p>
                                        <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <Calendar size={12} />
                                            {comment.createdAt ? new Date(comment.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-gray-50/30 rounded-3xl border-2 border-dashed border-gray-100">
                                    <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No conversation started yet</p>
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
                                    rows="1"
                                    placeholder="Add to the discussion..."
                                    className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-6 py-5 pr-16 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all shadow-sm font-medium resize-none overflow-hidden"
                                    value={newComment}
                                    onChange={(e) => {
                                        setNewComment(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                />
                                <button
                                    onClick={handleComment}
                                    className="absolute right-3 bottom-3 bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-90 disabled:opacity-50 disabled:scale-100"
                                    disabled={!newComment.trim()}
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="bg-indigo-50 p-8 rounded-3xl text-center border border-indigo-100">
                                <p className="text-indigo-900 font-bold mb-4">Want to share your thoughts?</p>
                                <Link to="/login" className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">
                                    Login to Comment
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default IssueDetails;
