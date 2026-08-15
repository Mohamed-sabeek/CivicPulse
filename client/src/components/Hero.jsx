import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Hero = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const handleReportIssue = () => {
        if (token) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };
    return (
        <div className="relative bg-white overflow-hidden pt-12">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -right-24 w-[40rem] h-[40rem] bg-indigo-50/50 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 -left-24 w-[30rem] h-[30rem] bg-blue-50/50 rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 sm:pt-40 sm:pb-32">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">Community Driven Platform</span>
                    </div>
                    
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        Empowering Citizens to <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Fix Their City</span>
                    </h1>
                    
                    <p className="mt-4 text-xl md:text-2xl text-gray-500 mb-12 max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        Report neighborhood issues, vote on priorities, and work together with local officials to build a better community for everyone.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
                        <button
                            onClick={handleReportIssue}
                            className="px-10 py-5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center font-black text-lg uppercase tracking-widest active:scale-95"
                        >
                            Start Reporting
                            <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                        <Link to="/issues" className="px-10 py-5 bg-white text-gray-900 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all shadow-lg flex items-center justify-center font-black text-lg uppercase tracking-widest active:scale-95">
                            Browse Feed
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
