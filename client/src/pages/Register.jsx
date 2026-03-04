import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, Loader } from 'lucide-react';
import api from '../utils/api';

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-100 opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-100 opacity-50 blur-3xl"></div>
            </div>

            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl z-10 border border-gray-100">
                <div className="text-center">
                    <Link to="/" className="text-3xl font-bold text-primary tracking-tighter hover:opacity-80 transition-opacity">
                        CivicPulse
                    </Link>
                    <h2 className="mt-6 text-2xl font-bold text-gray-900">
                        Create an account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Join your community and start making an impact today.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700 rounded-r-md animate-fade-in">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={18} className="text-gray-400" />
                                </div>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="appearance-none block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={onChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={onChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={onChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-400" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="appearance-none block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={onChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-lg hover:shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                            ) : (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    {/* Icon placeholder */}
                                </span>
                            )}
                            {loading ? 'Creating account...' : 'Register'}
                        </button>
                    </div>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">
                                Already have an account?
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <Link to="/login" className="font-medium text-primary hover:text-blue-700 flex items-center justify-center gap-1 transition-colors">
                            Sign in <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
