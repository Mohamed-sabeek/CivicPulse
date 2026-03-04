import React, { useState, useEffect } from 'react';
import { MapPin, ArrowUp, MessageSquare, Search, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { ISSUE_CATEGORIES } from '../constants/issueOptions';

const BrowseIssues = () => {
    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('All');
    const [sortBy, setSortBy] = useState('Most Recent');
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const res = await api.get('/issues');
                // Exclude Resolved issues
                const activeIssues = res.data.filter(issue => issue.status !== 'Resolved');
                setIssues(activeIssues);
                setFilteredIssues(activeIssues);
            } catch (err) {
                console.error('Error fetching issues:', err);
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

        fetchIssues();
        fetchUser();
    }, []);

    useEffect(() => {
        let result = [...issues];

        // Search Filter
        if (searchTerm) {
            result = result.filter(issue =>
                issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                issue.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Category Filter
        if (category !== 'All') {
            result = result.filter(issue => issue.category === category);
        }

        // Sort Logic
        if (sortBy === 'Most Recent') {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'Most Upvoted') {
            result.sort((a, b) => b.upvotes.length - a.upvotes.length);
        }

        setFilteredIssues(result);
    }, [issues, searchTerm, category, sortBy]);

    const handleVote = async (e, id) => {
        e.preventDefault(); // Prevent navigation if clicked on card
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Browse Community Issues</h1>
                        <p className="text-xl text-gray-600">Discover and track local issues reported by your neighbors.</p>
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search issues..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4 w-full md:w-auto">
                                <select
                                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    title="Filter by Category"
                                >
                                    <option value="All">All Categories</option>
                                    {ISSUE_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>

                                <select
                                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    title="Sort Issues"
                                >
                                    <option value="Most Recent">Most Recent</option>
                                    <option value="Most Upvoted">Most Upvoted</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Issues Grid */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        </div>
                    ) : filteredIssues.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredIssues.map((issue) => (
                                <div key={issue._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                                    {issue.imageUrl ? (
                                        <img src={issue.imageUrl} alt={issue.title} className="h-48 w-full object-cover" />
                                    ) : (
                                        <div className="h-48 bg-gray-100 w-full object-cover flex items-center justify-center text-gray-400">
                                            <span>No Image</span>
                                        </div>
                                    )}
                                    <div className="p-6 flex-grow flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="px-3 py-1 bg-gray-100 text-xs font-medium text-gray-600 rounded-full">
                                                {issue.category}
                                            </span>
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}>
                                                {issue.status}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{issue.title}</h3>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">{issue.description}</p>
                                        <div className="flex items-center text-gray-500 text-sm mb-6">
                                            <MapPin size={16} className="mr-1" />
                                            <span className="truncate">{issue.location}</span>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                                            <div className="flex items-center space-x-4">
                                                <button
                                                    onClick={(e) => handleVote(e, issue._id)}
                                                    className={`flex items-center transition-colors ${user && issue.upvotes.includes(user._id) ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
                                                    title="Upvote"
                                                >
                                                    <ArrowUp size={18} className={`mr-1 ${user && issue.upvotes.includes(user._id) ? 'fill-current' : ''}`} />
                                                    <span className="font-medium">{issue.upvotes ? issue.upvotes.length : 0}</span>
                                                </button>
                                                <Link to={`/issues/${issue._id}`} className="flex items-center text-gray-600 hover:text-primary transition-colors" title="Comments">
                                                    <MessageSquare size={18} className="mr-1" />
                                                    <span className="font-medium">{issue.comments ? issue.comments.length : 0}</span>
                                                </Link>
                                            </div>
                                            <span className="text-sm text-gray-400">
                                                {new Date(issue.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* Since we don't have a single issue view page yet, maybe direct to dashboard or just keep it view only for now? 
                                            The prompt asked for a "View Details" button. 
                                            Assuming it goes to a details page which might not exist or we can link to /dashboard if logged in?
                                            Let's put a placeholder button for now or link to /issues/id if we had it.
                                            For now, I'll just make it a non-functional button or link to dashboard if logged in.
                                            Actually, I'll omit the link destination or point it to # for now as specific issue details page wasn't explicitly requested to be built in this step.
                                            Wait, prompt says "View Details button". I'll add the button.
                                        */}
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <Link to={`/issues/${issue._id}`} className="block w-full text-center py-2 text-primary border border-primary rounded-lg hover:bg-blue-50 transition-colors text-sm font-semibold">
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <Filter size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No issues found</h3>
                            <p className="text-gray-500 mt-2">Try adjusting your search or filters to find what you're looking for.</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default BrowseIssues;
