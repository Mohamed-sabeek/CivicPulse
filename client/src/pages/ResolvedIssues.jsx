import React, { useState, useEffect } from 'react';
import { MapPin, Search, CheckCircle, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SkeletonCard from '../components/SkeletonCard';
import Footer from '../components/Footer';
import api from '../utils/api';
import { ISSUE_CATEGORIES } from '../constants/issueOptions';

const ResolvedIssues = () => {
    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('All');
    const [ownershipFilter, setOwnershipFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Most Recent');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const res = await api.get('/issues?limit=100');
                // Filter only resolved issues initially
                const resolved = res.data.issues.filter(issue => issue.status === 'Resolved');
                setIssues(resolved);
                setFilteredIssues(resolved);
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

        // Ownership Filter
        if (ownershipFilter === 'My Resolved Issues' && user) {
            result = result.filter(issue => issue.createdBy === user._id);
        } else if (ownershipFilter === 'Other Resolved Issues' && user) {
            result = result.filter(issue => issue.createdBy !== user._id);
        }

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
    }, [issues, searchTerm, category, sortBy, ownershipFilter, user]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-24">
            <Navbar />

            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-4">
                            <CheckCircle size={32} className="text-green-600" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Resolved Community Issues</h1>
                        <p className="text-xl text-gray-600">Celebrating positive changes and fixed problems in our neighborhood.</p>
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search resolved issues..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap gap-4 w-full md:w-auto">
                                {user && (
                                    <select
                                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                                        value={ownershipFilter}
                                        onChange={(e) => setOwnershipFilter(e.target.value)}
                                        title="Filter by Ownership"
                                    >
                                        <option value="All">All Resolved Issues</option>
                                        <option value="My Resolved Issues">My Resolved Issues</option>
                                        <option value="Other Resolved Issues">Other Resolved Issues</option>
                                    </select>
                                )}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                        </div>
                    ) : filteredIssues.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredIssues.map((issue) => (
                                <Link
                                    key={issue._id}
                                    to={`/issues/${issue._id}`}
                                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                                >
                                    <div className="relative h-56 overflow-hidden">
                                        {issue.imageUrl ? (
                                            <img
                                                src={issue.imageUrl}
                                                alt={issue.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300 italic">
                                                No image provided
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-indigo-600 text-xs font-bold rounded-xl shadow-sm border border-indigo-50">
                                                {issue.category}
                                            </span>
                                        </div>
                                        <div className="absolute top-4 right-4">
                                            <div className="p-2 bg-green-500/90 backdrop-blur-md text-white rounded-xl shadow-lg">
                                                <CheckCircle size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 flex-grow flex flex-col">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-green-50 text-green-700 border border-green-100 flex items-center gap-1.5 shadow-2xs">
                                                <CheckCircle size={12} className="text-green-600" />
                                                Resolved
                                            </span>
                                            <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                                <Calendar size={12} className="text-emerald-500" />
                                                {new Date(issue.resolvedAt || issue.updatedAt || issue.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">{issue.title}</h3>
                                        <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">{issue.description}</p>

                                        <div className="flex items-center text-gray-400 text-xs font-medium mb-6">
                                            <MapPin size={14} className="mr-1.5 text-indigo-400" />
                                            <span className="truncate">{issue.location}</span>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                                <CheckCircle size={12} /> Successfully Fixed
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                                View <ArrowRight size={14} />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <CheckCircle size={48} className="mx-auto text-green-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No resolved issues yet</h3>
                            <p className="text-gray-500 mt-2">Check back later or help resolve issues in your community!</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ResolvedIssues;
