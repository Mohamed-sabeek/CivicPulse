import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckCircle2, AlertCircle, Activity, Bell, HelpCircle } from 'lucide-react';

const STATUS_CONFIG = {
    'Pending': {
        label: 'Pending',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        icon: AlertCircle,
        confirmTitle: 'Set issue to Pending?',
        confirmMsg: 'This will revert or set the issue status to pending administrative review.'
    },
    'In Progress': {
        label: 'In Progress',
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        icon: Activity,
        confirmTitle: 'Move issue to In Progress?',
        confirmMsg: 'This will notify the citizen who reported this issue that work has officially started.'
    },
    'Resolved': {
        label: 'Resolved',
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
        confirmTitle: 'Mark issue as Resolved?',
        confirmMsg: 'This will notify the citizen that their reported issue has been successfully resolved.'
    }
};

const StatusDropdown = ({ currentStatus, issueTitle, onStatusChange, disabled = false }) => {
    // Normalize 'Open' to 'Pending'
    const normalizedStatus = currentStatus === 'Open' ? 'Pending' : currentStatus;
    const [isOpen, setIsOpen] = useState(false);
    const [pendingChange, setPendingChange] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const dropdownRef = useRef(null);

    const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG['Pending'];

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelectOption = (targetStatus) => {
        setIsOpen(false);
        if (targetStatus === normalizedStatus) return;
        setPendingChange(targetStatus);
    };

    const handleConfirm = async () => {
        if (!pendingChange || submitting) return;
        setSubmitting(true);
        try {
            await onStatusChange(pendingChange);
            setPendingChange(null);
        } catch (err) {
            console.error('Failed to change status:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const targetConfig = pendingChange ? STATUS_CONFIG[pendingChange] : null;

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`inline-flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wide border shadow-2xs transition-all active:scale-95 ${config.bg} ${config.text} ${config.border} ${
                    disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-sm cursor-pointer'
                }`}
            >
                <span className={`w-2 h-2 rounded-full ${config.dot} ${normalizedStatus === 'In Progress' ? 'animate-pulse' : ''}`} />
                <span>{config.label}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Custom Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-50 mb-1">
                        Change Status
                    </div>
                    {Object.keys(STATUS_CONFIG).map((statusKey) => {
                        const itemConfig = STATUS_CONFIG[statusKey];
                        const isSelected = normalizedStatus === statusKey;

                        return (
                            <button
                                key={statusKey}
                                type="button"
                                onClick={() => handleSelectOption(statusKey)}
                                className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between transition-colors ${
                                    isSelected 
                                        ? 'bg-indigo-50/70 text-indigo-700 font-black' 
                                        : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${itemConfig.dot}`} />
                                    <span>{itemConfig.label}</span>
                                </div>
                                {isSelected && <span className="text-indigo-600 text-xs">✓</span>}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Confirmation Modal */}
            {pendingChange && targetConfig && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full p-6 sm:p-7 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
                            <Bell size={24} className="animate-wiggle" />
                        </div>

                        <h3 className="text-lg font-black text-gray-900 tracking-tight mb-2">
                            {targetConfig.confirmTitle}
                        </h3>

                        {issueTitle && (
                            <p className="text-xs font-bold text-indigo-600 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100/50 mb-3 truncate">
                                "{issueTitle}"
                            </p>
                        )}

                        <p className="text-xs text-gray-600 font-medium leading-relaxed mb-6">
                            {targetConfig.confirmMsg}
                        </p>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setPendingChange(null)}
                                disabled={submitting}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={submitting}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-200 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? 'Updating...' : 'Confirm Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatusDropdown;
