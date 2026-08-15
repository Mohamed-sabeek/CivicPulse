import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm animate-pulse flex flex-col h-[400px]">
            <div className="h-48 bg-gray-200 w-full"></div>
            <div className="p-6 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                    <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded-md w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-5/6 mb-4"></div>
                
                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex space-x-4">
                        <div className="h-5 bg-gray-200 rounded w-12"></div>
                        <div className="h-5 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard;
