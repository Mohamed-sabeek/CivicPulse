import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { 
    Users, FileText, CheckCircle, AlertCircle, Trash2, ArrowRight, 
    Activity, Calendar, History, ThumbsUp, MapPin, Eye, Sparkles 
} from 'lucide-react';
import AdminSkeleton from '../components/AdminSkeleton';
import StatusDropdown from '../components/StatusDropdown';
import IssueTimelineModal from '../components/IssueTimelineModal';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalIssues: 0,
        pendingIssues: 0,
        inProgressIssues: 0,
        resolvedIssues: 0
    });
    const [activeIssues, setActiveIssues] = useState([]);
    const [selectedTimelineIssueId, setSelectedTimelineIssueId] = useState(null);
    const navigate = useNavigate();

    const fetchDashboardData = useCallback(async () => {
        try {
            const res = await api.get('/admin/dashboard');
            setStats(res.data.stats || {
                totalUsers: 0,
                totalIssues: 0,
                pendingIssues: 0,
                inProgressIssues: 0,
                resolvedIssues: 0
            });
            setActiveIssues(res.data.activeIssues || []);
        } catch (err) {
            console.error('Error fetching admin dashboard data:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.put(`/admin/issues/${id}/status`, { status: newStatus });
            
            // If moved to Resolved, remove from active pipeline immediately
            if (newStatus === 'Resolved') {
                setActiveIssues(prev => prev.filter(issue => issue._id !== id));
            } else {
                setActiveIssues(prev =>
                    prev.map(issue => (issue._id === id ? { ...issue, status: newStatus } : issue))
                );
            }

            // Refresh stats to ensure counts remain 100% synchronized
            const statsRes = await api.get('/admin/stats');
            setStats(statsRes.data);
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this issue? All history records will also be removed.')) return;
        try {
            await api.delete(`/admin/issues/${id}`);
            setActiveIssues(prev => prev.filter(issue => issue._id !== id));

            // Refresh stats
            const statsRes = await api.get('/admin/stats');
            setStats(statsRes.data);
        } catch (err) {
            console.error('Error deleting issue:', err);
            alert('Failed to delete issue.');
        }
    };

    const analytics = [
        { 
            title: 'Total Citizens', 
            value: stats.totalCitizens !== undefined ? stats.totalCitizens : (stats.totalUsers || 0), 
            icon: Users, 
            lightColor: 'bg-indigo-50', 
            textColor: 'text-indigo-600',
            desc: 'Registered citizens',
            onClick: () => navigate('/admin/users')
        },
        { 
            title: 'Total Issues', 
            value: stats.totalIssues, 
            icon: FileText, 
            lightColor: 'bg-purple-50', 
            textColor: 'text-purple-600',
            desc: 'All community reports',
            onClick: () => navigate('/admin/history')
        },
        { 
            title: 'Pending Issues', 
            value: stats.pendingIssues || 0, 
            icon: AlertCircle, 
            lightColor: 'bg-amber-50', 
            textColor: 'text-amber-600',
            desc: 'Awaiting admin action'
        },
        { 
            title: 'In Progress', 
            value: stats.inProgressIssues || 0, 
            icon: Activity, 
            lightColor: 'bg-blue-50', 
            textColor: 'text-blue-600',
            desc: 'Currently being handled'
        },
        { 
            title: 'Resolved Issues', 
            value: stats.resolvedIssues || 0, 
            icon: CheckCircle, 
            lightColor: 'bg-emerald-50', 
            textColor: 'text-emerald-600',
            desc: 'Successfully fixed',
            onClick: () => navigate('/admin/history?status=Resolved')
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-24">
            <Navbar />

            <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live System
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                                Admin Control Center
                            </h1>
                            <p className="text-gray-500 mt-1 font-medium text-sm">
                                Monitor, manage, and resolve community-reported issues.
                            </p>
                        </div>

                        {/* Navigation actions */}
                        <div className="flex items-center gap-3">
                            <Link
                                to="/admin/users"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-800 hover:text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            >
                                <Users size={16} className="text-indigo-600" />
                                <span>Citizens</span>
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px]">
                                    {stats.totalCitizens !== undefined ? stats.totalCitizens : (stats.totalUsers || 0)}
                                </span>
                            </Link>
                            <Link
                                to="/admin/history"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-800 hover:text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            >
                                <History size={16} className="text-indigo-600" />
                                <span>Issue History</span>
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px]">
                                    {stats.totalIssues}
                                </span>
                            </Link>
                        </div>
                    </div>

                    {loading ? (
                        <AdminSkeleton />
                    ) : (
                        <>
                            {/* Dynamic Statistics Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
                                {analytics.map((item, index) => (
                                    <div 
                                        key={index} 
                                        onClick={item.onClick}
                                        className={`bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between ${item.onClick ? 'cursor-pointer hover:border-indigo-200 ring-indigo-500/10 hover:ring-4' : ''}`}
                                    >
                                        <div className="flex items-center justify-between gap-3 mb-4">
                                            <div className={`p-3.5 rounded-2xl ${item.lightColor}`}>
                                                <item.icon className={`h-6 w-6 ${item.textColor}`} />
                                            </div>
                                            <span className="text-3xl font-black text-gray-900 tracking-tight">
                                                {item.value}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900 uppercase tracking-wider">{item.title}</p>
                                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Active Issues Pipeline Table */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-12">
                                <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/60">
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                                            <Activity className="text-indigo-600" size={20} />
                                            Active Issues Pipeline
                                        </h2>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                                            Issues awaiting progression or currently in progress.
                                        </p>
                                    </div>
                                    <span className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-indigo-600 shadow-2xs">
                                        {activeIssues.length} Active Reports
                                    </span>
                                </div>

                                {activeIssues.length === 0 ? (
                                    <div className="text-center py-20 px-4">
                                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle size={32} />
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 mb-1">No pending or active issues</h3>
                                        <p className="text-xs text-gray-500 font-medium max-w-sm mx-auto">
                                            All community reports have been successfully resolved. Check Issue History to view completed records.
                                        </p>
                                        <Link
                                            to="/admin/history"
                                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95"
                                        >
                                            <History size={14} /> Open Issue History
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-100">
                                            <thead className="bg-white">
                                                <tr>
                                                    <th className="px-6 sm:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Issue</th>
                                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Action</th>
                                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Reported</th>
                                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Support</th>
                                                    <th className="px-6 sm:px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Management</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-50">
                                                {activeIssues.map((issue) => (
                                                    <tr key={issue._id} className="hover:bg-indigo-50/20 transition-colors group">
                                                        {/* Issue Col */}
                                                        <td className="px-6 sm:px-8 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3.5">
                                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                                                    {issue.imageUrl ? (
                                                                        <img src={issue.imageUrl} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                            <FileText size={18} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="max-w-[200px] sm:max-w-xs">
                                                                    <div className="text-xs font-black text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                                                        {issue.title}
                                                                    </div>
                                                                    <div className="text-[11px] text-gray-400 font-medium truncate flex items-center gap-1 mt-0.5">
                                                                        <MapPin size={11} className="text-red-400 flex-shrink-0" />
                                                                        <span className="truncate">{issue.location}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Category Col */}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2.5 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-lg border border-gray-100">
                                                                {issue.category}
                                                            </span>
                                                        </td>

                                                        {/* Custom Status Dropdown with Modal Confirmation */}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <StatusDropdown
                                                                currentStatus={issue.status}
                                                                issueTitle={issue.title}
                                                                onStatusChange={(newStatus) => handleStatusUpdate(issue._id, newStatus)}
                                                            />
                                                        </td>

                                                        {/* Reported Date */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                                                            <div className="flex items-center gap-1.5 text-[11px]">
                                                                <Calendar size={13} className="text-gray-300" />
                                                                {new Date(issue.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </td>

                                                        {/* Upvotes */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-700">
                                                            <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                                                <ThumbsUp size={12} />
                                                                <span>{issue.upvotes?.length || 0}</span>
                                                            </span>
                                                        </td>

                                                        {/* Management / Actions */}
                                                        <td className="px-6 sm:px-8 py-4 whitespace-nowrap text-right">
                                                            <div className="flex justify-end items-center gap-1.5">
                                                                <button
                                                                    onClick={() => setSelectedTimelineIssueId(issue._id)}
                                                                    className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all active:scale-95"
                                                                    title="View Audit Timeline"
                                                                >
                                                                    <Eye size={17} />
                                                                </button>
                                                                <button
                                                                    onClick={() => navigate(`/issues/${issue._id}`)}
                                                                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                                                                    title="View Issue Page"
                                                                >
                                                                    <ArrowRight size={17} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(issue._id)}
                                                                    className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all active:scale-90"
                                                                    title="Delete Permanently"
                                                                >
                                                                    <Trash2 size={17} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
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

export default AdminDashboard;
