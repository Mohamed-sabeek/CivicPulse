import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, Loader, Sparkles } from 'lucide-react';
import api from '../utils/api';
import Navbar from '../components/Navbar';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const { name, email, password, confirmPassword } = formData;

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/register', { name, email, password });
            localStorage.setItem('token', res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen max-h-screen bg-gray-50 flex flex-col overflow-hidden">
            <Navbar />
            
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-16 pb-4 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -left-40 w-[26rem] h-[26rem] rounded-full bg-indigo-100 opacity-40 blur-[100px]" />
                    <div className="absolute -bottom-40 -right-40 w-[26rem] h-[26rem] rounded-full bg-blue-100 opacity-40 blur-[100px]" />
                </div>

                <div className="max-w-lg w-full bg-white px-7 py-6 sm:px-8 sm:py-7 rounded-[2rem] shadow-xl z-10 border border-gray-100 relative my-auto">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl mb-3 shadow-sm">
                            <Sparkles size={24} />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                            Join CivicPulse
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500 font-medium">
                            Create an account to start reporting and tracking local issues.
                        </p>
                    </div>

                    <form className="mt-5 space-y-4" onSubmit={onSubmit}>
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 px-3.5 py-2 text-xs font-bold text-red-700 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                            <div>
                                <label htmlFor="name" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                                    Full Name
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        className="appearance-none block w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-gray-50 border border-gray-100 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={onChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="appearance-none block w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-gray-50 border border-gray-100 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={onChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                                    Create Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        className="appearance-none block w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-gray-50 border border-gray-100 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={onChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        className="appearance-none block w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-gray-50 border border-gray-100 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={onChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 sm:py-3.5 px-4 border border-transparent text-xs sm:text-sm font-black rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader className="animate-spin h-5 w-5 text-white" />
                            ) : (
                                <span className="flex items-center gap-2 uppercase tracking-widest">
                                    Create Account <ArrowRight size={16} />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-widest">Already a Member?</p>
                        <Link to="/login" className="inline-flex items-center gap-1.5 text-indigo-600 font-black hover:text-indigo-700 transition-colors uppercase tracking-widest text-[11px]">
                            Sign In to Pulse <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Register;
