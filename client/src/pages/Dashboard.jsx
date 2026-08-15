import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import SkeletonCard from '../components/SkeletonCard';
import { MessageSquare, Trash2, AlertCircle, ArrowRight, UploadCloud, MapPin, Tag, FileText, Send, Camera, Sparkles, Loader2, X, Plus } from 'lucide-react';
import { ISSUE_CATEGORIES, ISSUE_TITLES } from '../constants/issueOptions';
import { compressImage } from '../utils/imageCompressor';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [newIssue, setNewIssue] = useState({
        title: '',
        description: '',
        category: '',
        location: '',
        imageUrl: ''
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [showIssueForm, setShowIssueForm] = useState(false);
    const [myPostsFilter, setMyPostsFilter] = useState('All');
    const [userIssues, setUserIssues] = useState([]);
    const [totalIssuesCount, setTotalIssuesCount] = useState(0);
    const [platformStats, setPlatformStats] = useState({
        totalIssues: 0,
        resolvedIssues: 0,
        activeUsers: 0
    });

    const fetchTotalIssuesCount = async () => {
        try {
            const res = await api.get('/issues?page=1&limit=1');
            setTotalIssuesCount(res.data.totalIssues || 0);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/user');
            setUser(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUserIssues = async () => {
        try {
            setLoading(true);
            const res = await api.get('/issues/me');
            setUserIssues(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlatformStats = async () => {
        try {
            const res = await api.get('/stats');
            setPlatformStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchUser();
        fetchUserIssues();
        fetchPlatformStats();
        fetchTotalIssuesCount();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showIssueForm) {
                setShowIssueForm(false);
            }
        };
        if (showIssueForm) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [showIssueForm]);

    const handleCreateIssue = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/issues', newIssue);
            setNewIssue({ title: '', description: '', category: '', location: '', imageUrl: '' });
            setShowIssueForm(false);
            fetchUserIssues();
            fetchTotalIssuesCount();
            fetchPlatformStats();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Failed to submit issue');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this issue?')) return;
        try {
            await api.delete(`/issues/${id}`);
            setUserIssues(prev => prev.filter(issue => issue._id !== id));
            fetchTotalIssuesCount();
            fetchPlatformStats();
        } catch (err) {
            console.error(err);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const compressed = await compressImage(reader.result, 800, 800, 0.7);
                    setNewIssue(prev => ({ ...prev, imageUrl: compressed }));
                } catch (err) {
                    console.error("Compression failed", err);
                    setNewIssue(prev => ({ ...prev, imageUrl: reader.result }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const compressed = await compressImage(reader.result, 800, 800, 0.7);
                    setNewIssue(prev => ({ ...prev, imageUrl: compressed }));
                } catch (err) {
                    console.error("Compression failed", err);
                    setNewIssue(prev => ({ ...prev, imageUrl: reader.result }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const isAdmin = user?.role === 'admin';
    const postCount = userIssues.length;
    const resolvedCount = isAdmin
        ? platformStats.resolvedIssues
        : userIssues.filter(issue => issue.status === 'Resolved').length;

    const filteredUserIssues = useMemo(() => {
        let result = [...userIssues];
        if (myPostsFilter === 'Active') {
            result = result.filter(issue => issue.status !== 'Resolved');
        } else if (myPostsFilter === 'Resolved') {
            result = result.filter(issue => issue.status === 'Resolved');
        }
        return result;
    }, [userIssues, myPostsFilter]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-24">
            <Navbar />
            <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

                {/* Premium User Stats Section */}
                {user && (
                    <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-900 border border-indigo-800 shadow-xl p-8 flex flex-col md:flex-row items-center justify-between text-white">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4 user-select-none">
                            <span className="text-[160px] leading-none font-black tracking-tighter">IMPACT</span>
                        </div>
                        <div className="relative z-10 mb-6 md:mb-0 text-center md:text-left">
                            <h2 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight text-white drop-shadow-md">
                                Welcome back, <span className="text-blue-300">{user.name || 'User'}</span>!
                            </h2>
                            <p className="text-blue-200 text-lg font-medium">Your voice is building a better community.</p>
                        </div>
                        
                        <div className="relative z-10 flex gap-4 md:gap-6 w-full md:w-auto mt-2 md:mt-0 justify-center">
                            <div className="flex-1 md:flex-none flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl md:px-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-transform hover:-translate-y-1 hover:bg-white/15">
                                <p className="text-4xl font-extrabold text-white mb-1 drop-shadow-sm">{isAdmin ? totalIssuesCount : postCount}</p>
                                <p className="text-xs uppercase tracking-widest text-blue-200 font-bold">{isAdmin ? 'Total Reports' : 'Issues Posted'}</p>
                            </div>
                            <div className="flex-1 md:flex-none flex flex-col items-center justify-center bg-emerald-500/30 backdrop-blur-md border border-emerald-400/30 p-5 rounded-2xl md:px-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-transform hover:-translate-y-1 hover:bg-emerald-500/40">
                                <p className="text-4xl font-extrabold text-emerald-300 mb-1 drop-shadow-sm">{resolvedCount}</p>
                                <p className="text-xs uppercase tracking-widest text-emerald-200 font-bold">Issues Resolved</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Action Bar for Post Issue */}
                <div className="w-full flex justify-end mb-8">
                    <button
                        onClick={() => setShowIssueForm(true)}
                        className="px-6 py-2.5 rounded-xl shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] transform transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 font-bold text-sm tracking-wide bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                        <Plus size={16} /> Post New Issue
                    </button>
                </div>

                {/* Modal Card Overlay for Report a New Issue */}
                {showIssueForm && (
                    <div 
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setShowIssueForm(false);
                        }}
                    >
                        <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-gray-100 p-6 sm:p-10 my-auto relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex justify-between items-start pb-6 border-b border-gray-100 mb-8">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase tracking-widest mb-2">
                                        <Sparkles size={13} /> Civic Action
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Report a Community Issue</h2>
                                    <p className="text-gray-500 text-sm font-medium mt-1">Provide clear details and photo evidence to help authorities address the concern quickly.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowIssueForm(false)}
                                    className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-2xl transition-all"
                                    title="Close Dialog"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateIssue} className="space-y-8">
                                {/* Two-Column Responsive Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                                    
                                    {/* Left Column: Issue Information */}
                                    <div className="space-y-6 flex flex-col justify-between">
                                        {/* Issue Title */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                                <FileText size={14} className="text-indigo-600" />
                                                Issue Title <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer appearance-none"
                                                    value={newIssue.title}
                                                    onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                                                    required
                                                >
                                                    <option value="" disabled>Select the most relevant issue title</option>
                                                    {ISSUE_TITLES.map((title) => (
                                                        <option key={title} value={title}>{title}</option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="flex-1 flex flex-col">
                                            <label className="flex items-center gap-1.5 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                                <MessageSquare size={14} className="text-indigo-600" />
                                                Detailed Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                rows={7}
                                                placeholder="Describe the issue, its location, and how it affects the community..."
                                                className="w-full flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none leading-relaxed placeholder-gray-400"
                                                value={newIssue.description}
                                                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                                                required
                                            />
                                            <p className="text-[11px] text-gray-400 font-medium mt-1.5 ml-1">
                                                Include specifics like urgency, safety hazards, or nearest landmarks.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Column: Location, Category & Evidence Image */}
                                    <div className="space-y-6">
                                        {/* Location Input */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                                <MapPin size={14} className="text-indigo-600" />
                                                Location / Landmark <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="e.g., 5th Cross Road, Near Central Library"
                                                    className="w-full py-3.5 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-400"
                                                    value={newIssue.location}
                                                    onChange={(e) => setNewIssue({ ...newIssue, location: e.target.value })}
                                                    required
                                                />
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                                    <MapPin size={18} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Issue Type (Category) */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                                <Tag size={14} className="text-indigo-600" />
                                                Issue Category <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer appearance-none"
                                                    value={newIssue.category}
                                                    onChange={(e) => setNewIssue({ ...newIssue, category: e.target.value })}
                                                    required
                                                >
                                                    <option value="" disabled>Select Issue Type</option>
                                                    {ISSUE_CATEGORIES.map((cat) => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dedicated Evidence Image Upload & Preview Card */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                                <Camera size={14} className="text-indigo-600" />
                                                Evidence Photo <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                                            </label>

                                            {!newIssue.imageUrl ? (
                                                <div
                                                    onDragEnter={handleDrag}
                                                    onDragLeave={handleDrag}
                                                    onDragOver={handleDrag}
                                                    onDrop={handleDrop}
                                                >
                                                    <label
                                                        htmlFor="issue-photo-upload"
                                                        className={`group w-full h-44 border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                                                            dragActive
                                                                ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
                                                                : 'border-gray-200 bg-gray-50/60 hover:bg-indigo-50/20 hover:border-indigo-400'
                                                        }`}
                                                    >
                                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-sm">
                                                            <UploadCloud size={24} />
                                                        </div>
                                                        <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">Upload Evidence Photo</p>
                                                        <p className="text-xs text-gray-400 font-medium mt-0.5">Drag and drop or browse (PNG, JPG or WEBP)</p>
                                                    </label>
                                                    <input
                                                        id="issue-photo-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        capture="environment"
                                                        className="hidden"
                                                        onChange={handleImageChange}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {/* Fixed size preview container with object-contain */}
                                                    <div className="w-full h-44 rounded-2xl bg-gray-900/5 border border-gray-200 overflow-hidden flex items-center justify-center p-2 relative group shadow-inner">
                                                        <img
                                                            src={newIssue.imageUrl}
                                                            alt="Evidence preview"
                                                            className="max-h-full max-w-full object-contain rounded-xl drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.02]"
                                                        />
                                                    </div>

                                                    {/* Action Bar for Image */}
                                                    <div className="flex items-center justify-between px-1">
                                                        <label
                                                            htmlFor="issue-photo-change"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
                                                        >
                                                            <Camera size={14} /> Change Photo
                                                        </label>
                                                        <input
                                                            id="issue-photo-change"
                                                            type="file"
                                                            accept="image/*"
                                                            capture="environment"
                                                            className="hidden"
                                                            onChange={handleImageChange}
                                                        />
                                                        
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewIssue(prev => ({ ...prev, imageUrl: '' }))}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all"
                                                        >
                                                            <Trash2 size={14} /> Remove Photo
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Footer / Action Bar */}
                                <div className="border-t border-gray-100 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                        <AlertCircle size={15} className="text-indigo-400" />
                                        <span>All reports are geotagged and published for civic resolution.</span>
                                    </div>

                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={() => setShowIssueForm(false)}
                                            className="w-1/2 sm:w-auto px-6 py-3.5 rounded-xl text-gray-600 font-bold text-sm hover:bg-gray-100 transition-all active:scale-95"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-1/2 sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" /> Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={16} /> Submit Issue
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* User's Own Posts Section (Primary Feed) */}
                {user && (
                    <div className="mt-4">
                        <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Your Contributions</h2>
                                <p className="text-gray-500 font-medium mt-1">Manage and track the issues you've reported.</p>
                            </div>
                            <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                                {['All', 'Active', 'Resolved'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setMyPostsFilter(filter)}
                                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                            myPostsFilter === filter 
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                                : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                            </div>
                        ) : userIssues.length === 0 ? (
                            <div className="bg-white p-16 rounded-[2.5rem] text-center border-2 border-dashed border-gray-100">
                                <div className="w-20 h-20 bg-indigo-50 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <MessageSquare size={40} />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">No reports yet</h3>
                                <p className="text-gray-500 font-medium mb-8 max-w-xs mx-auto">Start by reporting your first community issue to see it here.</p>
                                <button
                                    onClick={() => setShowIssueForm(true)}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                                >
                                    Report First Issue
                                </button>
                            </div>
                        ) : filteredUserIssues.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredUserIssues.map((issue) => (
                                    <div key={issue._id} className="group bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col">
                                        <div className="relative h-56 overflow-hidden">
                                            {issue.imageUrl ? (
                                                <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200">
                                                    <AlertCircle size={48} />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <span className={`flex items-center px-4 py-2 backdrop-blur-md bg-white/90 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm border ${
                                                    issue.status === 'Resolved' ? 'text-emerald-600 border-emerald-100' :
                                                    issue.status === 'In Progress' ? 'text-blue-600 border-blue-100' :
                                                    'text-amber-600 border-amber-100'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                                        issue.status === 'Resolved' ? 'bg-emerald-500' :
                                                        issue.status === 'In Progress' ? 'bg-blue-500' :
                                                        'bg-amber-500 animate-pulse'
                                                    }`} />
                                                    {issue.status}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="p-8 flex-grow flex flex-col">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                    {issue.category}
                                                </span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-auto font-mono">
                                                    {new Date(issue.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 mb-3 truncate group-hover:text-indigo-600 transition-colors tracking-tight">{issue.title}</h3>
                                            <p className="text-gray-500 text-sm font-medium mb-8 line-clamp-2 leading-relaxed">{issue.description}</p>
                                            
                                            <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-center">
                                                <Link to={`/issues/${issue._id}`} className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:gap-3 transition-all">
                                                    Details <ArrowRight size={16} />
                                                </Link>
                                                <button 
                                                    onClick={() => handleDelete(issue._id)} 
                                                    className="p-3 text-red-400 hover:text-white hover:bg-red-500 rounded-2xl transition-all active:scale-90 shadow-sm hover:shadow-red-100" 
                                                    title="Remove Post"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100 shadow-sm">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No {myPostsFilter.toLowerCase()} issues found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};

export default Dashboard;
