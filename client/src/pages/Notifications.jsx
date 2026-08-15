import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Bell, CheckCheck, MapPin, Tag, Clock, AlertCircle, 
    Sparkles, Inbox, Activity, CheckCircle2, Flag, ShieldAlert,
    ChevronLeft, Check, ArrowRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';

const timeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return past.toLocaleDateString();
};

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'reports' | 'issues'
    const navigate = useNavigate();

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;
        try {
            await api.put('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            try {
                await api.put(`/notifications/${notif._id}/read`);
                setNotifications(prev =>
                    prev.map(n => (n._id === notif._id ? { ...n, isRead: true } : n))
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (err) {
                console.error('Failed to mark notification as read:', err);
            }
        }

        if (notif.issueId) {
            navigate(`/issues/${notif.issueId}`);
        }
    };

    const getNotificationStyle = (notif) => {
        if (notif.type === 'REPORT_RESOLVED' || notif.newStatus === 'Resolved' || notif.type === 'ISSUE_RESOLVED') {
            return {
                icon: CheckCircle2,
                iconBg: notif.isRead ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-600 text-white shadow-emerald-200',
                border: notif.isRead ? 'border-gray-200' : 'border-emerald-500 bg-emerald-50/40',
                titleColor: 'text-emerald-700'
            };
        }
        if (notif.type === 'NEW_COMMENT_REPORT' || notif.type === 'COMMENT_REPORT' || notif.type === 'comment_reported') {
            return {
                icon: ShieldAlert,
                iconBg: notif.isRead ? 'bg-red-100 text-red-600' : 'bg-red-600 text-white shadow-red-200',
                border: notif.isRead ? 'border-gray-200' : 'border-red-500 bg-red-50/40',
                titleColor: 'text-red-700'
            };
        }
        if (notif.newStatus === 'In Progress' || notif.type === 'ISSUE_IN_PROGRESS') {
            return {
                icon: Activity,
                iconBg: notif.isRead ? 'bg-blue-100 text-blue-600' : 'bg-blue-600 text-white shadow-blue-200',
                border: notif.isRead ? 'border-gray-200' : 'border-blue-500 bg-blue-50/40',
                titleColor: 'text-blue-700'
            };
        }
        return {
            icon: AlertCircle,
            iconBg: notif.isRead ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-600 text-white shadow-indigo-200',
            border: notif.isRead ? 'border-gray-200' : 'border-indigo-600 bg-indigo-50/50',
            titleColor: 'text-indigo-600'
        };
    };

    const filteredNotifications = notifications.filter(notif => {
        if (filter === 'unread') return !notif.isRead;
        if (filter === 'reports') return notif.type === 'REPORT_RESOLVED' || notif.type === 'NEW_COMMENT_REPORT';
        if (filter === 'issues') return notif.type === 'ISSUE_STATUS_UPDATE' || notif.type === 'ISSUE_IN_PROGRESS' || notif.type === 'ISSUE_RESOLVED' || notif.type === 'NEW_ISSUE';
        return true;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex flex-col pt-20 font-sans">
            <Navbar />

            <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    
                    {/* Header Banner */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                                    <Bell size={28} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                            Notifications
                                        </h1>
                                        {unreadCount > 0 && (
                                            <span className="px-2.5 py-0.5 bg-red-500 text-white text-xs font-black rounded-full shadow-xs">
                                                {unreadCount} Unread
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium mt-1">
                                        Status updates on your reported issues and moderation alerts
                                    </p>
                                </div>
                            </div>

                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition shadow-xs active:scale-95"
                                >
                                    <CheckCheck size={14} />
                                    <span>Mark all as read</span>
                                </button>
                            )}
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 pt-6 border-t border-gray-100 mt-6 overflow-x-auto">
                            {[
                                { id: 'all', label: 'All Notifications', count: notifications.length },
                                { id: 'unread', label: 'Unread', count: unreadCount },
                                { id: 'reports', label: 'Moderation & Reports' },
                                { id: 'issues', label: 'Issue Status Updates' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilter(tab.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                                        filter === tab.id
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                                            filter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notifications List Feed */}
                    <div className="space-y-3">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-xs font-bold text-gray-500">Loading notifications...</p>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="py-16 px-6 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 mx-auto flex items-center justify-center mb-3">
                                    <Inbox size={28} />
                                </div>
                                <h3 className="text-base font-black text-gray-800">No notifications found</h3>
                                <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                                    {filter === 'unread' 
                                        ? 'You have read all your notifications.' 
                                        : 'You will receive alerts here when the status of your reported issues or reports change.'}
                                </p>
                            </div>
                        ) : (
                            filteredNotifications.map((notif) => {
                                const style = getNotificationStyle(notif);
                                const IconComponent = style.icon;

                                return (
                                    <div
                                        key={notif._id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-5 rounded-3xl border transition-all duration-200 flex items-start gap-4 cursor-pointer hover:shadow-md ${
                                            notif.isRead 
                                                ? 'bg-white border-gray-100 hover:border-gray-200' 
                                                : 'bg-white border-indigo-200 shadow-xs'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${style.iconBg}`}>
                                            <IconComponent size={20} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-xs font-black uppercase tracking-wider ${style.titleColor}`}>
                                                        {notif.title}
                                                    </span>
                                                    {!notif.isRead && (
                                                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1 shrink-0">
                                                    <Clock size={11} /> {timeAgo(notif.createdAt)}
                                                </span>
                                            </div>

                                            <p className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed">
                                                {notif.message}
                                            </p>

                                            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-50">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {notif.issueTitle && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-100">
                                                            Issue: {notif.issueTitle}
                                                        </span>
                                                    )}
                                                    {notif.category && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                                                            <Tag size={11} /> {notif.category}
                                                        </span>
                                                    )}
                                                    {notif.location && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
                                                            <MapPin size={11} className="text-red-500" /> {notif.location}
                                                        </span>
                                                    )}
                                                </div>

                                                {notif.issueId && (
                                                    <div className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                                                        <span>View Issue Details</span>
                                                        <ArrowRight size={13} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Notifications;
