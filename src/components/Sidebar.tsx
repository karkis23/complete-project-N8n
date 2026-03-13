/**
 * SIDEBAR NAVIGATION COMPONENT
 * 
 * Provides the primary navigation interface for the Zenith terminal.
 * Organizes tools and features into logical groups (Overview, Portfolio, Tools).
 */

import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Briefcase, Clock,
    BarChart3, FlaskConical, Settings, ShieldCheck,
    Terminal, Sliders, History, Zap,
    type LucideIcon
} from 'lucide-react';

/** Props for the Sidebar component */
interface SidebarProps {
    /** Current status of the engine ('online', 'offline', or 'warning') */
    systemStatus?: 'online' | 'offline' | 'warning';
    /** Number of active trades to display in the badge counter */
    activeTrades?: number;
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
            { to: '/',           label: 'Dashboard',       icon: LayoutDashboard },
            { to: '/signals',    label: 'Market Signals',  icon: Zap,        badge: 'LIVE' },
        ]
    },
    {
        label: 'Portfolio',
        items: [
            { to: '/trades',     label: 'Positions',       icon: Briefcase,  counter: true },
            { to: '/history',    label: 'Trade History',   icon: Clock },
            { to: '/analytics',  label: 'Analytics',       icon: BarChart3 },
        ]
    },
    {
        label: 'Tools',
        items: [
            { to: '/validation', label: 'Signal Audit',    icon: ShieldCheck },
            { to: '/xai',        label: 'Explainability',  icon: BarChart3 },
            { to: '/tuning',     label: 'Strategy Tuning', icon: Sliders },
            { to: '/engine',     label: 'Python Engine',   icon: Terminal },
            { to: '/backtest',   label: 'Strategy Lab',    icon: FlaskConical },
            { to: '/settings',   label: 'Settings',        icon: Settings },
        ]
    }
];

export default function Sidebar({ systemStatus = 'online', activeTrades = 0 }: SidebarProps) {
    return (
        <aside className="sidebar">
            {/* Logo Section */}
            <div style={{
                padding: '28px 20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', top: '-20px', left: '-20px',
                    width: '100px', height: '100px',
                    background: 'var(--accent-glow)', filter: 'blur(30px)',
                    opacity: 0.4, borderRadius: '50%', pointerEvents: 'none'
                }} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
                    <div style={{
                        width: '42px', height: '42px',
                        position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {/* Prismatic Outer Glow */}
                        <div style={{
                            position: 'absolute', inset: -2,
                            background: 'var(--accent-grad)',
                            borderRadius: '14px', opacity: 0.3, filter: 'blur(8px)'
                        }} />
                        
                        {/* Main Glass Body */}
                        <div style={{
                            width: '100%', height: '100%',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: 'inset 0 0 12px rgba(99, 102, 241, 0.2)',
                            zIndex: 1
                        }}>
                            <Zap size={20} color="var(--accent-light)" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 0 5px var(--accent))' }} />
                        </div>
                        
                        {/* Accent Prism Line */}
                        <div style={{
                            position: 'absolute', top: '0', right: '0',
                            width: '12px', height: '12px',
                            background: 'var(--accent-light)',
                            borderRadius: '50%', filter: 'blur(8px)',
                            opacity: 0.5, zIndex: 0
                        }} />
                    </div>
                    <div>
                        <div style={{
                            fontSize: '18px', fontWeight: 800,
                            letterSpacing: '0.04em', color: 'var(--text-1)',
                            lineHeight: 1, textShadow: '0 0 20px rgba(99,102,241,0.2)'
                        }}>
                            ZENITH
                        </div>
                        <div style={{
                            fontSize: '9.5px', fontWeight: 700,
                            letterSpacing: '0.12em', color: 'var(--text-3)',
                            textTransform: 'uppercase', marginTop: '5px',
                            opacity: 0.7
                        }}>
                            Trading Terminal
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navGroups.map(group => (
                    <div key={group.label} className="sidebar-section" style={{ padding: '0 0 4px' }}>
                        <div className="sidebar-section-label">{group.label}</div>
                        {group.items.map(({ to, label, icon: Icon, badge, counter }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={to === '/'}
                                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                            >
                                <Icon size={16} strokeWidth={2} />
                                <span style={{ flex: 1 }}>{label}</span>
                                {badge && (
                                    <span style={{
                                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
                                        padding: '2px 6px', borderRadius: '4px',
                                        background: 'var(--profit-dim)', color: 'var(--profit)',
                                        border: '1px solid var(--border)'
                                    }}>
                                        {badge}
                                    </span>
                                )}
                                {counter && activeTrades > 0 && (
                                    <span style={{
                                        width: '18px', height: '18px', borderRadius: '50%',
                                        background: 'var(--accent)', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '10px', fontWeight: 700
                                    }}>
                                        {activeTrades}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Enhanced Footer Status */}
            <div style={{
                padding: '20px 16px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'linear-gradient(to top, var(--bg-surface), transparent)'
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '12px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ position: 'relative', display: 'flex' }}>
                        <span className={`dot ${
                            systemStatus === 'online' ? 'dot-green dot-pulse' :
                            systemStatus === 'warning' ? 'dot-yellow' : 'dot-red'
                        }`} style={{ width: '8px', height: '8px' }} />
                        {systemStatus === 'online' && (
                            <span style={{
                                position: 'absolute', inset: 0,
                                borderRadius: '50%', background: 'var(--profit)',
                                animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                                opacity: 0.4
                            }} />
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: '11px', fontWeight: 700,
                            color: 'var(--text-1)', letterSpacing: '0.02em'
                        }}>
                            {systemStatus === 'online' ? 'Engine v4.0 Active' : 'System Alert'}
                        </div>
                        <div style={{
                            fontSize: '9px', fontWeight: 600,
                            color: 'var(--text-4)', textTransform: 'uppercase',
                            letterSpacing: '0.05em', marginTop: '2px'
                        }}>
                            {systemStatus === 'online' ? 'All systems normal' : 'Check telemetry'}
                        </div>
                    </div>
                    {systemStatus === 'online' && (
                        <div style={{
                            fontSize: '9px', fontWeight: 700, color: 'var(--profit)',
                            background: 'var(--profit-dim)', padding: '2px 5px', borderRadius: '4px'
                        }}>
                            SYNC
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
