import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
    Flag, ShieldAlert, Check, X, Search, ChevronLeft, 
    Calendar, MapPin, User, MessageSquare, AlertCircle, 
    CheckCircle2, ArrowRight, Sparkles, Filter, ChevronRight,
    Users, History, LayoutDashboard, Shield
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AdminSkeleton from '../components/AdminSkeleton';
import api from '../utils/api';

const AdminReports = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const initialStatus = searchParams.get('status') || 'pending';
    const focusReportId = searchParams.get('reportId');

    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, dismissed: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortOption, setSortOption] = useState('newest');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1, totalReports: 0 });

    // Confirmation Modal State (Dismiss / Resolve)
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        report: null,
        targetStatus: null, // 'dismissed' | 'resolved'
        loading: false
    });

    // Detailed Inspection Modal State
    const [inspectReport, setInspectReport] = useState(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                status: statusFilter,
                search: debouncedSearch,
                sort: sortOption,
                page,
                limit: 10
            };
            const res = await api.get('/admin/comment-reports', { params });
            setReports(res.data.reports || []);
            setStats(res.data.stats || { total: 0, pending: 0, resolved: 0, dismissed: 0 });
            setPagination(res.data.pagination || { totalPages: 1, totalReports: 0 });

            // If focusReportId is provided in URL, auto-select it for inspection
            if (focusReportId && res.data.reports) {
                const found = res.data.reports.find(r => r._id === focusReportId);
                if (found) {
                    setInspectReport(found);
                }
            }
        } catch (err) {
            console.error('Error fetching admin comment reports:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [statusFilter, debouncedSearch, sortOption, page, focusReportId, navigate]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        setPage(1);
        setSearchParams({ status: newStatus });
    };

    const handleConfirmModerationAction = async () => {
        if (!confirmModal.report || !confirmModal.targetStatus) return;
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
            await api.patch(`/admin/comment-reports/${confirmModal.report._id}/status`, {
                status: confirmModal.targetStatus
            });
            setConfirmModal({
                isOpen: false,
                report: null,
                targetStatus: null,
                loading: false
            });
            if (inspectReport && inspectReport._id === confirmModal.report._id) {
                setInspectReport(prev => ({ ...prev, status: confirmModal.targetStatus }));
            }
            fetchReports();
        } catch (err) {
            console.error('Failed to moderate report:', err);
            alert(err.response?.data?.msg || 'Failed to update report status.');
            setConfirmModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleNavigateToIssue = (issueId) => {
        if (!issueId) return;
        navigate(`/admin/issues/${issueId}`);
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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'resolved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check size={12} className="text-emerald-600" /> 🟢 RESOLVED
                    </span>
                );
            case 'dismissed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                        ⚪ DISMISSED
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                        🟡 PENDING REVIEW
                    </span>
                );
        }
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
                                    <ShieldAlert size={13} className="text-red-600" /> Moderation Hub
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                                Comment Reports
                            </h1>
                            <p className="text-gray-500 mt-1 font-medium text-sm">
                                Review and manage reports submitted by citizens.
                            </p>
                        </div>

                        {/* Top Navigation Links */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <Link
                                to="/admin"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-800 hover:text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            >
                                <LayoutDashboard size={15} className="text-indigo-600" />
                                <span>Dashboard</span>
                            </Link>
                            <Link
                                to="/admin/appeals"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 text-gray-800 hover:text-amber-700 rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            >
                                <Ban size={15} className="text-amber-600" />
                                <span>Appeals</span>
                            </Link>
                            <Link
                                to="/admin/users"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-800 hover:text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            >
                                <Users size={15} className="text-indigo-600" />
                                <span>Citizens</span>
                            </Link>
                            <Link
                                to="/admin/history"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-800 hover:text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            >
                                <History size={15} className="text-indigo-600" />
                                <span>Issue History</span>
                            </Link>
                        </div>
                    </div>

                    {/* Filter & Metric Cards Header */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
                        
                        {/* Status Filter Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                            {[
                                { id: 'pending', label: 'Pending Review', count: stats.pending, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                                { id: 'all', label: 'All Reports', count: stats.total, color: 'text-gray-700 bg-gray-50 border-gray-200' },
                                { id: 'resolved', label: 'Resolved', count: stats.resolved, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                                { id: 'dismissed', label: 'Dismissed', count: stats.dismissed, color: 'text-gray-600 bg-gray-100 border-gray-200' }
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
                                    placeholder="Search by reporter, author, comment, issue, or reason..."
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

                    {/* Report Cards Feed */}
                    {loading ? (
                        <AdminSkeleton />
                    ) : reports.length === 0 ? (
                        <div className="py-20 px-6 text-center bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
                            <div className="w-16 h-16 rounded-3xl bg-gray-50 text-gray-400 mx-auto flex items-center justify-center">
                                <Flag size={32} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">No Reports Found</h3>
                            <p className="text-xs text-gray-400 max-w-md mx-auto">
                                {statusFilter === 'pending'
                                    ? 'Great news! There are currently no pending comment reports requiring administrator attention.'
                                    : 'No comment reports match your active search and filter criteria.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reports.map((rep) => (
                                <div 
                                    key={rep._id}
                                    className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-200 hover:shadow-md ${
                                        rep.status === 'pending'
                                            ? 'border-amber-200 shadow-xs'
                                            : 'border-gray-100'
                                    }`}
                                >
                                    {/* Top Row: Reporter & Comment Author + Status Badge */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex items-center gap-1.5 text-xs font-black text-red-600 bg-red-50 px-3 py-1 rounded-xl border border-red-100">
                                                <Flag size={12} />
                                                <span>Reported by: {rep.reportedByName || rep.reportedBy?.name || 'Citizen'}</span>
                                            </div>
                                            <span className="text-gray-300">•</span>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-50 px-3 py-1 rounded-xl border border-gray-200">
                                                <User size={12} className="text-gray-400" />
                                                <span>Comment Author: {rep.reportedCommentAuthorName || rep.reportedCommentAuthorId?.name || 'Citizen'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(rep.status)}
                                            <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                                                <Calendar size={12} />
                                                {formatDateTime(rep.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Middle Section: Quoted Comment + Reason + Issue Metadata */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 py-4 items-start">
                                        
                                        {/* Reported Comment Box (7 cols) */}
                                        <div className="lg:col-span-7 space-y-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                                                Reported Comment Content
                                            </span>
                                            <div className="bg-red-50/40 border border-red-100 rounded-2xl p-4">
                                                <p className="text-xs sm:text-sm text-gray-800 font-medium italic leading-relaxed whitespace-pre-line">
                                                    "{rep.commentText}"
                                                </p>
                                            </div>
                                        </div>

                                        {/* Report Reason, Details & Issue (5 cols) */}
                                        <div className="lg:col-span-5 space-y-2.5 bg-gray-50/80 p-4 rounded-2xl border border-gray-100 text-xs">
                                            <div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                                                    Violation Reason
                                                </span>
                                                <p className="font-black text-red-600 mt-0.5">
                                                    {rep.reason}
                                                </p>
                                            </div>

                                            {rep.details && (
                                                <div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                                                        Citizen Explanation
                                                    </span>
                                                    <p className="text-gray-700 font-medium mt-0.5 italic">
                                                        "{rep.details}"
                                                    </p>
                                                </div>
                                            )}

                                            <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                                                        Related Issue
                                                    </span>
                                                    <p className="font-bold text-gray-900 mt-0.5 truncate max-w-[200px]">
                                                        {rep.issueTitle}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleNavigateToIssue(rep.issueId)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
                                                >
                                                    <span>View Issue</span>
                                                    <ArrowRight size={12} />
                                                </button>
                                            </div>

                                            {/* Moderation Audit Info if finalized */}
                                            {rep.status !== 'pending' && rep.moderatedByName && (
                                                <div className="pt-2 border-t border-gray-200/60 text-[10px] text-gray-500">
                                                    <span className="font-bold">Moderated by:</span> {rep.moderatedByName} on {formatDateTime(rep.moderatedAt)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom Actions Row */}
                                    <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <button
                                            onClick={() => setInspectReport(rep)}
                                            className="text-xs font-bold text-gray-600 hover:text-indigo-600 flex items-center gap-1"
                                        >
                                            <span>Inspect Report Details</span>
                                            <ChevronRight size={13} />
                                        </button>

                                        {/* Action buttons strictly available for PENDING reports only */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleNavigateToIssue(rep.issueId)}
                                                className="px-3.5 py-2 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-xs font-bold rounded-xl transition border border-gray-200 shadow-2xs"
                                            >
                                                View Issue
                                            </button>

                                            {rep.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => setConfirmModal({
                                                            isOpen: true,
                                                            report: rep,
                                                            targetStatus: 'dismissed',
                                                            loading: false
                                                        })}
                                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition shadow-2xs active:scale-95"
                                                    >
                                                        Dismiss
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmModal({
                                                            isOpen: true,
                                                            report: rep,
                                                            targetStatus: 'resolved',
                                                            loading: false
                                                        })}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-100 active:scale-95"
                                                    >
                                                        <Check size={14} />
                                                        <span>Resolve</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Pagination Controls */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between pt-6">
                                    <p className="text-xs font-bold text-gray-500">
                                        Page {page} of {pagination.totalPages} ({pagination.totalReports} total reports)
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

            {/* Footer */}
            <Footer />

            {/* Confirmation Modal (Dismiss / Resolve) */}
            {confirmModal.isOpen && confirmModal.report && (
                <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                confirmModal.targetStatus === 'resolved' 
                                    ? 'bg-emerald-50 text-emerald-600' 
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                                {confirmModal.targetStatus === 'resolved' ? <Check size={24} /> : <X size={24} />}
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-gray-900">
                                    {confirmModal.targetStatus === 'resolved' ? 'Resolve this report?' : 'Dismiss this report?'}
                                </h4>
                                <p className="text-xs text-gray-500 font-bold">This moderation decision will be final.</p>
                            </div>
                        </div>

                        {confirmModal.report.commentText && (
                            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/70 text-xs">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Reported Comment:</span>
                                <p className="italic text-gray-700">"{confirmModal.report.commentText}"</p>
                            </div>
                        )}

                        <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                            confirmModal.targetStatus === 'resolved'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}>
                            {confirmModal.targetStatus === 'resolved' ? (
                                <p>
                                    Marking this report as <strong>RESOLVED</strong> will send a resolution notification directly to the reporting citizen (<strong>{confirmModal.report.reportedByName || 'Citizen'}</strong>). The decision is permanent.
                                </p>
                            ) : (
                                <p>
                                    Marking this report as <strong>DISMISSED</strong> will archive the report with no notification sent to the reporter. The decision is permanent.
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setConfirmModal({ isOpen: false, report: null, targetStatus: null, loading: false })}
                                disabled={confirmModal.loading}
                                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmModerationAction}
                                disabled={confirmModal.loading}
                                className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5 ${
                                    confirmModal.targetStatus === 'resolved'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                        : 'bg-gray-800 hover:bg-gray-900 shadow-gray-200'
                                }`}
                            >
                                {confirmModal.loading ? 'Saving...' : (confirmModal.targetStatus === 'resolved' ? 'Confirm Resolve' : 'Confirm Dismiss')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Inspection Modal */}
            {inspectReport && (
                <div 
                    className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => setInspectReport(null)}
                >
                    <div 
                        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Shield size={22} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Report Inspection & Audit</h3>
                                    <p className="text-xs text-gray-500 font-medium">Complete record of the reported content and context</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setInspectReport(null)}
                                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Current Status</span>
                                    <div className="mt-1">{getStatusBadge(inspectReport.status)}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Submitted Date</span>
                                    <p className="font-bold text-gray-700 mt-1">{formatDateTime(inspectReport.createdAt)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Reporter</span>
                                    <p className="font-bold text-gray-900 text-sm mt-0.5">{inspectReport.reportedByName || 'Citizen'}</p>
                                    <p className="text-[11px] text-gray-500">{inspectReport.reportedBy?.email || 'Registered Citizen'}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Comment Author</span>
                                    <p className="font-bold text-gray-900 text-sm mt-0.5">{inspectReport.reportedCommentAuthorName || 'Citizen'}</p>
                                    <p className="text-[11px] text-gray-500">{inspectReport.reportedCommentAuthorId?.email || 'Registered Citizen'}</p>
                                </div>
                            </div>

                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Reported Comment Text</span>
                                <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4">
                                    <p className="text-sm text-gray-900 font-medium italic whitespace-pre-line">
                                        "{inspectReport.commentText}"
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Report Reason</span>
                                    <p className="font-black text-red-600 text-sm mt-0.5">{inspectReport.reason}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Associated Issue</span>
                                    <p className="font-bold text-gray-900 text-sm mt-0.5 truncate">{inspectReport.issueTitle}</p>
                                </div>
                            </div>

                            {inspectReport.details && (
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Additional Reporter Notes</span>
                                    <p className="text-gray-700 font-medium mt-1 leading-relaxed">{inspectReport.details}</p>
                                </div>
                            )}

                            {inspectReport.status !== 'pending' && inspectReport.moderatedByName && (
                                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-indigo-900 space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider block text-indigo-700">Audit Resolution Record</span>
                                    <p className="text-xs font-semibold">
                                        This report was marked as <strong>{inspectReport.status.toUpperCase()}</strong> by <strong>{inspectReport.moderatedByName}</strong> on {formatDateTime(inspectReport.moderatedAt)}.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <button
                                onClick={() => handleNavigateToIssue(inspectReport.issueId)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-xs font-bold rounded-xl transition border border-gray-200"
                            >
                                <span>View Issue Page</span>
                                <ArrowRight size={13} />
                            </button>

                            <div className="flex items-center gap-2">
                                {inspectReport.status === 'pending' ? (
                                    <>
                                        <button
                                            onClick={() => setConfirmModal({
                                                isOpen: true,
                                                report: inspectReport,
                                                targetStatus: 'dismissed',
                                                loading: false
                                            })}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                                        >
                                            Dismiss
                                        </button>
                                        <button
                                            onClick={() => setConfirmModal({
                                                isOpen: true,
                                                report: inspectReport,
                                                targetStatus: 'resolved',
                                                loading: false
                                            })}
                                            className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-100"
                                        >
                                            <Check size={14} />
                                            <span>Resolve</span>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setInspectReport(null)}
                                        className="px-5 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition"
                                    >
                                        Done
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReports;
