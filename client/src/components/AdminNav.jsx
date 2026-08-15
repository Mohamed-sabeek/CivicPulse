import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserX, Flag, Users, History } from 'lucide-react';
import api from '../utils/api';

const AdminNav = ({ counts }) => {
    const location = useLocation();
    const [fetchedCounts, setFetchedCounts] = useState({
        appeals: 0,
        reports: 0,
        citizens: 0,
        history: 0
    });

    useEffect(() => {
        // If counts prop is not fully provided, fetch from admin stats endpoint
        if (!counts || counts.appeals === undefined || counts.reports === undefined) {
            let isMounted = true;
            api.get('/admin/stats')
                .then(res => {
                    if (isMounted && res.data) {
                        setFetchedCounts({
                            appeals: res.data.pendingAppeals || 0,
                            reports: res.data.pendingReports || 0,
                            citizens: res.data.totalCitizens !== undefined ? res.data.totalCitizens : (res.data.totalUsers || 0),
                            history: res.data.totalIssues || 0
                        });
                    }
                })
                .catch(err => {
                    console.error('Failed to fetch admin nav badge counts:', err);
                });
            return () => { isMounted = false; };
        }
    }, [counts]);

    const activeCounts = {
        appeals: counts?.appeals !== undefined ? counts.appeals : fetchedCounts.appeals,
        reports: counts?.reports !== undefined ? counts.reports : fetchedCounts.reports,
        citizens: counts?.citizens !== undefined ? counts.citizens : fetchedCounts.citizens,
        history: counts?.history !== undefined ? counts.history : fetchedCounts.history
    };

    const navItems = [
        {
            to: '/admin',
            label: 'Dashboard',
            icon: LayoutDashboard,
            exact: true
        },
        {
            to: '/admin/appeals',
            label: 'Appeals',
            icon: UserX,
            count: activeCounts.appeals,
            countType: 'alert'
        },
        {
            to: '/admin/reports',
            label: 'Reports',
            icon: Flag,
            count: activeCounts.reports,
            countType: 'alert'
        },
        {
            to: '/admin/users',
            label: 'Citizens',
            icon: Users,
            count: activeCounts.citizens,
            countType: 'neutral'
        },
        {
            to: '/admin/history',
            label: 'Issue History',
            icon: History,
            count: activeCounts.history,
            countType: 'neutral'
        }
    ];

    const isItemActive = (item) => {
        if (item.exact) {
            return location.pathname === item.to;
        }
        return location.pathname.startsWith(item.to);
    };

    return (
        <nav 
            className="flex items-center gap-1.5 sm:gap-2 flex-nowrap shrink-0 overflow-x-auto max-w-full pb-1 sm:pb-0" 
            aria-label="Admin Section Navigation"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {navItems.map((item) => {
                const active = isItemActive(item);
                const IconComponent = item.icon;
                const showCount = item.count !== undefined && item.count !== null;

                return (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={`h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 sm:gap-2 shrink-0 border active:scale-95 shadow-2xs ${
                            active
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200 scale-[1.02]'
                                : 'bg-white text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50 border-gray-200 hover:border-indigo-200'
                        }`}
                    >
                        <IconComponent 
                            size={15} 
                            className={`shrink-0 ${active ? 'text-white' : 'text-gray-500'}`} 
                        />
                        <span className="whitespace-nowrap">{item.label}</span>

                        {showCount && (
                            <span 
                                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0 transition-colors leading-none ${
                                    active
                                        ? 'bg-white/20 text-white'
                                        : item.countType === 'alert' && item.count > 0
                                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                                            : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                {item.count}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
};

export default AdminNav;
