import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { Users, FileText, CheckCircle, AlertCircle, TrendingUp, Trash2, Edit, ArrowRight } from 'lucide-react';

const AdminDashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalIssues: 0,
        openIssues: 0,
        inProgressIssues: 0,
        resolvedIssues: 0
    });
    const [issues, setIssues] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdminAndFetchData = async () => {
            try {
                // Check User
                const userRes = await api.get('/auth/user');
                if (userRes.data.role !== 'admin') {
                    navigate('/dashboard');
                    return;
                }
                setUser(userRes.data);

                // Fetch Stats
                const statsRes = await api.get('/admin/stats');
                setStats(statsRes.data);

                // Fetch Issues
                const issuesRes = await api.get('/issues');
                setIssues(issuesRes.data);

            } catch (err) {
                console.error('Error fetching admin data:', err);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        checkAdminAndFetchData();
    }, [navigate]);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const res = await api.put(`/admin/issues/${id}/status`, { status: newStatus });
            setIssues(issues.map(issue => issue._id === id ? { ...issue, status: newStatus } : issue));

            // Refresh stats to ensure counts are accurate
            const statsRes = await api.get('/admin/stats');
            setStats(statsRes.data);
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) return;
        try {
            await api.delete(`/admin/issues/${id}`);
            setIssues(issues.filter(issue => issue._id !== id));

            // Refresh stats
            const statsRes = await api.get('/admin/stats');
            setStats(statsRes.data);
        } catch (err) {
            console.error('Error deleting issue:', err);
            alert('Failed to delete issue');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-green-100 text-green-800 border-green-200 shadow-sm';
            case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200 shadow-sm';
        }
    };

    // Analytics Data mapped from stats
    const analytics = [
        { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
        { title: 'Total Issues', value: stats.totalIssues, icon: FileText, color: 'bg-purple-500' },
        { title: 'Open Issues', value: stats.openIssues, icon: AlertCircle, color: 'bg-yellow-500' },
        { title: 'In Progress', value: stats.inProgressIssues || 0, icon: TrendingUp, color: 'bg-cyan-500' },
        { title: 'Resolved Issues', value: stats.resolvedIssues, icon: CheckCircle, color: 'bg-green-500' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600 mt-2">Manage users, issues, and system overview.</p>
                    </div>

                    {/* Analytics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                        {analytics.map((item, index) => (
                            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
                                <div className={`p-4 rounded-full ${item.color} bg-opacity-10 mr-4`}>
                                    <item.icon className={`h-8 w-8 ${item.color.replace('bg-', 'text-')}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{item.title}</p>
                                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Issues Management Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Issues Management</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {issues.filter(issue => issue.status !== 'Resolved').map((issue) => (
                                        <tr key={issue._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{issue.title}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{issue.category}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(issue.status)}`}>
                                                        {issue.status === 'Resolved' && <CheckCircle size={14} className="mr-1.5" />}
                                                        {issue.status === 'In Progress' && <TrendingUp size={14} className="mr-1.5" />}
                                                        {issue.status === 'Open' && <AlertCircle size={14} className="mr-1.5" />}
                                                        {issue.status.toUpperCase()}
                                                    </span>
                                                    
                                                    {issue.status === 'Open' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(issue._id, 'In Progress')}
                                                            className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg transition-all border border-blue-200 hover:border-blue-600 shadow-sm"
                                                        >
                                                            START PROGRESS <ArrowRight size={14} />
                                                        </button>
                                                    )}
                                                    
                                                    {issue.status === 'In Progress' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(issue._id, 'Resolved')}
                                                            className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg transition-all border border-emerald-200 hover:border-emerald-600 shadow-sm"
                                                        >
                                                            RESOLVE <CheckCircle size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(issue.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleDelete(issue._id)}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                    title="Delete Issue"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AdminDashboard;
