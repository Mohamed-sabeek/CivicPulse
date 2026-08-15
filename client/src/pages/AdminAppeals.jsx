import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
    HelpCircle, Ban, CheckCircle, X, Search, ChevronLeft, 
    Calendar, Mail, User, MessageSquare, AlertCircle, 
    CheckCircle2, ArrowRight, Sparkles, Filter, ChevronRight,
    Users, History, LayoutDashboard, Flag, Shield, AlertTriangle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AdminSkeleton from '../components/AdminSkeleton';
import UserDetailsModal from '../components/UserDetailsModal';
import AdminNav from '../components/AdminNav';
import api from '../utils/api';

const AdminAppeals = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const initialStatus = searchParams.get('status') || 'pending';
    const [appeals, setAppeals] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, reviewed: 0, resolved: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortOption, setSortOption] = useState('newest');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1, totalAppeals: 0 });

    // Review Modal State (in React component state only, no automatic reopen on refresh)
    const [activeAppeal, setActiveAppeal] = useState(null);
    const [appealDetailsLoading, setAppealDetailsLoading] = useState(false);
    const [appealUserContext, setAppealUserContext] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');

    // Decision Confirmation Modal State
    const [decisionModal, setDecisionModal] = useState({
        isOpen: false,
        appeal: null,
        targetDecision: null, // 'unblock' | 'keep_blocked'
        loading: false
    });

    // User details modal
    const [selectedUserId, setSelectedUserId] = useState(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchAppeals = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                status: statusFilter,
                search: debouncedSearch,
                sort: sortOption,
                page,
                limit: 10
            };
            const res = await api.get('/admin/appeals', { params });
            setAppeals(res.data.appeals || []);
            setStats(res.data.stats || { total: 0, pending: 0, reviewed: 0, resolved: 0 });
            setPagination(res.data.pagination || { totalPages: 1, totalAppeals: 0 });
        } catch (err) {
            console.error('Error fetching admin appeals:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [statusFilter, debouncedSearch, sortOption, page, navigate]);

    useEffect(() => {
        fetchAppeals();
    }, [fetchAppeals]);

    const handleFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        setPage(1);
        setSearchParams({ status: newStatus });
    };

    const handleOpenReview = async (appeal) => {
        setActiveAppeal(appeal);
        setAdminNotes(appeal.adminNotes || '');
        setAppealDetailsLoading(true);
        try {
            const res = await api.get(`/admin/appeals/${appeal._id}`);
            setActiveAppeal(res.data.appeal);
            setAppealUserContext(res.data.userContext);
        } catch (err) {
            console.error('Failed to load appeal details:', err);
        } finally {
            setAppealDetailsLoading(false);
        }
    };

    const handleCloseReview = () => {
        setActiveAppeal(null);
        setAppealUserContext(null);
        setAdminNotes('');
        if (searchParams.has('appealId')) {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('appealId');
            setSearchParams(newParams, { replace: true });
        }
    };

    const handleExecuteDecision = async () => {
        if (!decisionModal.appeal || !decisionModal.targetDecision) return;
        setDecisionModal(prev => ({ ...prev, loading: true }));
        try {
            await api.post(`/admin/appeals/${decisionModal.appeal._id}/decision`, {
                decision: decisionModal.targetDecision,
                adminNotes: adminNotes.trim()
            });
            setDecisionModal({ isOpen: false, appeal: null, targetDecision: null, loading: false });
            handleCloseReview();
            fetchAppeals();
        } catch (err) {
            console.error('Failed to execute appeal decision:', err);
            alert(err.response?.data?.msg || 'Failed to process appeal.');
            setDecisionModal(prev => ({ ...prev, loading: false }));
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (appeal) => {
        if (appeal.status === 'resolved') {
            if (appeal.decision === 'unblocked') {
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle size={12} className="text-emerald-600" /> 🟢 UNBLOCKED
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                    <Ban size={12} className="text-red-600" /> 🔴 BLOCK MAINTAINED
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                🟡 PENDING REVIEW
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-24 font-sans">
            <Navbar />

            <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Header Banner & Navigation Tabs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-black uppercase tracking-wider">
                                    <Ban size={13} className="text-red-600" /> Account Appeals
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                                Account Appeals
                            </h1>
                            <p className="text-gray-500 mt-1 font-medium text-sm">
                                Review requests from citizens regarding blocked accounts.
                            </p>
                        </div>

                        {/* Top Navigation Links */}
                        <AdminNav 
                            counts={{
                                appeals: stats.pending,
                                reports: undefined,
                                citizens: undefined,
                                history: undefined
                            }}
                        />
                    </div>

                    {/* Filter & Metric Cards Header */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
                        
                        {/* Status Filter Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                            {[
                                { id: 'pending', label: 'Pending Review', count: stats.pending, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                                { id: 'all', label: 'All Appeals', count: stats.total, color: 'text-gray-700 bg-gray-50 border-gray-200' },
                                { id: 'resolved', label: 'Resolved', count: stats.resolved, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleFilterChange(tab.id)}
                                    className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 border ${
                                        statusFilter === tab.id
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 scale-[1.02]'
                                            : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        statusFilter === tab.id
                                            ? 'bg-white/20 text-white'
                                            : tab.color
                                    }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Search & Sort Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                            <div className="relative flex-1 max-w-md">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by Reference ID, citizen, email, or message..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs font-bold text-gray-500">Sort by:</span>
                                <select
                                    value={sortOption}
                                    onChange={(e) => { setSortOption(e.target.value); setPage(1); }}
                                    className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Appeals Feed */}
                    {loading ? (
                        <AdminSkeleton />
                    ) : appeals.length === 0 ? (
                        <div className="py-20 px-6 text-center bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
                            <div className="w-16 h-16 rounded-3xl bg-gray-50 text-gray-400 mx-auto flex items-center justify-center">
                                <HelpCircle size={32} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">No Appeals Found</h3>
                            <p className="text-xs text-gray-400 max-w-md mx-auto">
                                {statusFilter === 'pending'
                                    ? 'No pending account appeals from blocked users at this time.'
                                    : 'No appeals match your active search and filter criteria.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {appeals.map((app) => (
                                <div 
                                    key={app._id}
                                    className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-200 hover:shadow-md ${
                                        app.status === 'pending'
                                            ? 'border-amber-200 shadow-xs'
                                            : 'border-gray-100'
                                    }`}
                                >
                                    {/* Top Row: Reference ID, Citizen Name & Email + Status Badge */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="font-mono text-xs font-black bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-100">
                                                {app.referenceId}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-xs font-black text-gray-900 bg-gray-50 px-3 py-1 rounded-xl border border-gray-200">
                                                <User size={12} className="text-gray-400" />
                                                <span>Citizen: {app.userName || app.userId?.name || 'Citizen'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                                <Mail size={12} className="text-gray-400" />
                                                <span>{app.email}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(app)}
                                            <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                                                <Calendar size={12} />
                                                {formatDateTime(app.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Middle Section: Subject & Appeal Message */}
                                    <div className="py-4 space-y-2">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-600">
                                            Subject: <span className="text-gray-900">{app.subject}</span>
                                        </h4>
                                        <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4">
                                            <p className="text-xs sm:text-sm text-gray-800 font-medium italic leading-relaxed whitespace-pre-line">
                                                "{app.message}"
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bottom Audit & Action Row */}
                                    <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            {app.status === 'resolved' && app.reviewedByName ? (
                                                <span className="text-xs text-gray-500 font-medium">
                                                    Resolved by <strong className="text-gray-800">{app.reviewedByName}</strong> on {formatDateTime(app.reviewedAt)}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-amber-700 font-bold">
                                                    Action Required: Review citizen appeal and standing
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {app.userId && (
                                                <button
                                                    onClick={() => setSelectedUserId(app.userId._id || app.userId)}
                                                    className="px-3.5 py-2 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-xs font-bold rounded-xl transition border border-gray-200 shadow-2xs"
                                                >
                                                    View User
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleOpenReview(app)}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-100 active:scale-95"
                                            >
                                                <span>Review Appeal</span>
                                                <ArrowRight size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between pt-6">
                                    <p className="text-xs font-bold text-gray-500">
                                        Page {page} of {pagination.totalPages} ({pagination.totalAppeals} total appeals)
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                            disabled={page === 1}
                                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                                            disabled={page === pagination.totalPages}
                                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            {/* Detailed Appeal Review Modal */}
            {activeAppeal && (
                <div 
                    className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={handleCloseReview}
                >
                    <div 
                        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                                    <Ban size={22} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-black text-gray-900">Appeal Review</h3>
                                        <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                                            {activeAppeal.referenceId}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium">Verify context and make a definitive moderation decision</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseReview}
                                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {appealDetailsLoading ? (
                            <div className="py-12 text-center space-y-3">
                                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-xs font-bold text-gray-500">Loading citizen profile context...</p>
                            </div>
                        ) : (
                            <div className="space-y-4 text-xs">
                                
                                {/* Status & Dates */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Appeal Status</span>
                                        <div className="mt-1">{getStatusBadge(activeAppeal)}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Submission Timestamp</span>
                                        <p className="font-bold text-gray-700 mt-1">{formatDateTime(activeAppeal.createdAt)}</p>
                                    </div>
                                </div>

                                {/* Citizen Profile Summary */}
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Account Context</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                        <div>
                                            <p className="text-gray-400 text-[10px]">Name</p>
                                            <p className="font-bold text-gray-900">{appealUserContext?.name || activeAppeal.userName || 'Citizen'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-[10px]">Email</p>
                                            <p className="font-bold text-gray-900 truncate">{activeAppeal.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-[10px]">Joined Date</p>
                                            <p className="font-bold text-gray-900">
                                                {appealUserContext?.createdAt ? new Date(appealUserContext.createdAt).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-[10px]">Issues Reported</p>
                                            <p className="font-bold text-indigo-600">{appealUserContext?.totalIssues ?? 'N/A'}</p>
                                        </div>
                                    </div>

                                    {appealUserContext?.blockedReason && (
                                        <div className="pt-2 border-t border-gray-200/60">
                                            <p className="text-[10px] text-red-600 font-bold">
                                                Active Block Reason: <span className="font-normal text-gray-700">{appealUserContext.blockedReason}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Citizen's Appeal Message */}
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Citizen Appeal Message</span>
                                    <div className="bg-red-50/40 border border-red-100 rounded-2xl p-4">
                                        <p className="font-bold text-gray-900 mb-1">{activeAppeal.subject}</p>
                                        <p className="text-sm text-gray-800 font-medium italic whitespace-pre-line leading-relaxed">
                                            "{activeAppeal.message}"
                                        </p>
                                    </div>
                                </div>

                                {/* Actions / Decision Area */}
                                {activeAppeal.status === 'pending' ? (
                                    <div className="space-y-3 pt-2">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                Admin Review Notes (Optional)
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={adminNotes}
                                                onChange={(e) => setAdminNotes(e.target.value)}
                                                placeholder="Enter audit notes regarding this review..."
                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                                            />
                                        </div>

                                        <div className="flex items-center justify-end gap-3 pt-2">
                                            <button
                                                onClick={() => setDecisionModal({
                                                    isOpen: true,
                                                    appeal: activeAppeal,
                                                    targetDecision: 'keep_blocked',
                                                    loading: false
                                                })}
                                                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition border border-red-200"
                                            >
                                                Keep Account Blocked
                                            </button>
                                            <button
                                                onClick={() => setDecisionModal({
                                                    isOpen: true,
                                                    appeal: activeAppeal,
                                                    targetDecision: 'unblock',
                                                    loading: false
                                                })}
                                                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-200"
                                            >
                                                <CheckCircle2 size={14} />
                                                <span>Unblock Account</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-indigo-900 space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider block text-indigo-700">Audit Record</span>
                                        <p className="text-xs font-semibold">
                                            This appeal was resolved as <strong>{activeAppeal.decision === 'unblocked' ? 'UNBLOCKED' : 'BLOCK MAINTAINED'}</strong> by <strong>{activeAppeal.reviewedByName || 'Admin'}</strong> on {formatDateTime(activeAppeal.reviewedAt)}.
                                        </p>
                                        {activeAppeal.adminNotes && (
                                            <p className="text-xs text-gray-600 italic mt-1">"{activeAppeal.adminNotes}"</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Decision Confirmation Modal */}
            {decisionModal.isOpen && decisionModal.appeal && (
                <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                decisionModal.targetDecision === 'unblock' 
                                    ? 'bg-emerald-50 text-emerald-600' 
                                    : 'bg-red-50 text-red-600'
                            }`}>
                                {decisionModal.targetDecision === 'unblock' ? <CheckCircle2 size={24} /> : <Ban size={24} />}
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-gray-900">
                                    {decisionModal.targetDecision === 'unblock' ? 'Unblock this account?' : 'Keep this account blocked?'}
                                </h4>
                                <p className="text-xs text-gray-500 font-bold">
                                    Citizen: {decisionModal.appeal.userName || decisionModal.appeal.email}
                                </p>
                            </div>
                        </div>

                        <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                            decisionModal.targetDecision === 'unblock'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                : 'bg-red-50 text-red-800 border border-red-100'
                        }`}>
                            {decisionModal.targetDecision === 'unblock' ? (
                                <p>
                                    This citizen's account will be restored to <strong>ACTIVE</strong> standing and they will be able to log in immediately. A confirmation notification will be sent.
                                </p>
                            ) : (
                                <p>
                                    The account will remain <strong>BLOCKED</strong>. The appeal request will be archived as resolved with the restriction confirmed.
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setDecisionModal({ isOpen: false, appeal: null, targetDecision: null, loading: false })}
                                disabled={decisionModal.loading}
                                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExecuteDecision}
                                disabled={decisionModal.loading}
                                className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5 ${
                                    decisionModal.targetDecision === 'unblock'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                        : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                                }`}
                            >
                                {decisionModal.loading ? 'Saving...' : (decisionModal.targetDecision === 'unblock' ? 'Confirm Unblock' : 'Confirm Keep Blocked')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Profile Modal when clicking View User */}
            {selectedUserId && (
                <UserDetailsModal
                    isOpen={!!selectedUserId}
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                    onUserStatusUpdated={() => fetchAppeals()}
                />
            )}
        </div>
    );
};

export default AdminAppeals;
