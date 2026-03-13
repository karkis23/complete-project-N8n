import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import SignalsPage from './pages/SignalsPage';
import TradesPage from './pages/TradesPage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BacktestPage from './pages/BacktestPage';
import SettingsPage from './pages/SettingsPage';
import ValidationPage from './pages/ValidationPage';
import PythonEnginePage from './pages/PythonEnginePage';
import XAIPage from './pages/XAIPage';
import StrategyTuningPage from './pages/StrategyTuningPage';
import { useTrading } from './hooks/useTrading';
import './index.css';

function useTheme() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('zenith-theme') as 'light' | 'dark') || 'dark';
  });

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('zenith-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  return { theme, toggleTheme };
}

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Live performance and market operational metrics' },
  '/signals': { title: 'Market Signals', subtitle: 'Real-time signal feed and decision logic' },
  '/trades': { title: 'Positions', subtitle: 'Active engagements and recently closed trades' },
  '/history': { title: 'Settled P&L', subtitle: 'Comprehensive ledger of historical performance' },
  '/analytics': { title: 'Deep Analytics', subtitle: 'Advanced statistical breakdown and strategy metrics' },
  '/backtest': { title: 'Strategy Sim', subtitle: 'Historical simulation and model verification' },
  '/settings': { title: 'Global Config', subtitle: 'Environment parameters and system controls' },
  '/validation': { title: 'Signal Audit', subtitle: 'Accuracy verification against live market telemetery' },
  '/engine': { title: 'Engine Telemetry', subtitle: 'Operational core diagnostics and service health' },
  '/xai': { title: 'AI Explainability', subtitle: 'Live feature importance and model interpretation' },
  '/tuning': { title: 'Strategy Tuning', subtitle: 'Dynamic parameter optimization and live adjustment' },
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const info = pageInfo[location.pathname] || pageInfo['/'];
  const { marketData, activeTrades, engineHealth, refresh, loading, isPaused, togglePolling } = useTrading();
  const { theme, toggleTheme } = useTheme();

  const systemStatus = engineHealth?.online
    ? 'online'
    : marketData
      ? 'warning'
      : 'offline';

  return (
    <div className="app-layout">
      <Sidebar
        systemStatus={systemStatus as 'online' | 'offline' | 'warning'}
        activeTrades={activeTrades.length}
      />
      <main className="main-content">
        <Header
          title={info.title}
          subtitle={info.subtitle}
          loading={loading}
          isPaused={isPaused}
          marketData={marketData}
          engineHealth={engineHealth}
          theme={theme}
          onToggleTheme={toggleTheme}
          onRefresh={refresh}
          onTogglePolling={togglePolling}
        />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/signals" element={<SignalsPage />} />
          <Route path="/trades" element={<TradesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/backtest" element={<BacktestPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/validation" element={<ValidationPage />} />
          <Route path="/engine" element={<PythonEnginePage />} />
          <Route path="/xai" element={<XAIPage />} />
          <Route path="/tuning" element={<StrategyTuningPage />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
