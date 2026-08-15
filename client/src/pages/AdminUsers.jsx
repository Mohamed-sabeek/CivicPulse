import React, { useState, useEffect, useCallback } from 'react';
import { 
    Users, UserCheck, FileText, Search, ArrowUpDown, ChevronLeft, 
    ChevronRight, Eye, Shield, Mail, Phone, Calendar, ArrowLeft,
    RotateCcw, AlertCircle, Ban, CheckCircle, UserX, AlertTriangle, Flag
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import UserDetailsModal from '../components/UserDetailsModal';
import AdminNav from '../components/AdminNav';
import api from '../utils/api';

const AdminUsers = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Read initial status filter from URL if present (e.g. /admin/users?status=blocked)
    const initialStatus = new URLSearchParams(location.search).get('status') || 'All';

    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        totalCitizens: 0,
        activeCitizens: 0,
        blockedCitizens: 0,
        usersWithReports: 0,
        totalIssuesReported: 0
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalUsers: 0,
        totalCitizens: 0,
        totalPages: 1
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [sortOption, setSortOption] = useState('recent');
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Block/Unblock Confirmation Modal state
    const [moderationModal, setModerationModal] = useState({
        isOpen: false,
        type: 'block', // 'block' or 'unblock'
        user: null,
        reason: '',
        loading: false
    });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                search: search.trim(),
                status: statusFilter,
                sort: sortOption
            });

            const res = await api.get(`/admin/users?${params.toString()}`);
            setUsers(res.data.users || []);
            setStats(res.data.stats || {
                totalCitizens: 0,
                activeCitizens: 0,
                blockedCitizens: 0,
                usersWithReports: 0,
                totalIssuesReported: 0
            });
            setPagination(res.data.pagination || {
                page: 1,
                limit: 10,
                totalUsers: 0,
                totalCitizens: 0,
                totalPages: 1
            });
        } catch (err) {
            console.error('Error fetching admin users:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/login');
            } else {
                setError('Failed to fetch citizen records. Please verify your connection.');
            }
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, statusFilter, sortOption, navigate]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSortChange = (e) => {
        setSortOption(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const openUserDetails = (userId) => {
        setSelectedUserId(userId);
        setModalOpen(true);
    };

    const openBlockModal = (user) => {
        setModerationModal({
            isOpen: true,
            type: 'block',
            user,
            reason: '',
            loading: false
        });
    };

    const openUnblockModal = (user) => {
        setModerationModal({
            isOpen: true,
            type: 'unblock',
            user,
            reason: '',
            loading: false
        });
    };

    const handleConfirmModeration = async () => {
        if (!moderationModal.user) return;
        setModerationModal(prev => ({ ...prev, loading: true }));
        try {
            if (moderationModal.type === 'block') {
                await api.patch(`/admin/users/${moderationModal.user._id}/block`, {
                    reason: moderationModal.reason.trim() || 'Violation of platform guidelines'
                });
            } else {
                await api.patch(`/admin/users/${moderationModal.user._id}/unblock`);
            }
            setModerationModal({ isOpen: false, type: 'block', user: null, reason: '', loading: false });
            fetchUsers();
        } catch (err) {
            console.error('Error modifying user standing:', err);
            alert(err.response?.data?.msg || 'Failed to update citizen account status.');
            setModerationModal(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex flex-col font-sans">
            <Navbar />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
                {/* Header Navigation Breadcrumb */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            <Link to="/admin" className="hover:text-indigo-600 transition flex items-center gap-1">
                                <ArrowLeft size={14} /> Admin Dashboard
                            </Link>
                            <span>/</span>
                            <span className="text-indigo-600">Citizen Management</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                            Citizen Management
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            View and manage registered CivicPulse citizens, activity history, and account moderation.
                        </p>
                    </div>

                    <AdminNav 
                        counts={{
                            appeals: undefined,
                            reports: undefined,
                            citizens: stats.totalCitizens,
                            history: undefined
                        }}
                    />
                </div>

                {/* 4 Summary Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    {/* Total Citizens */}
                    <div 
                        onClick={() => handleStatusFilter('All')}
                        className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                                <Users size={22} />
                            </div>
                            <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">Total</span>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Citizens</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">
                            {stats.totalCitizens !== undefined ? stats.totalCitizens : (stats.totalUsers || 0)}
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1">Registered citizen accounts</p>
                    </div>

                    {/* Active Citizens */}
                    <div 
                        onClick={() => handleStatusFilter('active')}
                        className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                                <UserCheck size={22} />
                            </div>
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Active</span>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Citizens</p>
                        <h3 className="text-3xl font-black text-emerald-600 mt-1">
                            {stats.activeCitizens !== undefined ? stats.activeCitizens : (stats.activeUsers || 0)}
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1">Unrestricted accounts</p>
                    </div>

                    {/* Blocked Citizens */}
                    <div 
                        onClick={() => handleStatusFilter('blocked')}
                        className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform">
                                <UserX size={22} />
                            </div>
                            <span className="text-[10px] font-black text-red-700 bg-red-50 px-2 py-0.5 rounded-md">Blocked</span>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Blocked Citizens</p>
                        <h3 className="text-3xl font-black text-red-600 mt-1">
                            {stats.blockedCitizens || 0}
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1">Restricted accounts</p>
                    </div>

                    {/* Total Issues */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                                <FileText size={22} />
                            </div>
                            <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Community</span>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Issues</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">
                            {stats.totalIssuesReported}
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1">Submitted across platform</p>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-8 space-y-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Search Input */}
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search citizens by name, email, or phone..."
                                value={search}
                                onChange={handleSearchChange}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                            />
                        </div>

                        {/* Status Filter Tabs & Sorting */}
                        <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-3">
                            <div className="flex items-center bg-gray-100 p-1 rounded-2xl">
                                {[
                                    { key: 'All', label: 'All Citizens' },
                                    { key: 'active', label: '🟢 Active' },
                                    { key: 'blocked', label: '🔴 Blocked' }
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleStatusFilter(tab.key)}
                                        className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                                            statusFilter.toLowerCase() === tab.key.toLowerCase()
                                                ? 'bg-white text-indigo-600 shadow-xs'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-2xl">
                                <ArrowUpDown size={14} className="text-gray-400" />
                                <span className="text-[10px] font-black text-gray-400 uppercase">Sort:</span>
                                <select
                                    value={sortOption}
                                    onChange={handleSortChange}
                                    className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
                                >
                                    <option value="recent">Recently Joined</option>
                                    <option value="most_active">Most Active (Reports)</option>
                                    <option value="oldest">Oldest Accounts</option>
                                    <option value="name">Name (A-Z)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Citizens Table / List */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-bold text-gray-500">Loading citizen records...</p>
                        </div>
                    ) : error ? (
                        <div className="py-16 text-center space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center">
                                <AlertCircle size={24} />
                            </div>
                            <p className="text-gray-700 font-bold">{error}</p>
                            <button
                                onClick={fetchUsers}
                                className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition"
                            >
                                Retry
                            </button>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="py-20 text-center space-y-3">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                                <Users size={28} />
                            </div>
                            <h4 className="text-lg font-black text-gray-900">No Citizens Found</h4>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                No registered citizens match your current search or filter criteria.
                            </p>
                            {(search || statusFilter !== 'All') && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setStatusFilter('All');
                                    }}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                                >
                                    <RotateCcw size={12} /> Clear Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                                            <th className="py-4 px-6">Citizen</th>
                                            <th className="py-4 px-6">Contact Info</th>
                                            <th className="py-4 px-6 text-center">Issues Reported</th>
                                            <th className="py-4 px-6 text-center">Account Status</th>
                                            <th className="py-4 px-6">Joined Date</th>
                                            <th className="py-4 px-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {users.map(u => {
                                            const isBlocked = u.status === 'blocked' || u.status === 'Suspended';
                                            return (
                                                <tr 
                                                    key={u._id} 
                                                    className="hover:bg-indigo-50/30 transition-colors group"
                                                >
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm shrink-0 ${
                                                                isBlocked
                                                                    ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-100'
                                                                    : 'bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-indigo-100'
                                                            }`}>
                                                                {u.name ? u.name.charAt(0).toUpperCase() : 'C'}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition">
                                                                        {u.name}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-gray-400 block sm:hidden">
                                                                    {u.email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                                                                <Mail size={13} className="text-gray-400" />
                                                                {u.email}
                                                            </div>
                                                            {u.phone && (
                                                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                                    <Phone size={13} className="text-gray-400" />
                                                                    {u.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-xl border border-indigo-100">
                                                                {u.issuesCount} {u.issuesCount === 1 ? 'Issue' : 'Issues'}
                                                            </span>
                                                            {u.issuesCount > 0 && (
                                                                <span className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                                    {u.resolvedCount} Resolved
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                                                            isBlocked
                                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${isBlocked ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                            {isBlocked ? 'Blocked' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-xs text-gray-500 font-medium">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar size={13} className="text-gray-400" />
                                                            {new Date(u.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => openUserDetails(u._id)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-xs font-black rounded-xl transition border border-gray-200 hover:border-indigo-200 shadow-2xs active:scale-95"
                                                            >
                                                                <Eye size={13} />
                                                                <span>View</span>
                                                            </button>

                                                            {isBlocked ? (
                                                                <button
                                                                    onClick={() => openUnblockModal(u)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black rounded-xl transition border border-emerald-200 shadow-2xs active:scale-95"
                                                                    title="Unblock account"
                                                                >
                                                                    <CheckCircle size={13} />
                                                                    <span>Unblock</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => openBlockModal(u)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black rounded-xl transition border border-red-200 shadow-2xs active:scale-95"
                                                                    title="Block account"
                                                                >
                                                                    <Ban size={13} />
                                                                    <span>Block</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <span className="text-xs font-bold text-gray-500">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.totalCitizens || pagination.totalUsers)} of {pagination.totalCitizens || pagination.totalUsers} registered citizens
                                </span>

                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={pagination.page <= 1}
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition shadow-2xs"
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                                        .map((p, idx, arr) => {
                                            const prevP = arr[idx - 1];
                                            return (
                                                <React.Fragment key={p}>
                                                    {prevP && p - prevP > 1 && (
                                                        <span className="px-2 text-xs text-gray-400 font-bold">...</span>
                                                    )}
                                                    <button
                                                        onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                                                        className={`w-8 h-8 rounded-xl text-xs font-black transition ${
                                                            pagination.page === p
                                                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                </React.Fragment>
                                            );
                                        })
                                    }

                                    <button
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition shadow-2xs"
                                        aria-label="Next page"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />

            {/* User Profile & Civic Activity Modal */}
            <UserDetailsModal
                userId={selectedUserId}
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedUserId(null);
                }}
                onUserStatusUpdated={fetchUsers}
            />

            {/* Block Confirmation Modal */}
            {moderationModal.isOpen && moderationModal.type === 'block' && (
                <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                                <Ban size={24} />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-gray-900">Block this account?</h4>
                                <p className="text-xs text-gray-500 font-bold">Citizen: {moderationModal.user?.name} ({moderationModal.user?.email})</p>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 leading-relaxed">
                            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <p>
                                This citizen will no longer be able to access or interact with CivicPulse. Their existing civic reports and activity history will be preserved.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                                Reason for blocking (optional):
                            </label>
                            <textarea
                                rows={3}
                                value={moderationModal.reason}
                                onChange={(e) => setModerationModal(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Repeated spam reports / abusive comments / misuse of platform..."
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setModerationModal({ isOpen: false, type: 'block', user: null, reason: '', loading: false })}
                                disabled={moderationModal.loading}
                                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmModeration}
                                disabled={moderationModal.loading}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-red-200 flex items-center gap-1.5"
                            >
                                {moderationModal.loading ? 'Blocking...' : 'Block Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unblock Confirmation Modal */}
            {moderationModal.isOpen && moderationModal.type === 'unblock' && (
                <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-gray-900">Unblock this account?</h4>
                                <p className="text-xs text-gray-500 font-bold">Citizen: {moderationModal.user?.name} ({moderationModal.user?.email})</p>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 leading-relaxed">
                            <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                            <p>
                                This citizen will regain access to CivicPulse and will be able to report and interact with civic issues again.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setModerationModal({ isOpen: false, type: 'unblock', user: null, reason: '', loading: false })}
                                disabled={moderationModal.loading}
                                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmModeration}
                                disabled={moderationModal.loading}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-emerald-200 flex items-center gap-1.5"
                            >
                                {moderationModal.loading ? 'Unblocking...' : 'Unblock Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
