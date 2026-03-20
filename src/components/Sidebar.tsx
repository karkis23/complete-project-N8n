/**
 * SIDEBAR NAVIGATION COMPONENT
 * 
 * Provides the primary navigation interface for the Zenith terminal.
 * Organizes tools and features into logical groups (Overview, Portfolio, Tools).
 */

import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Briefcase, Clock, Cpu,
    BarChart3, FlaskConical, Settings, ShieldCheck,
    Terminal, Sliders, Zap,
    type LucideIcon
} from 'lucide-react';
import ZenithLogo from './ZenithLogo';

/** Props for the Sidebar component */
interface SidebarProps {
    /** Current status of the engine ('online', 'offline', or 'warning') */
    systemStatus?: 'online' | 'offline' | 'warning';
    /** Number of active trades to display in the badge counter */
    activeTrades?: number;
    /** Connection diagnostics */
    connections?: {
        engine: boolean;
        database: boolean;
        feed: boolean;
    };
}

/** Individual navigation item schema */
interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
    badge?: string;     // Optional text badge (e.g. 'LIVE')
    counter?: boolean;  // If true, shows activeTrades count
}

/** Navigation groupings for the sidebar menu */
const navGroups: { label: string; items: NavItem[] }[] = [
    {
        label: 'Overview',
        items: [
            { to: '/', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/signals', label: 'Market Signals', icon: Zap, badge: 'LIVE' },
        ]
    },
    {
        label: 'Portfolio',
        items: [
            { to: '/trades', label: 'Positions', icon: Briefcase, counter: true },
            { to: '/history', label: 'Trade History', icon: Clock },
            { to: '/analytics', label: 'Analytics', icon: BarChart3 },
        ]
    },
    {
        label: 'Tools',
        items: [
            { to: '/validation', label: 'Signal Audit', icon: ShieldCheck },
            { to: '/xai', label: 'Explainability', icon: BarChart3 },
            { to: '/tuning', label: 'Strategy Tuning', icon: Sliders },
            { to: '/engine', label: 'Python Engine', icon: Terminal },
            { to: '/backtest', label: 'Strategy Lab', icon: FlaskConical },
            { to: '/settings', label: 'Settings', icon: Settings },
        ]
    }
];

export default function Sidebar({ systemStatus = 'online', activeTrades = 0, connections }: SidebarProps) {
    return (
        <aside className="sidebar" style={{ 
            background: 'var(--bg-surface)', 
            borderRight: '1px solid var(--border-strong)',
            display: 'flex', flexDirection: 'column',
            boxShadow: '4px 0 24px rgba(0,0,0,0.02)'
        }}>
            {/* Logo Section */}
            <div style={{
                padding: '28px 20px 24px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
            }}>
                {/* Background ambient glow matching theme */}
                <div style={{
                    position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
                    width: '160px', height: '160px',
                    background: 'var(--accent-glow)', filter: 'blur(50px)',
                    opacity: 0.25, borderRadius: '50%', pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)',
                        padding: '12px', borderRadius: '16px',
                        boxShadow: '0 8px 32px var(--shadow-sm), inset 0 1px 1px rgba(255,255,255,0.1)',
                        border: '1px solid var(--border)',
                        marginBottom: '16px'
                    }}>
                        <ZenithLogo size={38} />
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '22px', fontWeight: 900,
                            letterSpacing: '0.04em', color: 'var(--text-1)',
                            lineHeight: 1, textShadow: '0 2px 20px var(--accent-glow)'
                        }}>
                            ZENITH
                        </div>
                        <div style={{
                            fontSize: '9px', fontWeight: 800,
                            letterSpacing: '0.2em', color: 'var(--accent)',
                            textTransform: 'uppercase', marginTop: '8px',
                            background: 'var(--accent-dim)', padding: '4px 10px',
                            borderRadius: '100px', display: 'inline-block',
                            border: '1px solid rgba(80, 70, 229, 0.2)'
                        }}>
                            Quantum Terminal
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav" style={{ padding: '4px 16px', flex: 1, overflowY: 'auto' }}>
                {navGroups.map(group => (
                    <div key={group.label} className="sidebar-section" style={{ marginBottom: '20px' }}>
                        {/* Elegant Section Header */}
                        <div style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '0 8px', marginBottom: '8px'
                        }}>
                            <span style={{ 
                                fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', 
                                letterSpacing: '0.12em', color: 'var(--text-4)' 
                            }}>
                                {group.label}
                            </span>
                            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--border), transparent)' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {group.items.map(({ to, label, icon: Icon, badge, counter }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    end={to === '/'}
                                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                                    style={({ isActive }) => ({
                                        padding: '12px 14px',
                                        borderRadius: '10px',
                                        background: isActive ? 'var(--accent-dim)' : 'transparent',
                                        color: isActive ? 'var(--accent)' : 'var(--text-2)',
                                        border: isActive ? '1px solid rgba(80, 70, 229, 0.15)' : '1px solid transparent',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s ease',
                                        display: 'flex', alignItems: 'center', gap: '12px'
                                    })}
                                >
                                    {({ isActive }) => (
                                        <>
                                            {/* Hover/Active indicator line */}
                                            {isActive && (
                                                <div style={{
                                                    position: 'absolute', left: 0, top: '25%', bottom: '25%', width: '3px',
                                                    background: 'var(--accent)', borderRadius: '0 4px 4px 0',
                                                    boxShadow: '0 0 12px var(--accent)'
                                                }} />
                                            )}
                                            
                                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} style={{ 
                                                color: isActive ? 'var(--accent)' : 'var(--text-3)',
                                                transition: 'color 0.2s ease'
                                            }} />
                                            
                                            <span style={{ 
                                                flex: 1, fontSize: '13.5px', 
                                                fontWeight: isActive ? 700 : 600,
                                                letterSpacing: '-0.01em'
                                            }}>
                                                {label}
                                            </span>
                                            
                                            {badge && (
                                                <span style={{
                                                    fontSize: '8.5px', fontWeight: 800, letterSpacing: '0.1em',
                                                    padding: '3px 6px', borderRadius: '6px',
                                                    background: isActive ? 'var(--profit)' : 'var(--profit-dim)', 
                                                    color: isActive ? '#fff' : 'var(--profit)',
                                                    boxShadow: isActive ? '0 2px 8px rgba(34, 197, 94, 0.4)' : 'none',
                                                    transition: 'all 0.2s ease'
                                                }}>
                                                    {badge}
                                                </span>
                                            )}
                                            
                                            {counter && activeTrades > 0 && (
                                                <span className="pulse-anim" style={{
                                                    padding: '3px 8px', borderRadius: '12px',
                                                    background: 'var(--accent)', color: 'white',
                                                    fontSize: '10px', fontWeight: 800,
                                                    boxShadow: '0 2px 10px var(--accent-glow)'
                                                }}>
                                                    {activeTrades}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Enhanced Footer Status */}
            <div style={{
                padding: '16px 16px 20px',
                marginTop: 'auto',
                borderTop: '1px solid var(--border)',
                background: 'linear-gradient(to top, var(--bg-surface), transparent)'
            }}>

                <div style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '16px',
                    background: systemStatus === 'online' 
                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.01) 100%)'
                        : systemStatus === 'warning'
                            ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(234, 179, 8, 0.01) 100%)'
                            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.01) 100%)',
                    border: '1px solid',
                    borderColor: systemStatus === 'online' ? 'rgba(34, 197, 94, 0.2)' 
                            : systemStatus === 'warning' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    padding: '12px 14px',
                    boxShadow: systemStatus === 'online' 
                        ? '0 10px 30px -10px rgba(34, 197, 94, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                        : systemStatus === 'warning'
                            ? '0 10px 30px -10px rgba(234, 179, 8, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                            : '0 10px 30px -10px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    cursor: 'default',
                    transition: 'all 0.3s ease'
                }} className="footer-status-card">
                    {/* Subtle Glow Behind */}
                    <div style={{
                        position: 'absolute', top: -20, right: -20,
                        width: '80px', height: '80px',
                        background: systemStatus === 'online' ? 'var(--profit)' 
                                : systemStatus === 'warning' ? '#eab308' : 'var(--loss)',
                        filter: 'blur(40px)', opacity: 0.15, pointerEvents: 'none',
                        borderRadius: '50%'
                    }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: '34px', height: '34px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '10px',
                            background: systemStatus === 'online' ? 'rgba(34, 197, 94, 0.1)' 
                                    : systemStatus === 'warning' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${systemStatus === 'online' ? 'rgba(34, 197, 94, 0.2)' 
                                    : systemStatus === 'warning' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            color: systemStatus === 'online' ? '#22c55e' 
                                    : systemStatus === 'warning' ? '#eab308' : '#ef4444',
                            boxShadow: `inset 0 2px 10px ${systemStatus === 'online' ? 'rgba(34, 197, 94, 0.05)' 
                                    : systemStatus === 'warning' ? 'rgba(234, 179, 8, 0.05)' : 'rgba(239, 68, 68, 0.05)'}`
                        }}>
                            <Cpu size={16} strokeWidth={2.5} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                fontSize: '13px', fontWeight: 800,
                                color: 'var(--text-1)', letterSpacing: '-0.01em',
                                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                            }}>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {systemStatus === 'online' ? 'Cluster Active' : systemStatus === 'warning' ? 'Cluster Degraded' : 'System Guard'}
                                </span>
                                <div style={{
                                    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                                    background: systemStatus === 'online' ? '#22c55e' 
                                            : systemStatus === 'warning' ? '#eab308' : '#ef4444',
                                    boxShadow: `0 0 12px 2px ${systemStatus === 'online' ? 'rgba(34, 197, 94, 0.4)' 
                                            : systemStatus === 'warning' ? 'rgba(234, 179, 8, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                                }} className={systemStatus === 'online' ? 'dot-pulse' : ''} />
                            </div>
                            <div style={{
                                fontSize: '9.5px', fontWeight: 700,
                                color: 'var(--text-3)', textTransform: 'uppercase',
                                letterSpacing: '0.04em', marginTop: '3px',
                                display: 'flex', alignItems: 'center', gap: '4px',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                                {systemStatus === 'online' ? (
                                    <>
                                        <span style={{ color: 'var(--accent-light)', flexShrink: 0 }}>v4.2.0</span>
                                        <span style={{ opacity: 0.3, flexShrink: 0 }}>|</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Telemetry Sync</span>
                                    </>
                                ) : systemStatus === 'warning' ? (
                                    <span style={{ color: '#eab308' }}>Sync Delayed</span>
                                ) : (
                                    <span style={{ color: '#ef4444' }}>Intervention Req.</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
