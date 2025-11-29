import React from 'react';

export default function LoadingSpinner({ message = 'Loading...' }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            gap: '1rem'
        }}>
            <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid rgba(99, 102, 241, 0.1)',
                borderTopColor: 'rgb(99, 102, 241)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <p style={{
                color: '#6b7280',
                fontSize: '14px',
                fontWeight: '500'
            }}>
                {message}
            </p>
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
