import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { ThumbsUp, MessageSquare, MapPin, Send, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { ISSUE_CATEGORIES, ISSUE_TITLES } from '../constants/issueOptions';

const Dashboard = () => {
    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [user, setUser] = useState(null);
    const [newIssue, setNewIssue] = useState({
        title: '',
        description: '',
        category: '',
        location: '',
        imageUrl: ''
    });
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('All');
    const [sortBy, setSortBy] = useState('Newest');
    const [expandedIssue, setExpandedIssue] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [showIssueForm, setShowIssueForm] = useState(false);
    const [myPostsFilter, setMyPostsFilter] = useState('All');

    const fetchIssues = async () => {
        try {
            const res = await api.get('/issues');
            setIssues(res.data);
            setFilteredIssues(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/user');
            setUser(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchIssues();
        fetchUser();
    }, []);

    useEffect(() => {
        let result = [...issues];

        // Filter
        if (filterCategory !== 'All') {
            result = result.filter(issue => issue.category === filterCategory);
        }

        // Sort
        if (sortBy === 'Newest') {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'Most Voted') {
            result.sort((a, b) => b.upvotes.length - a.upvotes.length);
        }

        setFilteredIssues(result);
    }, [issues, filterCategory, sortBy]);

    const handleVote = async (id) => {
        try {
            const res = await api.put(`/issues/${id}/vote`);
            setIssues(issues.map(issue =>
                issue._id === id ? { ...issue, upvotes: res.data } : issue
            ));
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateIssue = async (e) => {
        e.preventDefault();
        try {
            await api.post('/issues', newIssue);
            setNewIssue({ title: '', description: '', category: '', location: '', imageUrl: '' });
            setShowIssueForm(false);
            fetchIssues();
        } catch (err) {
            console.error(err);
        }
    };


    const handleComment = async (id) => {
        if (!newComment.trim()) return;
        try {
            const res = await api.post(`/issues/${id}/comment`, { text: newComment });
            setIssues(issues.map(issue =>
                issue._id === id ? { ...issue, comments: res.data } : issue
            ));
            setNewComment('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            const res = await api.put(`/issues/${id}/status`, { status });
            setIssues(issues.map(issue =>
                issue._id === id ? res.data : issue
            ));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this issue?')) return;
        try {
            await api.delete(`/issues/${id}`);
            setIssues(issues.filter(issue => issue._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Resolved': return <CheckCircle size={16} className="mr-1" />;
            case 'In Progress': return <Clock size={16} className="mr-1" />;
            default: return <AlertCircle size={16} className="mr-1" />;
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewIssue({ ...newIssue, imageUrl: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const isAdmin = user?.role === 'admin';
    const userIssues = issues.filter(issue => user && String(issue.createdBy) === String(user._id));
    const filteredUserIssues = userIssues.filter(issue => {
        if (myPostsFilter === 'Active') return issue.status !== 'Resolved';
        if (myPostsFilter === 'Resolved') return issue.status === 'Resolved';
        return true;
    });
    const postCount = userIssues.length;
    const resolvedCount = isAdmin
        ? issues.filter(issue => issue.status === 'Resolved').length
        : userIssues.filter(issue => issue.status === 'Resolved').length;
    const totalIssuesCount = issues.length;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

                {/* Premium User Stats Section */}
                {user && (
                    <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-900 border border-indigo-800 shadow-xl p-8 flex flex-col md:flex-row items-center justify-between text-white">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4 user-select-none">
                            <span className="text-[160px] leading-none font-black tracking-tighter">IMPACT</span>
                        </div>
                        <div className="relative z-10 mb-6 md:mb-0 text-center md:text-left">
                            <h2 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight text-white drop-shadow-md">
                                Welcome back, <span className="text-blue-300">{user.name || 'User'}</span>!
                            </h2>
                            <p className="text-blue-200 text-lg font-medium">Your voice is building a better community.</p>
                        </div>
                        
                        <div className="relative z-10 flex gap-4 md:gap-6 w-full md:w-auto mt-2 md:mt-0 justify-center">
                            <div className="flex-1 md:flex-none flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl md:px-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-transform hover:-translate-y-1 hover:bg-white/15">
                                <p className="text-4xl font-extrabold text-white mb-1 drop-shadow-sm">{isAdmin ? totalIssuesCount : postCount}</p>
                                <p className="text-xs uppercase tracking-widest text-blue-200 font-bold">{isAdmin ? 'Total Reports' : 'Issues Posted'}</p>
                            </div>
                            <div className="flex-1 md:flex-none flex flex-col items-center justify-center bg-emerald-500/30 backdrop-blur-md border border-emerald-400/30 p-5 rounded-2xl md:px-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-transform hover:-translate-y-1 hover:bg-emerald-500/40">
                                <p className="text-4xl font-extrabold text-emerald-300 mb-1 drop-shadow-sm">{resolvedCount}</p>
                                <p className="text-xs uppercase tracking-widest text-emerald-200 font-bold">Issues Resolved</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Action Bar for Post Issue */}
                <div className="w-full flex justify-end mb-8">
                    <button
                        onClick={() => setShowIssueForm(!showIssueForm)}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] transform transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 font-bold text-sm tracking-wide"
                    >
                        {showIssueForm ? 'Cancel Form ×' : 'Post New Issue +'}
                    </button>
                </div>

                {/* Create Issue Form */}
                {showIssueForm && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 animate-fade-in-down">
                        <h2 className="text-xl font-bold mb-4">Report a New Issue</h2>
                        <form onSubmit={handleCreateIssue} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
                                    <select
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                        value={newIssue.title}
                                        onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Select Issue Title</option>
                                        {ISSUE_TITLES.map((title) => (
                                            <option key={title} value={title}>{title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        placeholder="Location"
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                        value={newIssue.location}
                                        onChange={(e) => setNewIssue({ ...newIssue, location: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <textarea
                                placeholder="Description"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                value={newIssue.description}
                                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                                required
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
                                    <select
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                        value={newIssue.category}
                                        onChange={(e) => setNewIssue({ ...newIssue, category: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Select Issue Type</option>
                                        {ISSUE_CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </div>
                            {newIssue.imageUrl && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                                    <img src={newIssue.imageUrl} alt="Preview" className="h-48 w-full object-cover rounded-lg border border-gray-200" />
                                </div>
                            )}
                            <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors">
                                Submit Issue
                            </button>
                        </form>
                    </div>
                )}

                {isAdmin && (
                    <>
                        {/* Filters and Search for Community Issues */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row justify-between items-center">
                            <h2 className="text-xl font-bold mb-4 sm:mb-0 text-gray-800">Community Issues</h2>
                            <div className="flex space-x-4">
                                <select
                                    className="p-2 border rounded-lg bg-white"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option value="All">All Categories</option>
                                    {ISSUE_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <select
                                    className="p-2 border rounded-lg bg-white"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="Newest">Newest</option>
                                    <option value="Most Voted">Most Voted</option>
                                </select>
                            </div>
                        </div>

                        {/* Issues List */}
                        {loading ? <div className="text-center py-10">Loading issues...</div> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredIssues.map((issue) => (
                                    <div key={issue._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                                        {issue.imageUrl && (
                                            <img src={issue.imageUrl} alt={issue.title} className="w-full h-48 object-cover" />
                                        )}
                                        <div className="p-6 flex-grow">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="px-3 py-1 bg-gray-100 text-xs font-medium text-gray-600 rounded-full">
                                                    {issue.category}
                                                </span>
                                                <div className="flex items-center space-x-2">
                                                    {user && user.role === 'admin' && (
                                                        <select
                                                            className="text-xs border rounded p-1"
                                                            value={issue.status}
                                                            onChange={(e) => handleStatusUpdate(issue._id, e.target.value)}
                                                        >
                                                            <option>Open</option>
                                                            <option>In Progress</option>
                                                            <option>Resolved</option>
                                                        </select>
                                                    )}
                                                    <span className={`flex items-center px-3 py-1 text-xs font-medium rounded-full ${issue.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                                        issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {getStatusIcon(issue.status)}
                                                        {issue.status}
                                                    </span>
                                                    {user && (user.role === 'admin' || String(issue.createdBy) === String(user._id)) && (
                                                        <button onClick={() => handleDelete(issue._id)} className="text-red-500 hover:text-red-700">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">{issue.title}</h3>
                                            <p className="text-gray-600 mb-4 line-clamp-3">{issue.description}</p>
                                            <div className="flex items-center text-gray-500 text-sm mb-6">
                                                <MapPin size={16} className="mr-1" />
                                                {issue.location}
                                            </div>

                                            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                                                <button
                                                    onClick={() => handleVote(issue._id)}
                                                    disabled={issue.status === 'Resolved'}
                                                    className={`flex items-center transition-colors ${issue.status === 'Resolved' ? 'text-gray-400 cursor-not-allowed' : user && issue.upvotes.includes(user._id) ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
                                                    title={issue.status === 'Resolved' ? "Voting is disabled for resolved issues" : "Upvote"}
                                                >
                                                    <ThumbsUp size={18} className="mr-1" fill={user && issue.upvotes.includes(user._id) ? "currentColor" : "none"} />
                                                    <span className="font-medium">{issue.upvotes.length}</span>
                                                </button>
                                                <button
                                                    onClick={() => setExpandedIssue(expandedIssue === issue._id ? null : issue._id)}
                                                    className="flex items-center text-gray-600 hover:text-primary"
                                                >
                                                    <MessageSquare size={18} className="mr-1" />
                                                    <span className="font-medium">{issue.comments.length}</span>
                                                </button>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                                                <Link to={`/issues/${issue._id}`} className="block w-full py-2 text-primary border border-primary rounded-lg hover:bg-blue-50 transition-colors text-sm font-semibold">
                                                    View Full Details
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Comments Section */}
                                        {expandedIssue === issue._id && (
                                            <div className="bg-gray-50 p-4 border-t border-gray-100">
                                                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                                                    {issue.comments.length > 0 ? (
                                                        issue.comments.map((comment, idx) => (
                                                            <div key={idx} className="bg-white p-2 rounded shadow-sm text-sm">
                                                                <p className="text-gray-800">{comment.text}</p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-gray-500 text-sm text-center">No comments yet.</p>
                                                    )}
                                                </div>
                                                <div className="flex space-x-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Add a comment..."
                                                        className="flex-grow p-2 border rounded-lg text-sm focus:outline-none focus:border-primary"
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                    />
                                                    <button
                                                        onClick={() => handleComment(issue._id)}
                                                        className="bg-primary text-white p-2 rounded-lg hover:bg-blue-600"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* User's Own Posts Section */}
                {user && (
                    <div className="mt-12">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 border-b border-gray-200 pb-3">
                            <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-indigo-500 pl-3 rounded-sm leading-tight">Your Posts</h2>
                            <div className="mt-4 sm:mt-0 flex">
                                <select
                                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none min-w-[150px] shadow-sm font-semibold text-gray-700 bg-white"
                                    value={myPostsFilter}
                                    onChange={(e) => setMyPostsFilter(e.target.value)}
                                >
                                    <option value="All">All Posts</option>
                                    <option value="Active">Active Issues</option>
                                    <option value="Resolved">Resolved Issues</option>
                                </select>
                            </div>
                        </div>
                        {userIssues.length === 0 ? (
                            <div className="bg-white p-8 rounded-xl text-center border border-gray-200 text-gray-500 shadow-sm">
                                You haven't posted any issues yet. Click "Post New Issue +" above to report something in your community.
                            </div>
                        ) : filteredUserIssues.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredUserIssues.map((issue) => (
                                    <div key={issue._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                                        {/* Copied basic issue layout, simplified for 'My Posts' */}
                                        {issue.imageUrl && (
                                            <img src={issue.imageUrl} alt={issue.title} className="w-full h-32 object-cover" />
                                        )}
                                        <div className="p-4 flex-grow flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="px-2 py-1 bg-gray-100 text-[10px] font-medium text-gray-600 rounded-full">
                                                    {issue.category}
                                                </span>
                                                <span className={`flex items-center px-2 py-1 text-[10px] font-medium rounded-full ${issue.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                                    issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {getStatusIcon(issue.status)}
                                                    {issue.status}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{issue.title}</h3>
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{issue.description}</p>
                                            <div className="mt-auto border-t border-gray-100 pt-3 flex justify-between items-center text-sm">
                                                <span className="text-gray-500">{new Date(issue.createdAt).toLocaleDateString()}</span>
                                                <Link to={`/issues/${issue._id}`} className="text-primary hover:underline font-medium">View</Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-xl text-center border border-gray-200 text-gray-500 shadow-sm">
                                No {myPostsFilter.toLowerCase()} issues found in this category.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};

export default Dashboard;
