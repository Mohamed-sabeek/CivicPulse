import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Bell, CheckCheck, MapPin, Tag, Clock, AlertCircle, 
    Sparkles, Inbox, Activity, CheckCircle2, Flag, ShieldAlert 
} from 'lucide-react';
import api from '../utils/api';

const getUserFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload).user;
    } catch {
        return null;
    }
};

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

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err) {
            // Silently fail if unauthorized
            if (err.response?.status !== 401 && err.response?.status !== 403) {
                console.error('Failed to fetch notifications:', err);
            }
        }
    }, []);

    // Initial fetch & polling every 8 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 8000);

        const handleFocus = () => fetchNotifications();
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchNotifications]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleMarkAllAsRead = async (e) => {
        e.stopPropagation();
        if (unreadCount === 0 || loading) return;
        setLoading(true);
        try {
            await api.put('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notif) => {
        // Mark as read in backend if not already read
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

        setIsOpen(false);

        // Navigate to appropriate page (Admin gets admin reports or admin issue details or appeals, Citizen gets citizen details)
        const user = getUserFromToken();
        if (user?.role === 'admin') {
            if (notif.type === 'ACCOUNT_BLOCK_APPEAL') {
                navigate(notif.supportRequestId ? `/admin/appeals?appealId=${notif.supportRequestId}` : '/admin/appeals');
            } else if (notif.type === 'NEW_COMMENT_REPORT' || notif.type === 'COMMENT_REPORT' || notif.type === 'comment_reported') {
                navigate(notif.reportId ? `/admin/reports?reportId=${notif.reportId}` : '/admin/reports');
            } else if (notif.issueId) {
                navigate(`/admin/issues/${notif.issueId}`);
            }
        } else {
            if (notif.issueId) {
                navigate(`/issues/${notif.issueId}`);
            }
        }
    };

    const getNotificationStyle = (notif) => {
        if (notif.type === 'REPORT_RESOLVED' || notif.newStatus === 'Resolved' || notif.type === 'ISSUE_RESOLVED' || (notif.type === 'APPEAL_RESOLVED' && notif.title?.includes('Restored'))) {
            return {
                icon: CheckCircle2,
                iconBg: notif.isRead ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-600 text-white shadow-emerald-200',
                border: notif.isRead ? 'border-transparent' : 'border-emerald-500 bg-emerald-50/40',
                titleColor: 'text-emerald-700'
            };
        }
        if (notif.type === 'ACCOUNT_BLOCK_APPEAL') {
            return {
                icon: Flag,
                iconBg: notif.isRead ? 'bg-amber-100 text-amber-700' : 'bg-amber-600 text-white shadow-amber-200',
                border: notif.isRead ? 'border-transparent' : 'border-amber-500 bg-amber-50/40',
                titleColor: 'text-amber-800'
            };
        }
        if (notif.type === 'NEW_COMMENT_REPORT' || notif.type === 'COMMENT_REPORT' || notif.type === 'comment_reported') {
            return {
                icon: ShieldAlert,
                iconBg: notif.isRead ? 'bg-red-100 text-red-600' : 'bg-red-600 text-white shadow-red-200',
                border: notif.isRead ? 'border-transparent' : 'border-red-500 bg-red-50/40',
                titleColor: 'text-red-700'
            };
        }
        if (notif.newStatus === 'In Progress' || notif.type === 'ISSUE_IN_PROGRESS') {
            return {
                icon: Activity,
                iconBg: notif.isRead ? 'bg-blue-100 text-blue-600' : 'bg-blue-600 text-white shadow-blue-200',
                border: notif.isRead ? 'border-transparent' : 'border-blue-500 bg-blue-50/40',
                titleColor: 'text-blue-700'
            };
        }
        return {
            icon: AlertCircle,
            iconBg: notif.isRead ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-600 text-white shadow-indigo-200',
            border: notif.isRead ? 'border-transparent' : 'border-indigo-600 bg-indigo-50/50',
            titleColor: 'text-indigo-600'
        };
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            {/* Bell Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all duration-300 active:scale-95 flex items-center justify-center ${
                    isOpen
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                        : 'bg-white border border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 shadow-sm'
                }`}
                aria-label="Notifications"
                title="Notifications"
            >
                <Bell size={19} className={unreadCount > 0 ? 'animate-wiggle' : ''} />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-[20px] px-1 bg-red-500 text-white text-[11px] font-black rounded-full shadow-md border-2 border-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-84 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Panel Header */}
                    <div className="px-5 py-4 bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/10 rounded-lg">
                                <Bell size={16} className="text-blue-300" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </h3>
                            </div>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                disabled={loading}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                title="Mark all as read"
                            >
                                <CheckCheck size={13} />
                                <span>Mark read</span>
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                            <div className="py-12 px-6 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 mx-auto flex items-center justify-center mb-3">
                                    <Inbox size={24} />
                                </div>
                                <p className="text-sm font-bold text-gray-700">No notifications yet</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    You will be alerted whenever the status of your reported issues or reports change.
                                </p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const style = getNotificationStyle(notif);
                                const IconComponent = style.icon;

                                return (
                                    <div
                                        key={notif._id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-4 cursor-pointer transition-all duration-200 flex items-start gap-3 relative group border-l-4 ${style.border} ${
                                            notif.isRead ? 'bg-white hover:bg-gray-50' : 'hover:opacity-95'
                                        }`}
                                    >
                                        {/* Icon */}
                                        <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${style.iconBg}`}>
                                            <IconComponent size={16} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${style.titleColor}`}>
                                                    <Sparkles size={11} /> {notif.title}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 flex-shrink-0">
                                                    <Clock size={10} /> {timeAgo(notif.createdAt)}
                                                </span>
                                            </div>

                                            {/* Notification Message */}
                                            <p className="text-xs font-medium text-gray-700 leading-relaxed mt-1">
                                                {notif.message}
                                            </p>

                                            {/* Metadata Tags */}
                                            <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                                {notif.category && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] font-bold text-gray-600 shadow-2xs">
                                                        <Tag size={10} className="text-indigo-500" />
                                                        {notif.category}
                                                    </span>
                                                )}
                                                {notif.location && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 font-medium truncate max-w-[140px]">
                                                        <MapPin size={10} className="text-red-500 flex-shrink-0" />
                                                        <span className="truncate">{notif.location}</span>
                                                    </span>
                                                )}
                                                {notif.newStatus && (
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                                        notif.newStatus === 'Resolved' 
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}>
                                                        {notif.newStatus}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Unread indicator dot */}
                                        {!notif.isRead && (
                                            <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0 animate-pulse" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-center">
                        <span className="text-[11px] text-gray-400 font-semibold">
                            Click any notification to review details
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
