import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
    Mail, Lock, ArrowRight, Loader, ShieldCheck, Ban, 
    MessageSquare, CheckCircle2, AlertCircle, X, Send, HelpCircle
} from 'lucide-react';
import api from '../utils/api';
import Navbar from '../components/Navbar';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isBlockedError, setIsBlockedError] = useState(false);
    const [loading, setLoading] = useState(false);

    // Support modal state
    const [supportModalOpen, setSupportModalOpen] = useState(false);
    const [supportFormData, setSupportFormData] = useState({
        email: '',
        subject: 'Request to review blocked account',
        message: ''
    });
    const [supportLoading, setSupportLoading] = useState(false);
    const [supportError, setSupportError] = useState('');
    const [supportSuccessData, setSupportSuccessData] = useState(null); // { referenceId, message }

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('blocked') === 'true') {
            setError('Your CivicPulse account has been blocked due to a violation of platform guidelines. Please contact the administrator if you believe this was a mistake.');
            setIsBlockedError(true);
        }
    }, [location]);

    const { email, password } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) {
            setError('');
            setIsBlockedError(false);
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setIsBlockedError(false);
        try {
            const res = await api.post('/auth/login', formData);
            const token = res.data.token;
            localStorage.setItem('token', token);

            let role = null;
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                role = JSON.parse(jsonPayload)?.user?.role;
            } catch (decodeErr) {
                console.error('Failed to decode token role', decodeErr);
            }

            navigate(role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            const msg = err.response?.data?.msg || 'Login failed. Please check your credentials.';
            const isBlocked = err.response?.data?.isBlocked || err.response?.status === 403 || msg.toLowerCase().includes('blocked');
            setError(msg);
            setIsBlockedError(!!isBlocked);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSupportModal = () => {
        setSupportFormData({
            email: formData.email.trim(),
            subject: 'Request to review blocked account',
            message: ''
        });
        setSupportError('');
        setSupportSuccessData(null);
        setSupportModalOpen(true);
    };

    const handleSupportSubmit = async (e) => {
        e.preventDefault();
        setSupportLoading(true);
        setSupportError('');
        try {
            const res = await api.post('/support/appeal', supportFormData);
            setSupportSuccessData({
                referenceId: res.data.referenceId || 'CP-REVIEW',
                message: res.data.message || 'Your appeal has been received. An administrator will review your account.'
            });
        } catch (err) {
            console.error('Error submitting support appeal:', err);
            setSupportError(err.response?.data?.msg || 'Failed to submit request. Please try again later.');
        } finally {
            setSupportLoading(false);
        }
    };

    return (
        <div className="h-screen max-h-screen bg-gray-50 flex flex-col overflow-hidden">
            <Navbar />
            
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-16 pb-4 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-[26rem] h-[26rem] rounded-full bg-indigo-100 opacity-40 blur-[100px]" />
                    <div className="absolute -bottom-40 -left-40 w-[26rem] h-[26rem] rounded-full bg-blue-100 opacity-40 blur-[100px]" />
                </div>

                <div className="max-w-md w-full bg-white px-7 py-6 sm:px-8 sm:py-7 rounded-[2rem] shadow-xl z-10 border border-gray-100 relative my-auto">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl mb-3 shadow-sm">
                            <ShieldCheck size={24} />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                            Welcome Back
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500 font-medium">
                            Join the movement to improve your neighborhood.
                        </p>
                    </div>

                    <form className="mt-5 space-y-4" onSubmit={onSubmit}>
                        {error && (
                            <div className={`p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 text-xs ${
                                isBlockedError 
                                    ? 'bg-red-50/90 border border-red-200 text-red-900 space-y-3' 
                                    : 'bg-red-50 border-l-4 border-red-500 py-2.5 px-3.5 font-bold text-red-700'
                            }`}>
                                <div className="flex items-start gap-2.5">
                                    {isBlockedError && <Ban size={18} className="text-red-600 shrink-0 mt-0.5" />}
                                    <p className="leading-relaxed font-semibold">{error}</p>
                                </div>

                                {isBlockedError && (
                                    <div className="pt-1">
                                        <button
                                            type="button"
                                            onClick={handleOpenSupportModal}
                                            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs transition shadow-sm shadow-red-200 active:scale-95"
                                        >
                                            <MessageSquare size={14} />
                                            <span>Contact Administrator</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3.5">
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
                                    Secret Password
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
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-200 rounded transition-all cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-500 font-bold cursor-pointer select-none">
                                    Keep me signed in
                                </label>
                            </div>

                            <a href="#" className="text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors">
                                Forgot Password?
                            </a>
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
                                    Start Pulse <ArrowRight size={16} />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-widest">New to CivicPulse?</p>
                        <Link to="/register" className="inline-flex items-center gap-1.5 text-indigo-600 font-black hover:text-indigo-700 transition-colors uppercase tracking-widest text-[11px]">
                            Create a Free Account <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </main>

            {/* Contact Administrator Appeal Modal */}
            {supportModalOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => setSupportModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150 relative"
                        onClick={e => e.stopPropagation()}
                    >
                        {supportSuccessData ? (
                            /* Submission Success View */
                            <div className="text-center py-4 space-y-5">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
                                    <CheckCircle2 size={36} />
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-xl font-black text-gray-900">Request Submitted Successfully</h3>
                                    <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto font-medium leading-relaxed">
                                        Your appeal request has been submitted successfully. Our team will review it.
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setSupportModalOpen(false);
                                        setSupportSuccessData(null);
                                    }}
                                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md active:scale-95"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            /* Appeal Form View */
                            <>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                                            <MessageSquare size={22} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900">Contact Administrator</h3>
                                            <p className="text-xs text-gray-500 font-medium">
                                                Explain your concern if you believe your account was blocked by mistake.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSupportModalOpen(false)}
                                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {supportError && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                                        <AlertCircle size={15} className="shrink-0" />
                                        <span>{supportError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSupportSubmit} className="space-y-3.5">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={supportFormData.email}
                                            onChange={(e) => setSupportFormData({ ...supportFormData, email: e.target.value })}
                                            placeholder="your-email@example.com"
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={supportFormData.subject}
                                            onChange={(e) => setSupportFormData({ ...supportFormData, subject: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                            Explanation & Concern
                                        </label>
                                        <textarea
                                            rows={4}
                                            required
                                            value={supportFormData.message}
                                            onChange={(e) => setSupportFormData({ ...supportFormData, message: e.target.value })}
                                            placeholder="Explain why you believe this was a mistake and provide any relevant context..."
                                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setSupportModalOpen(false)}
                                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={supportLoading}
                                            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-100 disabled:opacity-60 active:scale-95"
                                        >
                                            {supportLoading ? (
                                                <Loader size={14} className="animate-spin" />
                                            ) : (
                                                <Send size={14} />
                                            )}
                                            <span>Send Request</span>
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
