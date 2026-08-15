import React, { useState, useEffect } from 'react';
import { MapPin, Search, Filter, ThumbsUp, ArrowRight, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SkeletonCard from '../components/SkeletonCard';
import Footer from '../components/Footer';
import api from '../utils/api';
import { ISSUE_CATEGORIES } from '../constants/issueOptions';

const BrowseIssues = () => {
    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('All');
    const [sortBy, setSortBy] = useState('Most Supported');
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const res = await api.get('/issues?limit=100');
                setIssues(res.data.issues);
                setFilteredIssues(res.data.issues);
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
        let result = issues.filter(issue => issue.status !== 'Resolved');

        // Search Filter
        if (searchTerm) {
            result = result.filter(issue =>
                issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (issue.location && issue.location.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Category Filter
        if (category !== 'All') {
            result = result.filter(issue => issue.category === category);
        }

        // Sort Logic: Most Supported (Highest Upvotes) by default
        if (sortBy === 'Most Supported' || sortBy === 'Most Upvoted') {
            result.sort((a, b) => {
                const upvotesA = Array.isArray(a.upvotes) ? a.upvotes.length : 0;
                const upvotesB = Array.isArray(b.upvotes) ? b.upvotes.length : 0;
                if (upvotesB !== upvotesA) {
                    return upvotesB - upvotesA;
                }
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        } else if (sortBy === 'Most Recent') {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        setFilteredIssues(result);
    }, [issues, searchTerm, category, sortBy]);

    const handleVote = async (id) => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            const res = await api.put(`/issues/${id}/vote`);
            setIssues(prevIssues => prevIssues.map(issue =>
                issue._id === id ? { ...issue, upvotes: res.data } : issue
            ));
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'In Progress': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-24">
            <Navbar />

            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">Community Feed</h1>
                        <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">Discover and track local issues reported by your neighbors. Together, we can make a difference.</p>
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-indigo-100/20 border border-gray-100 mb-12">
                        <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
                            <div className="relative w-full lg:w-[30rem]">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by title, description or location..."
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                                <select
                                    className="px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-gray-600 cursor-pointer text-sm"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    <option value="All">All Categories</option>
                                    {ISSUE_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>

                                <select
                                    className="px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-gray-600 cursor-pointer text-sm"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="Most Supported">Most Supported (Highest Upvotes)</option>
                                    <option value="Most Recent">Most Recent</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Issues Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                        </div>
                    ) : filteredIssues.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredIssues.map((issue) => (
                                <div
                                    key={issue._id}
                                    className="group bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col"
                                >
                                    <div className="relative h-60 overflow-hidden">
                                        {issue.imageUrl ? (
                                            <img
                                                src={issue.imageUrl}
                                                alt={issue.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200">
                                                <AlertCircle size={64} />
                                            </div>
                                        )}
                                        <div className="absolute top-6 left-6">
                                            <span className="px-4 py-2 bg-white/90 backdrop-blur-md text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm border border-indigo-50">
                                                {issue.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-8 flex-grow flex flex-col">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusColor(issue.status)}`}>
                                                {issue.status}
                                            </span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                {new Date(issue.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-black text-gray-900 mb-3 line-clamp-1 group-hover:text-indigo-600 transition-colors">{issue.title}</h3>
                                        <p className="text-gray-500 text-sm font-medium mb-8 line-clamp-2 leading-relaxed">{issue.description}</p>

                                        <div className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">
                                            <MapPin size={16} className="mr-2 text-indigo-400" />
                                            <span className="truncate">{issue.location}</span>
                                        </div>

                                        <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-center">
                                            <button
                                                onClick={() => handleVote(issue._id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-90 ${user && issue.upvotes?.includes(user._id) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                            >
                                                <ThumbsUp size={16} className={user && issue.upvotes?.includes(user._id) ? 'fill-current' : ''} />
                                                <span>{issue.upvotes?.length || 0}</span>
                                            </button>
                                            
                                            <Link 
                                                to={`/issues/${issue._id}`} 
                                                className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:gap-3 transition-all"
                                            >
                                                Details <ArrowRight size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                <Filter size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">No issues found</h3>
                            <p className="text-gray-500 font-medium">Try adjusting your filters or search terms to find what you're looking for.</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default BrowseIssues;
