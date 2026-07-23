import React from 'react';
import { PackageStore } from '../../profile/PackageStore';
 
export default function PackagesTab() {
    return (
        <div className="animate-in fade-in duration-300 max-w-3xl">
            <PackageStore />
        </div>
    );
}
