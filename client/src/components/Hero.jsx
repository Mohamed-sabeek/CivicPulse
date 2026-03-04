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
        <div className="relative bg-white overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-blue-50 rounded-l-3xl transform translate-x-1/2 md:translate-x-0" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-24 sm:pb-32">
                <div className="text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
                        Empowering Citizens to <span className="text-primary">Fix Their City</span>
                    </h1>
                    <p className="mt-4 text-xl text-gray-600 mb-8">
                        Report issues. Vote priorities. Build better communities. Join the movement to make your city a better place to live, one issue at a time.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={handleReportIssue}
                            className="px-8 py-4 bg-primary text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center font-semibold text-lg"
                        >
                            Report an Issue
                            <ArrowRight className="ml-2" size={20} />
                        </button>
                        <Link to="/issues" className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl hover:border-primary hover:text-primary transition-all shadow-sm hover:shadow-md flex items-center justify-center font-semibold text-lg">
                            Browse Issues
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
