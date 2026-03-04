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
        <section className="bg-primary py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                    {statItems.map((stat, index) => (
                        <div key={index} className="p-4">
                            <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">
                                {stat.value}
                            </div>
                            <div className="text-blue-100 font-medium text-lg">
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

