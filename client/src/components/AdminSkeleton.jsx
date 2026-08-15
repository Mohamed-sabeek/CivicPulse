import React from 'react';

const SkeletonStat = () => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-200"></div>
            <div className="space-y-2 flex-grow">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
        </div>
    </div>
);

const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-100 rounded w-48"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-100 rounded w-24"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-6 bg-gray-100 rounded-full w-20"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-100 rounded w-32"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right">
            <div className="flex justify-end gap-2">
                <div className="h-8 w-8 bg-gray-100 rounded-lg"></div>
                <div className="h-8 w-8 bg-gray-100 rounded-lg"></div>
            </div>
        </td>
    </tr>
);

const AdminSkeleton = () => {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5].map(i => <SkeletonStat key={i} />)}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="h-6 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="bg-white divide-y divide-gray-200">
                            {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminSkeleton;
