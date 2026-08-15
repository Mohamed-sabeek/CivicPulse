import React, { useEffect, useState } from 'react';
import { MapPin, ArrowUp, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const TrendingIssues = () => {
    const [issues, setIssues] = useState([]);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const res = await api.get('/issues');
                // Filter out resolved, sort by upvotes, take top 3
                const sortedIssues = res.data.issues
                    .filter(issue => issue.status !== 'Resolved')
                    .sort((a, b) => b.upvotes.length - a.upvotes.length)
                    .slice(0, 3);
                setIssues(sortedIssues);
            } catch (err) {
                console.error('Error fetching trending issues:', err);
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

        fetchIssues();
        fetchUser();
    }, []);

    const handleVote = async (e, id) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            const res = await api.put(`/issues/${id}/vote`);
            setIssues(issues.map(issue =>
                issue._id === id ? { ...issue, upvotes: res.data } : issue
            ));
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

    return (
        <section id="browse-issues" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Trending Issues</h2>
                        <p className="mt-2 text-gray-600">See what citizens are reporting nearby.</p>
                    </div>
                    <Link to="/dashboard" className="hidden sm:block text-primary font-semibold hover:text-blue-700">
                        View All Issues &rarr;
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {issues.length > 0 ? (
                        issues.map((issue) => (
                            <div key={issue._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                                {issue.imageUrl ? (
                                    <img src={issue.imageUrl} alt={issue.title} className="h-48 w-full object-cover" />
                                ) : (
                                    <div className="h-48 bg-gray-100 w-full object-cover flex items-center justify-center text-gray-400">
                                        <span>No Image</span>
                                    </div>
                                )}
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="px-3 py-1 bg-gray-100 text-xs font-medium text-gray-600 rounded-full">
                                            {issue.category}
                                        </span>
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}>
                                            {issue.status}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{issue.title}</h3>
                                    <div className="flex items-center text-gray-500 text-sm mb-6">
                                        <MapPin size={16} className="mr-1" />
                                        {issue.location}
                                    </div>

                                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                        <div className="flex items-center space-x-4">
                                            <button
                                                onClick={(e) => issue.status !== 'Resolved' && handleVote(e, issue._id)}
                                                disabled={issue.status === 'Resolved'}
                                                className={`flex items-center transition-colors ${
                                                    issue.status === 'Resolved'
                                                        ? 'text-gray-400 cursor-not-allowed opacity-75'
                                                        : user && issue.upvotes.includes(user._id)
                                                        ? 'text-primary'
                                                        : 'text-gray-600 hover:text-primary'
                                                }`}
                                                title={issue.status === 'Resolved' ? 'Resolved issue (voting closed)' : 'Upvote'}
                                            >
                                                <ArrowUp size={18} className={`mr-1 ${user && issue.upvotes.includes(user._id) ? 'fill-current' : ''}`} />
                                                <span className="font-medium">{issue.upvotes.length}</span>
                                            </button>
                                            <Link to={`/issues/${issue._id}`} className="flex items-center text-gray-600 hover:text-primary transition-colors">
                                                <MessageSquare size={18} className="mr-1" />
                                                <span className="font-medium">{issue.comments.length}</span>
                                            </Link>
                                        </div>
                                        <span className="text-sm text-gray-400">
                                            {new Date(issue.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <Link to={`/issues/${issue._id}`} className="block w-full text-center py-2 text-primary border border-primary rounded-lg hover:bg-blue-50 transition-colors text-sm font-semibold">
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 text-center text-gray-500">
                            No issues reported yet. Be the first to report one!
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center sm:hidden">
                    <Link to="/dashboard" className="text-primary font-semibold hover:text-blue-700">
                        View All Issues &rarr;
                    </Link>
                </div>
            </div >
        </section >
    );
};

export default TrendingIssues;

