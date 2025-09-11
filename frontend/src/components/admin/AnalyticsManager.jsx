import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  BookOpen, 
  Mic, 
  PenTool,
  Calendar,
  Clock,
  Award,
  Target
} from 'lucide-react';

const AnalyticsManager = () => {
  const [analyticsData, setAnalyticsData] = useState({});
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(false);

  // Mock analytics data
  useEffect(() => {
    const mockData = {
      overview: {
        totalUsers: 1234,
        activeUsers: 856,
        totalQuizzes: 45,
        totalChallenges: 41,
        userGrowth: 12.5,
        engagementRate: 78.3,
        completionRate: 65.8,
        avgSessionTime: 24.5
      },
      userEngagement: {
        dailyActiveUsers: [
          { date: '2024-01-25', count: 120 },
          { date: '2024-01-26', count: 135 },
          { date: '2024-01-27', count: 98 },
          { date: '2024-01-28', count: 156 },
          { date: '2024-01-29', count: 143 },
          { date: '2024-01-30', count: 178 },
          { date: '2024-01-31', count: 165 }
        ],
        topPerformingContent: [
          { title: 'English Grammar Basics', type: 'quiz', completions: 245, avgScore: 78 },
          { title: 'Pronunciation Practice', type: 'speaking', completions: 187, avgScore: 82 },
          { title: 'Describe Your Hometown', type: 'writing', completions: 234, avgScore: 76 },
          { title: 'Advanced Vocabulary', type: 'quiz', completions: 189, avgScore: 65 },
          { title: 'Conversation Starter', type: 'speaking', completions: 156, avgScore: 75 }
        ],
        difficultyDistribution: {
          beginner: 45,
          intermediate: 35,
          advanced: 20
        }
      },
      contentStats: {
        quizzes: {
          total: 45,
          completed: 1567,
          avgScore: 73.2,
          popularCategories: ['grammar', 'vocabulary', 'reading']
        },
        speaking: {
          total: 23,
          completed: 892,
          avgScore: 76.8,
          popularCategories: ['pronunciation', 'conversation', 'fluency']
        },
        writing: {
          total: 18,
          completed: 634,
          avgScore: 71.5,
          popularCategories: ['essay', 'descriptive', 'opinion']
        }
      }
    };
    setAnalyticsData(mockData);
  }, [timeRange]);

  const StatCard = ({ title, value, change, icon: Icon, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface glass neon-card rounded-2xl border border-app p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-brand-purple/10">
          <Icon className="w-6 h-6 text-brand-purple" />
        </div>
        {change && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{change}%</span>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-app mb-1">{value}</h3>
      <p className="text-sm muted-text">{title}</p>
    </motion.div>
  );

  const ContentTypeCard = ({ title, data, icon: Icon, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface glass neon-card rounded-2xl border border-app p-6"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className={`p-3 rounded-xl ${color.bg}`}>
          <Icon className={`w-6 h-6 ${color.text}`} />
        </div>
        <h3 className="text-lg font-semibold text-app">{title}</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold text-app">{data.total}</p>
          <p className="text-sm muted-text">Total Created</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-app">{data.completed}</p>
          <p className="text-sm muted-text">Completions</p>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-lg font-semibold text-app">{data.avgScore}%</p>
        <p className="text-sm muted-text">Average Score</p>
      </div>
      
      <div>
        <p className="text-sm font-medium text-app mb-2">Popular Categories:</p>
        <div className="flex flex-wrap gap-1">
          {data.popularCategories.map((category, index) => (
            <span key={index} className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-app">
              {category}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );

  if (!analyticsData.overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-app">Analytics Dashboard</h2>
          <p className="muted-text">Platform insights and performance metrics</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
        >
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="90days">Last 90 days</option>
          <option value="1year">Last year</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={analyticsData.overview.totalUsers.toLocaleString()}
          change={analyticsData.overview.userGrowth}
          trend="up"
          icon={Users}
        />
        <StatCard
          title="Active Users"
          value={analyticsData.overview.activeUsers.toLocaleString()}
          change={8.2}
          trend="up"
          icon={Target}
        />
        <StatCard
          title="Engagement Rate"
          value={`${analyticsData.overview.engagementRate}%`}
          change={5.3}
          trend="up"
          icon={TrendingUp}
        />
        <StatCard
          title="Avg Session Time"
          value={`${analyticsData.overview.avgSessionTime}m`}
          change={2.1}
          trend="down"
          icon={Clock}
        />
      </div>

      {/* Content Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ContentTypeCard
          title="Quizzes"
          data={analyticsData.contentStats.quizzes}
          icon={BookOpen}
          color={{ bg: 'bg-blue-500/10', text: 'text-blue-500' }}
        />
        <ContentTypeCard
          title="Speaking Challenges"
          data={analyticsData.contentStats.speaking}
          icon={Mic}
          color={{ bg: 'bg-purple-500/10', text: 'text-purple-500' }}
        />
        <ContentTypeCard
          title="Writing Challenges"
          data={analyticsData.contentStats.writing}
          icon={PenTool}
          color={{ bg: 'bg-orange-500/10', text: 'text-orange-500' }}
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface glass neon-card rounded-2xl border border-app p-6"
        >
          <h3 className="text-lg font-semibold text-app mb-4">Top Performing Content</h3>
          <div className="space-y-3">
            {analyticsData.userEngagement.topPerformingContent.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    item.type === 'quiz' ? 'bg-blue-500/10' :
                    item.type === 'speaking' ? 'bg-purple-500/10' : 'bg-orange-500/10'
                  }`}>
                    {item.type === 'quiz' ? <BookOpen className="w-4 h-4" /> :
                     item.type === 'speaking' ? <Mic className="w-4 h-4" /> : <PenTool className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-app">{item.title}</p>
                    <p className="text-sm muted-text">{item.completions} completions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-app">{item.avgScore}%</p>
                  <p className="text-xs muted-text">avg score</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* User Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface glass neon-card rounded-2xl border border-app p-6"
        >
          <h3 className="text-lg font-semibold text-app mb-4">Daily Active Users</h3>
          <div className="space-y-3">
            {analyticsData.userEngagement.dailyActiveUsers.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm muted-text">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-purple rounded-full"
                      style={{ width: `${(day.count / 200) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-app w-8">{day.count}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Difficulty Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface glass neon-card rounded-2xl border border-app p-6"
      >
        <h3 className="text-lg font-semibold text-app mb-4">Content Difficulty Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(analyticsData.userEngagement.difficultyDistribution).map(([level, percentage]) => (
            <div key={level} className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-white/10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
                    className={
                      level === 'beginner' ? 'text-green-500' :
                      level === 'intermediate' ? 'text-yellow-500' : 'text-red-500'
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-app">{percentage}%</span>
                </div>
              </div>
              <p className="font-medium text-app capitalize">{level}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsManager;
