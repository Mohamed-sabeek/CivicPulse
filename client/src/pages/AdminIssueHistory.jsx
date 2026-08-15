import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Search, Filter, Calendar, MapPin, User, ThumbsUp, CheckCircle, 
    Clock, ArrowLeft, ArrowUpDown, Timer, Eye, AlertCircle, History, Sparkles, Flag, Users, Ban 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AdminSkeleton from '../components/AdminSkeleton';
import IssueTimelineModal from '../components/IssueTimelineModal';
import AdminNav from '../components/AdminNav';
import api from '../utils/api';

const calculateResolutionTime = (createdAt, resolvedAt, updatedAt) => {
    const end = resolvedAt || updatedAt;
    if (!end || !createdAt) return null;

    const diffMs = Math.max(0, new Date(end) - new Date(createdAt));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffHrs / 24);
    const remainingHrs = diffHrs % 24;

    if (days > 0) {
        return `${days}d ${remainingHrs}h`;
    }
    if (diffHrs > 0) {
        return `${diffHrs} hour${diffHrs > 1 ? 's' : ''}`;
    }
    const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${mins} minute${mins > 1 ? 's' : ''}`;
};

const AdminIssueHistory = () => {
    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('Newest First');
    const [selectedTimelineIssueId, setSelectedTimelineIssueId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/admin/issues/history');
                setIssues(res.data.issues || []);
                setFilteredIssues(res.data.issues || []);
            } catch (err) {
                console.error('Error fetching issue history:', err);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [navigate]);

    useEffect(() => {
        let result = [...issues];

        // Status Filter
        if (statusFilter !== 'All') {
            if (statusFilter === 'Pending') {
                result = result.filter(i => i.status === 'Open' || i.status === 'Pending');
            } else {
                result = result.filter(i => i.status === statusFilter);
            }
        }

        // Search Filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(i =>
                i.title.toLowerCase().includes(term) ||
                (i.description && i.description.toLowerCase().includes(term)) ||
                (i.location && i.location.toLowerCase().includes(term)) ||
                (i.category && i.category.toLowerCase().includes(term)) ||
                (i.createdBy?.name && i.createdBy.name.toLowerCase().includes(term))
            );
        }

        // Sorting
        if (sortBy === 'Newest First') {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'Oldest First') {
            result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortBy === 'Most Supported') {
            result.sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0));
        } else if (sortBy === 'Recently Resolved') {
            result.sort((a, b) => {
                const dateA = a.resolvedAt || a.updatedAt || a.createdAt;
                const dateB = b.resolvedAt || b.updatedAt || b.createdAt;
                return new Date(dateB) - new Date(dateA);
            });
        }

        setFilteredIssues(result);
    }, [issues, statusFilter, searchTerm, sortBy]);

    const getStatusBadge = (status) => {
        const normalized = status === 'Open' ? 'Pending' : status;
        if (normalized === 'Resolved') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Resolved
                </span>
            );
        }
        if (normalized === 'In Progress') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    In Progress
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Pending
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-24">
            <Navbar />

            <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Link
                                    to="/admin"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs transition-all active:scale-95"
                                >
                                    <ArrowLeft size={14} /> Back to Dashboard
                                </Link>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live System
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <History size={32} className="text-indigo-600" />
                                Issue History & Audit Trail
                            </h1>
                            <p className="text-gray-500 mt-1 text-sm font-medium">
                                Complete repository of community civic reports, timeline tracking, and resolution analytics.
                            </p>
                        </div>

                        <AdminNav 
                            counts={{
                                appeals: undefined,
                                reports: undefined,
                                citizens: undefined,
                                history: issues.length
                            }}
                        />
                    </div>

                    {/* Filter Tabs & Search Bar */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8 space-y-4">
                        {/* Status Filter Tabs */}
                        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-4">
                            {[
                                { key: 'All', label: 'All Issues', count: issues.length },
                                { key: 'Pending', label: 'Pending', count: issues.filter(i => i.status === 'Open' || i.status === 'Pending').length },
                                { key: 'In Progress', label: 'In Progress', count: issues.filter(i => i.status === 'In Progress').length },
                                { key: 'Resolved', label: 'Resolved', count: issues.filter(i => i.status === 'Resolved').length },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setStatusFilter(tab.key)}
                                    className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2 ${
                                        statusFilter === tab.key
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                        statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200/70 text-gray-700'
                                    }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Search & Sort Row */}
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by title, category, location, reporter..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <ArrowUpDown size={14} /> Sort By:
                                </span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                                >
                                    <option value="Most Recent">Most Recent</option>
                                    <option value="Oldest">Oldest</option>
                                    <option value="Most Supported">Most Supported (Upvotes)</option>
                                    <option value="Recently Resolved">Recently Resolved</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Issues History List */}
                    {loading ? (
                        <AdminSkeleton />
                    ) : filteredIssues.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Filter size={32} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 mb-1">No matching issues found</h3>
                            <p className="text-xs text-gray-500 font-medium">Try changing your search term or status filter.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Desktop Table Header */}
                            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/80 border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                                <div className="col-span-4">Issue Details</div>
                                <div className="col-span-2">Reported By</div>
                                <div className="col-span-2">Current Status</div>
                                <div className="col-span-2">Timeline & Resolution</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>

                            {/* Table Rows / Cards */}
                            <div className="divide-y divide-gray-100">
                                {filteredIssues.map((issue) => {
                                    const isResolved = issue.status === 'Resolved';
                                    const resTime = isResolved ? calculateResolutionTime(issue.createdAt, issue.resolvedAt, issue.updatedAt) : null;

                                    return (
                                        <div
                                            key={issue._id}
                                            className="p-5 sm:p-6 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center hover:bg-gray-50/50 transition-colors"
                                        >
                                            {/* Col 1: Issue Info */}
                                            <div className="col-span-4 flex items-start gap-4 mb-4 lg:mb-0">
                                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                                    {issue.imageUrl ? (
                                                        <img
                                                            src={issue.imageUrl}
                                                            alt={issue.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <AlertCircle size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold border border-indigo-100">
                                                            {issue.category}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                            <ThumbsUp size={11} className="text-indigo-500" />
                                                            {issue.upvotes?.length || 0}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-sm font-black text-gray-900 truncate">{issue.title}</h4>
                                                    <p className="text-xs text-gray-500 font-medium truncate flex items-center gap-1 mt-0.5">
                                                        <MapPin size={12} className="text-red-400 flex-shrink-0" />
                                                        <span className="truncate">{issue.location}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Col 2: Reporter */}
                                            <div className="col-span-2 mb-3 lg:mb-0">
                                                <div className="flex items-center gap-1.5">
                                                    <User size={13} className="text-indigo-500 flex-shrink-0" />
                                                    <span className="text-xs font-bold text-gray-800 truncate">
                                                        {issue.createdBy?.name || 'Citizen'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-400 truncate pl-5">
                                                    {issue.createdBy?.email || 'N/A'}
                                                </p>
                                            </div>

                                            {/* Col 3: Status */}
                                            <div className="col-span-2 mb-3 lg:mb-0">
                                                {getStatusBadge(issue.status)}
                                            </div>

                                            {/* Col 4: Timeline & Resolution Time */}
                                            <div className="col-span-2 mb-4 lg:mb-0 space-y-1">
                                                <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    <span>Reported: <strong>{new Date(issue.createdAt).toLocaleDateString()}</strong></span>
                                                </div>
                                                {isResolved && (
                                                    <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                                                        <Timer size={12} className="text-emerald-500" />
                                                        <span>Resolved in <strong>{resTime || 'Quick'}</strong></span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Col 5: Actions */}
                                            <div className="col-span-2 flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedTimelineIssueId(issue._id)}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 border border-indigo-100"
                                                >
                                                    <Eye size={14} /> View Timeline
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Timeline Audit Modal */}
            <IssueTimelineModal
                issueId={selectedTimelineIssueId}
                isOpen={!!selectedTimelineIssueId}
                onClose={() => setSelectedTimelineIssueId(null)}
            />

            <Footer />
        </div>
    );
};

export default AdminIssueHistory;
