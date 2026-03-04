import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <span className="text-2xl font-bold text-primary mb-4 block">CivicPulse</span>
                        <p className="text-gray-500 mb-6">
                            Empowering communities to build better cities together through transparency and action.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <Twitter size={20} />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <Facebook size={20} />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <Instagram size={20} />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <Linkedin size={20} />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-6">Platform</h4>
                        <ul className="space-y-4 text-gray-600">
                            <li><a href="#" className="hover:text-primary">How it Works</a></li>
                            <li><a href="#" className="hover:text-primary">Browse Issues</a></li>
                            <li><a href="#" className="hover:text-primary">Community Guidelines</a></li>
                            <li><a href="#" className="hover:text-primary">Success Stories</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-6">Company</h4>
                        <ul className="space-y-4 text-gray-600">
                            <li><a href="#" className="hover:text-primary">About Us</a></li>
                            <li><a href="#" className="hover:text-primary">Careers</a></li>
                            <li><a href="#" className="hover:text-primary">Press</a></li>
                            <li><a href="#" className="hover:text-primary">Contact</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-6">Legal</h4>
                        <ul className="space-y-4 text-gray-600">
                            <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-primary">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-500 text-sm">
                        &copy; 2026 CivicPulse Inc. All rights reserved.
                    </p>
                    <p className="text-gray-500 text-sm flex items-center mt-4 md:mt-0">
                        Made with <Heart size={16} className="text-red-500 mx-1" fill="currentColor" /> for better cities.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
