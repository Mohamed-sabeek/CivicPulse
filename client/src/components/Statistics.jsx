import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const Statistics = () => {
    const [stats, setStats] = useState({
        totalIssues: 0,
        resolvedIssues: 0,
        activeUsers: 0,
        topCategory: 'Loading...'
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/stats');
                setStats(res.data);
            } catch (err) {
                console.error('Error fetching stats:', err);
            }
        };
        fetchStats();
    }, []);

    const statItems = [
        { label: 'Issues Reported', value: stats.totalIssues },
        { label: 'Issues Resolved', value: stats.resolvedIssues },
        { label: 'Active Citizens', value: stats.activeUsers },
        { label: 'Top Category', value: stats.topCategory },
    ];

    return (
        <section className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-indigo-600">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-600 opacity-90" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                    {statItems.map((stat, index) => (
                        <div key={index} className="group p-6 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${index * 100}ms` }}>
                            <div className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight group-hover:scale-110 transition-transform duration-500">
                                {stat.value}
                            </div>
                            <div className="text-indigo-100 font-bold text-xs uppercase tracking-[0.2em] opacity-80">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Statistics;

