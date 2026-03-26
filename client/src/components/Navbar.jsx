import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const token = localStorage.getItem('token');
    const isAdmin = user?.role === 'admin';

    React.useEffect(() => {
        if (token) {
            try {
                // Simple decode for UI purposes (backend verifies)
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                setUser(JSON.parse(jsonPayload).user);
            } catch (e) {
                console.error("Invalid token", e);
            }
        }
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleScroll = (e) => {
        e.preventDefault();
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
        <nav className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-bold text-primary">CivicPulse</Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {!token && (
                            <>
                                <Link to="/" className="text-gray-600 hover:text-primary transition-colors">Home</Link>
                                <button onClick={handleScroll} className="text-gray-600 hover:text-primary transition-colors">How It Works</button>
                            </>
                        )}
                        <Link to="/issues" className="text-gray-600 hover:text-primary transition-colors">Issues</Link>
                        <Link to="/resolved" className="text-gray-600 hover:text-primary transition-colors">Resolved Issues</Link>
                        <div className="flex items-center space-x-4">
                            {token ? (
                                <>
                                    {user && user.role === 'admin' && (
                                        <Link to="/admin" className="text-gray-600 hover:text-primary transition-colors font-semibold text-blue-600">Admin</Link>
                                    )}
                                    {!isAdmin && (
                                        <Link to="/dashboard" className="text-gray-600 hover:text-primary transition-colors">Dashboard</Link>
                                    )}
                                    <button onClick={handleLogout} className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-blue-50 transition-colors">
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-blue-50 transition-colors">
                                        Login
                                    </Link>
                                    <Link to="/register" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-600 hover:text-gray-900 focus:outline-none"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-b border-gray-100">
                        {!token && (
                            <>
                                <Link to="/" className="block px-3 py-2 text-gray-600 hover:text-primary hover:bg-blue-50 rounded-md">Home</Link>
                                <button onClick={(e) => { handleScroll(e); setIsOpen(false); }} className="block w-full text-left px-3 py-2 text-gray-600 hover:text-primary hover:bg-blue-50 rounded-md">How It Works</button>
                            </>
                        )}
                        <Link to="/issues" className="block px-3 py-2 text-gray-600 hover:text-primary hover:bg-blue-50 rounded-md">Issues</Link>
                        <Link to="/resolved" className="block px-3 py-2 text-gray-600 hover:text-primary hover:bg-blue-50 rounded-md">Resolved Issues</Link>
                        <div className="pt-4 pb-3 border-t border-gray-100">
                            {token ? (
                                <>
                                    {user && user.role === 'admin' && (
                                        <Link to="/admin" className="block px-3 py-2 text-primary font-semibold hover:bg-gray-50 rounded-md">Admin Dashboard</Link>
                                    )}
                                    {!isAdmin && (
                                        <Link to="/dashboard" className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">Dashboard</Link>
                                    )}
                                    <button onClick={handleLogout} className="w-full px-4 py-2 text-primary border border-primary rounded-lg hover:bg-blue-50 transition-colors">
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="block w-full text-center px-4 py-2 text-primary border border-primary rounded-lg hover:bg-blue-50 transition-colors">
                                        Login
                                    </Link>
                                    <Link to="/register" className="block w-full text-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
