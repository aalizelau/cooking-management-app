import React, { useState } from 'react';
import { Store } from 'lucide-react';
import { getStoreLogo, getStoreInitials } from '../utils/storeLogo';

const StoreLogo = ({ storeName, size = 32 }) => {
    const [logoError, setLogoError] = useState(false);
    const logoUrl = getStoreLogo(storeName);

    // If no logo URL or logo failed to load, show fallback
    if (!logoUrl || logoError) {
        return (
            <div
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: '4px',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: `${size * 0.4}px`,
                    fontWeight: 'bold',
                    color: '#666',
                    border: '1px solid #e0e0e0',
                    flexShrink: 0
                }}
                title={storeName}
            >
                {getStoreInitials(storeName)}
            </div>
        );
    }

    return (
        <img
            src={logoUrl}
            alt={`${storeName} logo`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                objectFit: 'contain',
                borderRadius: '4px',
                backgroundColor: '#fff',
                padding: '2px',
                border: '1px solid #e0e0e0',
                flexShrink: 0
            }}
            onError={() => setLogoError(true)}
            title={storeName}
        />
    );
};

export default StoreLogo;
