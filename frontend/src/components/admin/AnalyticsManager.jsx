import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, BookOpen, PenTool, Mic, TrendingUp,
  Award, Activity, BarChart2, RefreshCw
} from 'lucide-react';
import AdminAPI from '../../services/adminAPI';
import toast from 'react-hot-toast';

// ── Minimal bar chart using CSS ──────────────────────────────────
const BarChart = ({ data, color = 'bg-brand-purple', maxValue }) => {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-28 w-full">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col justify-end" style={{ height: '88px' }}>
            <div
              className={`w-full rounded-t-md ${color} opacity-80 transition-all duration-500`}
              style={{ height: `${Math.round((item.value / max) * 88)}px`, minHeight: item.value > 0 ? '4px' : '0' }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
          <span className="text-xs muted-text truncate w-full text-center" title={item.label}>
            {item.shortLabel || item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Donut-style stat ring ─────────────────────────────────────────
const StatRing = ({ value, max, label, color }) => {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const r = 28, cx = 36, cy = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="7" className="opacity-10 text-gray-400" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <p className="text-lg font-bold text-app -mt-1">{value}</p>
      <p className="text-xs muted-text text-center">{label}</p>
    </div>
  );
};

const AnalyticsManager = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await AdminAPI.getDashboardStats();
      setStats(res.data);
      setLastRefreshed(new Date());
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16 muted-text">
        <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No analytics data available.</p>
      </div>
    );
  }

  const { overview = {}, content = {}, engagement = {} } = stats;

  // Build bar chart data from available stats
  const contentData = [
    { label: 'Quizzes', shortLabel: 'Quiz', value: content.totalQuizzes || 0 },
    { label: 'Writing', shortLabel: 'Write', value: content.totalWritingChallenges || 0 },
    { label: 'Speaking', shortLabel: 'Speak', value: content.totalSpeakingChallenges || 0 },
  ];

  const userSplit = [
    { label: 'Active Users', shortLabel: 'Active', value: overview.activeUsers || 0 },
    { label: 'Inactive Users', shortLabel: 'Inactive', value: (overview.totalUsers || 0) - (overview.activeUsers || 0) },
    { label: 'Admins', shortLabel: 'Admin', value: overview.adminUsers || 0 },
  ];

  const summaryCards = [
    { label: 'Total Users', value: overview.totalUsers ?? '—', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Active Users', value: overview.activeUsers ?? '—', icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Total Quizzes', value: content.totalQuizzes ?? '—', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Writing Challenges', value: content.totalWritingChallenges ?? '—', icon: PenTool, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: 'Speaking Challenges', value: content.totalSpeakingChallenges ?? '—', icon: Mic, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Total Submissions', value: engagement?.totalSubmissions ?? engagement?.quizAttempts ?? '—', icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-app">Analytics Dashboard</h2>
          <p className="muted-text text-sm">
            {lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleTimeString()}` : 'Loading…'}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-app hover:bg-white/5 transition text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-surface glass neon-card rounded-2xl border border-app p-4 flex flex-col items-center text-center"
            >
              <div className={`p-2 rounded-xl ${card.bg} mb-2`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-app">{card.value}</p>
              <p className="text-xs muted-text mt-1">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content breakdown bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface glass neon-card rounded-2xl border border-app p-6"
        >
          <h3 className="text-lg font-semibold text-app mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            Content Distribution
          </h3>
          <BarChart data={contentData} color="bg-purple-500" />
          <div className="flex justify-around mt-4">
            {contentData.map(d => (
              <div key={d.label} className="text-center">
                <p className="text-xl font-bold text-app">{d.value}</p>
                <p className="text-xs muted-text">{d.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* User activity rings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-surface glass neon-card rounded-2xl border border-app p-6"
        >
          <h3 className="text-lg font-semibold text-app mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            User Activity Breakdown
          </h3>
          <div className="flex justify-around items-center py-2">
            <StatRing
              value={overview.activeUsers || 0}
              max={overview.totalUsers || 1}
              label="Active"
              color="#22c55e"
            />
            <StatRing
              value={(overview.totalUsers || 0) - (overview.activeUsers || 0)}
              max={overview.totalUsers || 1}
              label="Inactive"
              color="#ef4444"
            />
            <StatRing
              value={overview.adminUsers || 0}
              max={overview.totalUsers || 1}
              label="Admins"
              color="#a855f7"
            />
          </div>
          <BarChart data={userSplit} color="bg-blue-500" />
        </motion.div>
      </div>

      {/* Engagement stats */}
      {engagement && Object.keys(engagement).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-surface glass neon-card rounded-2xl border border-app p-6"
        >
          <h3 className="text-lg font-semibold text-app mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-500" />
            Engagement Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(engagement).map(([key, value]) => (
              <div key={key} className="text-center p-4 rounded-xl bg-white/5 border border-app/30">
                <p className="text-2xl font-bold text-app">{value ?? '—'}</p>
                <p className="text-xs muted-text mt-1 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AnalyticsManager;
