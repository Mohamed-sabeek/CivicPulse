import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, ArrowUp, MessageSquare, Calendar, ChevronLeft, CheckCircle, Clock, Send } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
            try {
                const res = await api.get('/auth/user');
                setUser(res.data);
            } catch (err) {
                console.error('Error fetching user:', err);
            }
        };

        fetchIssue();
        fetchUser();
    }, [id]);

    const handleComment = async () => {
        if (!newComment.trim()) return;
        try {
            const res = await api.post(`/issues/${id}/comment`, { text: newComment });
            setIssue({ ...issue, comments: res.data });
            setNewComment('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleVote = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            const res = await api.put(`/issues/${id}/vote`);
            setIssue({ ...issue, upvotes: res.data });
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-green-100 text-green-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Resolved': return <CheckCircle size={16} className="mr-1" />;
            case 'In Progress': return <Clock size={16} className="mr-1" />;
            default: return <Clock size={16} className="mr-1" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-grow flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !issue) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center p-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h2>
                    <p className="text-gray-600 mb-6">{error || 'Issue not found.'}</p>
                    <Link to="/issues" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors">
                        Browse Issues
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <Link to="/issues" className="inline-flex items-center text-gray-500 hover:text-primary mb-6 transition-colors">
                        <ChevronLeft size={20} className="mr-1" />
                        Back to Issues
                    </Link>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        {issue.imageUrl && (
                            <div className="h-64 sm:h-96 w-full relative">
                                <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                <div className="absolute bottom-6 left-6 text-white">
                                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">{issue.title}</h1>
                                    <div className="flex items-center space-x-4 text-sm sm:text-base opacity-90">
                                        <span className="flex items-center"><MapPin size={18} className="mr-1" /> {issue.location}</span>
                                        <span className="flex items-center"><Calendar size={18} className="mr-1" /> {new Date(issue.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-8">
                            {!issue.imageUrl && (
                                <div className="mb-8 border-b border-gray-100 pb-8">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{issue.title}</h1>
                                    <div className="flex items-center text-gray-500 space-x-4">
                                        <span className="flex items-center"><MapPin size={18} className="mr-1" /> {issue.location}</span>
                                        <span className="flex items-center"><Calendar size={18} className="mr-1" /> {new Date(issue.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-4 mb-8">
                                <span className="px-4 py-2 bg-gray-100 text-sm font-semibold text-gray-700 rounded-full">
                                    {issue.category}
                                </span>
                                <span className={`flex items-center px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                                    {getStatusIcon(issue.status)} {issue.status}
                                </span>
                            </div>

                            <div className="prose max-w-none text-gray-600 mb-10">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
                                <p className="leading-relaxed whitespace-pre-line">{issue.description}</p>
                                <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                                    <div className="flex items-center space-x-8">
                                        <button
                                            onClick={handleVote}
                                            disabled={issue.status === 'Resolved'}
                                            className={`flex items-center transition-colors ${issue.status === 'Resolved' ? 'text-gray-400 cursor-not-allowed' : user && issue.upvotes.includes(user._id) ? 'text-primary' : 'text-gray-700 hover:text-primary'}`}
                                            title={issue.status === 'Resolved' ? "Voting is disabled for resolved issues" : "Upvote"}
                                        >
                                            <ArrowUp size={24} className={`mr-2 ${user && issue.upvotes.includes(user._id) ? 'fill-current' : ''}`} />
                                            <span className="text-lg font-bold">{issue.upvotes ? issue.upvotes.length : 0} <span className="text-gray-500 font-normal text-base ml-1">Upvotes</span></span>
                                        </button>
                                        <div className="flex items-center text-gray-700">
                                            <MessageSquare size={24} className="mr-2 text-primary" />
                                            <span className="text-lg font-bold">{issue.comments ? issue.comments.length : 0} <span className="text-gray-500 font-normal text-base ml-1">Comments</span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Comments ({issue.comments ? issue.comments.length : 0})</h3>

                        <div className="space-y-4 mb-8">
                            {issue.comments && issue.comments.length > 0 ? (
                                issue.comments.map((comment, idx) => (
                                    <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-gray-800">{comment.text}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {comment.createdAt ? new Date(comment.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 italic">No comments yet. Be the first to share your thoughts!</p>
                            )}
                        </div>

                        {user ? (
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                                />
                                <button
                                    onClick={handleComment}
                                    className="bg-primary text-white p-3 rounded-xl hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!newComment.trim()}
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="bg-blue-50 p-4 rounded-xl text-center">
                                <p className="text-blue-800">
                                    Please <Link to="/login" className="font-semibold underline hover:text-blue-900">log in</Link> to join the discussion.
                                </p>
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
