/**
 * TRADING DATA HOOK
 * 
 * Central state management for live trading data. 
 * Orchestrates polling from Google Sheets and live engine health diagnostics.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    fetchSignals, fetchActiveTrades, fetchTradeSummary, fetchMarketData,
    computeTradeStats, fetchEngineHealth,
    type LiveSignal, type ActiveTrade, type TradeSummary,
    type MarketSnapshot, type TradeStats, type EngineHealth
} from '../services/sheetsApi';

/** Unified state object for the trading environment */
export interface TradingState {
    signals: LiveSignal[];        // Recent engine signals
    activeTrades: ActiveTrade[];  // Currently open positions
    tradeSummary: TradeSummary[]; // Historical performance ledger
    marketData: MarketSnapshot | null; // Nifty LTP and VIX
    stats: TradeStats | null;      // Computed analytics (Win rate, PnL, etc)
    engineHealth: EngineHealth | null; // Python Engine status
    loading: boolean;             // Loading state indicator
    error: string | null;         // Error messaging
    lastRefresh: Date | null;     // Timestamp of last success
    isLive: boolean;              // True if market is currently open
    refresh: () => void;          // Manual refresh trigger
    isPaused: boolean;            // True if auto-polling is disabled
    togglePolling: () => void;    // Toggle auto-refresh on/off
}

export function useTrading(): TradingState {
    const [signals, setSignals] = useState<LiveSignal[]>([]);
    const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
    const [tradeSummary, setTradeSummary] = useState<TradeSummary[]>([]);
    const [marketData, setMarketData] = useState<MarketSnapshot | null>(null);
    const [stats, setStats] = useState<TradeStats | null>(null);
    const [engineHealth, setEngineHealth] = useState<EngineHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // ... load implementation remains same
            const [sigsResult, tradesResult, summaryResult] = await Promise.allSettled([
                fetchSignals(5000),
                fetchActiveTrades(),
                fetchTradeSummary(),
            ]);

            let latestSignals: LiveSignal[] = [];
            if (sigsResult.status === 'fulfilled') {
                latestSignals = sigsResult.value;
                setSignals(latestSignals);
            }
            if (tradesResult.status === 'fulfilled') setActiveTrades(tradesResult.value);
            if (summaryResult.status === 'fulfilled') {
                setTradeSummary(summaryResult.value);
                setStats(computeTradeStats(summaryResult.value));
            }

            try {
                const [market, health] = await Promise.all([
                    fetchMarketData(latestSignals[0]),
                    fetchEngineHealth()
                ]);
                setMarketData(market);
                setEngineHealth(health);
            } catch (mErr) {
                console.warn('Market/Health data failed', mErr);
            }

            setLastRefresh(new Date());
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    const scheduleNext = useCallback(() => {
        clearTimeout(timerRef.current);
        if (isPaused) return;

        const now = new Date();
        const istMin = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330);
        const marketOpen = istMin >= 555 && istMin <= 930;
        const interval = marketOpen ? 30_000 : 180_000;
        timerRef.current = setTimeout(() => { load(); scheduleNext(); }, interval);
    }, [load, isPaused]);

    useEffect(() => {
        load();
        scheduleNext();
        return () => clearTimeout(timerRef.current);
    }, [load, scheduleNext]);

    const togglePolling = useCallback(() => {
        setIsPaused(prev => !prev);
    }, []);

    return {
        signals, activeTrades, tradeSummary,
        marketData, stats, engineHealth,
        loading, error, lastRefresh,
        isLive: !!marketData?.marketOpen,
        refresh: load,
        isPaused,
        togglePolling
    };
}
