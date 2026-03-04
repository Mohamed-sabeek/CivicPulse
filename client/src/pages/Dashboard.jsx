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

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Create Issue Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
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

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold mb-4 sm:mb-0">Community Issues</h2>
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
                                            {user && user.role === 'admin' && (
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
                                            className={`flex items-center transition-colors ${user && issue.upvotes.includes(user._id) ? 'text-primary' : 'text-gray-600 hover:text-primary'
                                                }`}
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
            </div>
        </div >
    );
};

export default Dashboard;
