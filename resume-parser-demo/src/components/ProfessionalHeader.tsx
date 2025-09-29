import React from 'react';

interface ProfessionalHeaderProps {
    userRole: string | null;
    onLogout: () => void;
}

export default function ProfessionalHeader({ userRole, onLogout }: ProfessionalHeaderProps) {
    const getRoleDisplay = (role: string | null) => {
        switch (role) {
            case 'job_poster': return 'Recruiter Dashboard';
            case 'admin': return 'Admin Dashboard';
            case 'user': return 'Job Seeker Portal';
            default: return 'Resume Parser';
        }
    };

    const getRoleIcon = (role: string | null) => {
        switch (role) {
            case 'job_poster': return '👔';
            case 'admin': return '⚙️';
            case 'user': return '👤';
            default: return '🎯';
        }
    };

    return (
        <div className="nav-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 24 }}>{getRoleIcon(userRole)}</div>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
                        {getRoleDisplay(userRole)}
                    </h1>
                    <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                        AI-Powered Universal Resume Matching
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                    background: 'rgba(0, 112, 243, 0.1)',
                    border: '1px solid rgba(0, 112, 243, 0.3)',
                    borderRadius: 6,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0070f3'
                }}>
                    {userRole?.toUpperCase() || 'GUEST'}
                </div>

                <button
                    onClick={onLogout}
                    className="btn-secondary"
                    style={{ fontSize: 14 }}
                >
                    🚪 Logout
                </button>
            </div>
        </div>
    );
}