import React from 'react';
import { FileText, Users, CheckCircle } from 'lucide-react';

const HowItWorks = () => {
    const steps = [
        {
            icon: <FileText size={40} className="text-primary" />,
            title: 'Post an Issue',
            description: 'Snap a photo, add a description, and tag the location to report a problem in your neighborhood.',
        },
        {
            icon: <Users size={40} className="text-primary" />,
            title: 'Community Votes',
            description: 'Neighbors upvote and comment on issues to raise awareness and prioritize what matters most.',
        },
        {
            icon: <CheckCircle size={40} className="text-primary" />,
            title: 'Authorities Respond',
            description: 'City officials get notified, take action, and update the status of the issue to "Resolved".',
        },
    ];

    return (
        <section id="how-it-works" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
                    <p className="mt-4 text-xl text-gray-600">Three simple steps to make a difference.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 text-center">
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-blue-50 rounded-full">
                                    {step.icon}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
