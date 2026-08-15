import React, { useState, useEffect } from 'react';
import { Menu, X, Home, Info, AlertCircle, CheckCircle, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import civicPulseLogo from '../assets/civicpulse-logo.png';

const getUserFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload).user;
    } catch {
        return null;
    }
};

const NavLink = ({ to, icon: Icon, children, onClick, active }) => {
    const location = useLocation();
    const isActive = active !== undefined ? active : location.pathname === to;
    return (
        <Link
            to={to}
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ease-out active:scale-95 ${
                isActive
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100 font-bold scale-[1.02]'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
            }`}
        >
            {Icon && <Icon size={18} />}
            {children}
        </Link>
    );
};

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const navigate = useNavigate();
    const location = useLocation();
    const [user] = useState(() => getUserFromToken());
    const token = localStorage.getItem('token');
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);

            if (location.pathname === '/') {
                const section = document.getElementById('how-it-works');
                if (section) {
                    const rect = section.getBoundingClientRect();
                    if (rect.top <= 250 && rect.bottom >= 150) {
                        setActiveSection('how-it-works');
                    } else if (window.scrollY < 250) {
                        setActiveSection('home');
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleScrollToHome = (e) => {
        e.preventDefault();
        setActiveSection('home');
        if (location.pathname === '/') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            navigate('/');
        }
    };

    const handleScrollToSection = (e) => {
        e.preventDefault();
        setActiveSection('how-it-works');
        const section = document.getElementById('how-it-works');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        } else {
            navigate('/');
            setTimeout(() => {
                const section = document.getElementById('how-it-works');
                if (section) section.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            scrolled 
                ? 'bg-white/80 backdrop-blur-md border-b border-gray-200 py-2 shadow-lg' 
                : 'bg-white border-b border-gray-100 py-4'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-12">
                    {/* Logo */}
                    <div className="flex items-center">
                        {token ? (
                            <div className="flex items-center gap-2.5 select-none cursor-default">
                                <img 
                                    src={civicPulseLogo} 
                                    alt="CivicPulse Logo" 
                                    className="h-10 w-10 object-contain rounded-xl shadow-sm"
                                />
                                <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 tracking-tight">
                                    CivicPulse
                                </span>
                            </div>
                        ) : (
                            <Link to="/" onClick={handleScrollToHome} className="group flex items-center gap-2.5 transition-transform duration-300 ease-out active:scale-95">
                                <img 
                                    src={civicPulseLogo} 
                                    alt="CivicPulse Logo" 
                                    className="h-10 w-10 object-contain rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300"
                                />
                                <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 tracking-tight">
                                    CivicPulse
                                </span>
                            </Link>
                        )}
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-2">
                        {!token && (
                            <>
                                <button
                                    onClick={handleScrollToHome}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ease-out active:scale-95 ${
                                        location.pathname === '/' && activeSection === 'home'
                                            ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100 font-bold scale-[1.02]'
                                            : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <Home size={18} />
                                    Home
                                </button>
                                <button 
                                    onClick={handleScrollToSection}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ease-out active:scale-95 ${
                                        location.pathname === '/' && activeSection === 'how-it-works'
                                            ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100 font-bold scale-[1.02]'
                                            : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <Info size={18} />
                                    How It Works
                                </button>
                            </>
                        )}
                        <NavLink to="/issues" icon={AlertCircle}>Issues</NavLink>
                        <NavLink to="/resolved" icon={CheckCircle}>Success Stories</NavLink>
                        
                        <div className="h-6 w-px bg-gray-200 mx-2" />

                        <div className="flex items-center gap-3">
                            {token ? (
                                <>
                                    <NotificationBell />
                                    {isAdmin ? (
                                        <NavLink to="/admin" icon={Settings}>Admin Panel</NavLink>
                                    ) : (
                                        <NavLink to="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                                    )}
                                    <div className="group relative">
                                        <button 
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-red-600 hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 ease-out shadow-md"
                                        >
                                            <LogOut size={18} />
                                            Logout
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link 
                                        to="/login" 
                                        className="px-5 py-2 rounded-xl text-sm font-bold text-gray-700 hover:text-indigo-600 hover:bg-gray-50 active:scale-95 transition-all duration-300 ease-out"
                                    >
                                        Log In
                                    </Link>
                                    <Link 
                                        to="/register" 
                                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 ease-out shadow-md shadow-indigo-100"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center gap-2 md:hidden">
                        {token && <NotificationBell />}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`p-2 rounded-xl transition-all duration-300 ease-out active:scale-95 ${isOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-4 py-6 space-y-2 bg-gray-50/50">
                    {!token && (
                        <>
                            <button
                                onClick={(e) => { handleScrollToHome(e); setIsOpen(false); }}
                                className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold shadow-sm transition-all duration-300 ease-out active:scale-[0.98] ${
                                    location.pathname === '/' && activeSection === 'home'
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Home size={20} className={location.pathname === '/' && activeSection === 'home' ? 'text-indigo-600' : 'text-gray-400'} /> Home
                            </button>
                            <button 
                                onClick={(e) => { handleScrollToSection(e); setIsOpen(false); }} 
                                className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold shadow-sm transition-all duration-300 ease-out active:scale-[0.98] ${
                                    location.pathname === '/' && activeSection === 'how-it-works'
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Info size={20} className={location.pathname === '/' && activeSection === 'how-it-works' ? 'text-indigo-600' : 'text-gray-400'} /> How It Works
                            </button>
                        </>
                    )}
                    <Link to="/issues" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-4 rounded-2xl font-bold shadow-sm transition-all duration-300 ease-out active:scale-[0.98] ${location.pathname === '/issues' ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                        <AlertCircle size={20} className={location.pathname === '/issues' ? 'text-indigo-600' : 'text-gray-400'} /> Community Issues
                    </Link>
                    <Link to="/resolved" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-4 rounded-2xl font-bold shadow-sm transition-all duration-300 ease-out active:scale-[0.98] ${location.pathname === '/resolved' ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                        <CheckCircle size={20} className={location.pathname === '/resolved' ? 'text-indigo-600' : 'text-gray-400'} /> Success Stories
                    </Link>
                    
                    <div className="py-4 space-y-3">
                        {token ? (
                            <>
                                {isAdmin ? (
                                    <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all duration-300 ease-out active:scale-[0.98]">
                                        <Settings size={20} /> Admin Dashboard
                                    </Link>
                                ) : (
                                    <Link to="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all duration-300 ease-out active:scale-[0.98]">
                                        <LayoutDashboard size={20} /> My Dashboard
                                    </Link>
                                )}
                                <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all duration-300 ease-out active:scale-[0.98]">
                                    <LogOut size={20} /> Logout
                                </button>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center justify-center p-4 bg-white border border-gray-200 rounded-2xl text-gray-700 font-bold hover:bg-gray-50 transition-all duration-300 ease-out active:scale-[0.98]">
                                    Log In
                                </Link>
                                <Link to="/register" onClick={() => setIsOpen(false)} className="flex items-center justify-center p-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all duration-300 ease-out active:scale-[0.98]">
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
