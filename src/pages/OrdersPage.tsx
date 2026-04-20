import React from 'react';
import { useTrading } from '../hooks/useTrading';
import { ShieldCheck, Target, Crosshair, ArrowRightCircle } from 'lucide-react';

const OrdersPage: React.FC = () => {
    const { activeTrades } = useTrading();

    return (
        <div className="page-container p-6 w-full h-full overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Crosshair size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Active Order Book</h1>
                    <p className="text-[#a1a1aa] text-sm">Live bracket orders, stop loss tracking, and execution progress.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {activeTrades.length === 0 ? (
                    <div className="glass-panel p-8 text-center text-zinc-500">
                        No active orders currently pending execution.
                    </div>
                ) : (
                    activeTrades.map(trade => (
                        <div key={trade.entryOrderId} className="glass-panel p-5 relative overflow-hidden transition-all hover:bg-white/[0.03]">
                            
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`px-3 py-1 rounded border text-xs font-bold tracking-wider ${
                                        trade.status === 'ACTIVE' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-green-500/10 border-green-500/30 text-green-400'
                                    }`}>
                                        {trade.status}
                                    </div>
                                    <span className="font-mono text-white/90 font-medium tracking-wide">
                                        {trade.tradingSymbol.replace('NIFTY', 'NIFTY ')}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-1">Time Elapsed</div>
                                    <div className="text-sm font-mono text-white/80">{trade.executionTime || '00:00'}</div>
                                </div>
                            </div>
                            
                            {/* Grid stats */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="glass-panel p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ArrowRightCircle size={14} className="text-blue-400" />
                                        <span className="text-xs text-white/50 uppercase font-semibold">Entry</span>
                                    </div>
                                    <div className="text-xl font-mono text-white">₹{trade.entryPrice.toFixed(2)}</div>
                                    <div className="text-xs font-mono text-white/30 mt-1 truncate">ID: {trade.entryOrderId}</div>
                                </div>
                                <div className="glass-panel p-3 bg-red-500/5 border-red-500/10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ShieldCheck size={14} className="text-red-400" />
                                        <span className="text-xs text-red-500/70 uppercase font-semibold">Stop Loss</span>
                                    </div>
                                    <div className="text-xl font-mono text-red-400">₹{trade.stopLoss.toFixed(2)}</div>
                                    <div className="text-xs font-mono text-red-400/30 mt-1 truncate">ID: {trade.slOrderId || 'PENDING'}</div>
                                </div>
                                <div className="glass-panel p-3 bg-green-500/5 border-green-500/10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Target size={14} className="text-green-400" />
                                        <span className="text-xs text-green-500/70 uppercase font-semibold">Target</span>
                                    </div>
                                    <div className="text-xl font-mono text-green-400">₹{trade.target.toFixed(2)}</div>
                                    <div className="text-xs font-mono text-green-400/30 mt-1 truncate">ID: {trade.targetOrderId || 'PENDING'}</div>
                                </div>
                            </div>

                            {/* Live Tracking Logic - Distance */}
                            <div className="glass-panel p-3 flex flex-col gap-2 relative">
                                <div className="flex justify-between text-xs font-mono text-white/50 font-medium">
                                    <span className="text-red-400">₹{trade.stopLoss} (SL)</span>
                                    <span className="text-blue-400">Entry: ₹{trade.entryPrice}</span>
                                    <span className="text-green-400">₹{trade.target} (TG)</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                                    {/* Entry Line Indicator */}
                                    <div className="absolute top-0 bottom-0 w-px bg-blue-500/50 left-[50%] z-20"></div>
                                    
                                    {/* Progress simulation because we don't have LTP of option here natively, but we can visualize structure */}
                                    <div 
                                        className="h-full rounded-full absolute left-[50%] right-0 opacity-50" 
                                        style={{ background: 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 1))' }}
                                    />
                                    <div 
                                        className="h-full rounded-full absolute left-0 right-[50%] opacity-50" 
                                        style={{ background: 'linear-gradient(270deg, transparent, rgba(239, 68, 68, 1))' }}
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest border border-white/5 px-2 py-0.5 rounded">Risk: ₹{trade.maxLoss}</span>
                                    <span className="text-xs text-white/60 font-semibold tracking-wider p-2">R:R - 1:{trade.rrRatio}</span>
                                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest border border-white/5 px-2 py-0.5 rounded">Reward: ₹{trade.maxProfit}</span>
                                </div>
                            </div>

                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default OrdersPage;
