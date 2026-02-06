import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PageLoader() {
    return (
        <div className="fixed inset-0 min-h-screen bg-black flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
                <p className="text-gray-400 font-medium text-sm animate-pulse">Loading system resources...</p>
            </div>
        </div>
    );
}
