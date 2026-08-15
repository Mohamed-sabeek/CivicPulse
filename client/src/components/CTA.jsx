import React from 'react';
import { Link } from 'react-router-dom';

const CTA = () => {
    return (
        <section className="relative py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gray-900">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent" />
                <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-blue-500/10 to-transparent" />
            </div>
            
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-8 tracking-tight leading-tight">
                    Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Pulse</span> Your City?
                </h2>
                <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium">
                    Join thousands of active citizens who are transforming their neighborhoods. Your first report takes less than 60 seconds.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                    <Link to="/register" className="px-12 py-5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/20 font-black text-lg uppercase tracking-widest active:scale-95">
                        Get Started Free
                    </Link>
                    <Link to="/issues" className="px-12 py-5 bg-white/5 text-white border border-white/10 rounded-2xl hover:bg-white/10 transition-all font-black text-lg uppercase tracking-widest active:scale-95 backdrop-blur-sm">
                        View Feed
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default CTA;
