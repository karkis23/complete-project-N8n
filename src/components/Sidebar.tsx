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

export default function Sidebar({ systemStatus = 'online', activeTrades = 0 }: SidebarProps) {
    return (
        <aside className="sidebar" style={{ 
            background: 'var(--bg-surface)', 
            borderRight: '1px solid var(--border-strong)',
            display: 'flex', flexDirection: 'column',
            boxShadow: '4px 0 24px rgba(0,0,0,0.02)'
        }}>
            {/* Elegant Compact Logo Section */}
            <div style={{
                padding: '24px 20px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {/* Refined ambient glow */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '140px', height: '60px',
                    background: 'var(--accent-glow)', filter: 'blur(35px)',
                    opacity: 0.12, borderRadius: '50%', pointerEvents: 'none'
                }} />

                <div style={{ 
                    position: 'relative', zIndex: 1, 
                    display: 'flex', alignItems: 'center', gap: '14px' 
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)',
                        padding: '10px', borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-strong)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <ZenithLogo size={28} />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{
                            fontSize: '18px', fontWeight: 900,
                            letterSpacing: '0.06em', color: 'var(--text-1)',
                            lineHeight: 1.1,
                            background: 'linear-gradient(to right, #fff, var(--text-2))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            ZENITH
                        </div>
                        <div style={{
                            fontSize: '7.5px', fontWeight: 800,
                            letterSpacing: '0.18em', color: 'var(--accent-light)',
                            textTransform: 'uppercase',
                            opacity: 0.9,
                            display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                            <span style={{ width: '4px', height: '1px', background: 'var(--accent)', opacity: 0.5 }} />
                            Quantum Terminal
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Subtle separator */}
            <div style={{ padding: '0 20px', marginBottom: '12px' }}>
                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--border), transparent)', opacity: 0.5 }} />
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

            {/* Compact & Elegant Status Cockpit */}
            <div style={{
                padding: '16px 14px 20px',
                marginTop: 'auto',
                borderTop: '1px solid var(--border-subtle)',
            }}>
                <div style={{
                    position: 'relative',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    overflow: 'hidden',
                }} className="glass-card-hover">
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '10px',
                            background: systemStatus === 'online' ? 'rgba(34, 197, 94, 0.12)' 
                                    : systemStatus === 'warning' ? 'rgba(234, 179, 8, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: systemStatus === 'online' ? '#4ade80' 
                                    : systemStatus === 'warning' ? '#facc15' : '#fb7185',
                            flexShrink: 0
                        }}>
                            <Cpu size={16} strokeWidth={2.4} />
                        </div>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: '13px', fontWeight: 800,
                                color: 'var(--text-1)', letterSpacing: '-0.01em',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                                {systemStatus === 'online' ? 'Cluster Active' : systemStatus === 'warning' ? 'Degraded' : 'Guarded'}
                            </div>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px'
                            }}>
                                <span style={{ fontSize: '8px', fontWeight: 800, color: 'var(--accent-light)' }}>v4.3.0</span>
                                <span style={{ width: '2px', height: '2px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                                <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase' }}>Sync Active</span>
                            </div>
                        </div>

                        <div style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: systemStatus === 'online' ? '#22c55e' 
                                    : systemStatus === 'warning' ? '#eab308' : '#ef4444',
                            boxShadow: `0 0 10px ${systemStatus === 'online' ? '#22c55e' : systemStatus === 'warning' ? '#eab308' : '#ef4444'}`
                        }} className="dot-pulse" />
                    </div>

                    {/* Minimalist health footer */}
                    <div style={{ 
                        height: '2px', width: '100%', background: 'rgba(255,255,255,0.03)', 
                        marginTop: '10px', borderRadius: '1px', overflow: 'hidden' 
                    }}>
                        <div style={{ 
                            height: '100%', width: systemStatus === 'online' ? '100%' : '70%', 
                            background: systemStatus === 'online' ? 'var(--profit)' : '#eab308', 
                            opacity: 0.4 
                        }} className="shimmer" />
                    </div>
                </div>
            </div>
        </aside>
    );
}
