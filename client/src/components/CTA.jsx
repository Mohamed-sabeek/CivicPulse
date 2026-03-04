import React from 'react';
import { Link } from 'react-router-dom';

const CTA = () => {
    return (
        <section className="bg-gray-900 py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                    Be the Voice of Your Community
                </h2>
                <p className="text-xl text-gray-400 mb-10">
                    Join thousands of citizens who are actively shaping their cities. It only takes a minute to make a difference.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/register" className="px-8 py-4 bg-primary text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-primary/50 font-semibold text-lg">
                        Get Started Today
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default CTA;
