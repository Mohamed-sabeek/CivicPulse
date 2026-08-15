import React from 'react';

const DetailSkeleton = () => (
    <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            <div className="h-96 bg-gray-200"></div>
            <div className="p-8 space-y-6">
                <div className="flex gap-4">
                    <div className="h-8 w-24 bg-gray-100 rounded-full"></div>
                    <div className="h-8 w-32 bg-gray-100 rounded-full"></div>
                </div>
                <div className="space-y-3">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                </div>
            </div>
        </div>
    </div>
);

export default DetailSkeleton;
