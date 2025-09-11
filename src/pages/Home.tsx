import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Store,
  FileText,
  DollarSign,
  Archive,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Activity,
  Users,
  Zap
} from 'lucide-react';
import { testDatabaseStructure } from '../utils/database-test';

const Home: React.FC = () => {
  const stats = [
    { 
      label: '在庫商品', 
      value: '0', 
      icon: Package, 
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      change: '+0%',
      trend: 'up'
    },
    { 
      label: '出品中', 
      value: '0', 
      icon: FileText, 
      gradient: 'from-emerald-500 to-green-500',
      bgGradient: 'from-emerald-50 to-green-50',
      change: '+0%',
      trend: 'up'
    },
    { 
      label: '今月売上', 
      value: '¥0', 
      icon: DollarSign, 
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      change: '+0%',
      trend: 'neutral'
    },
    { 
      label: '利益率', 
      value: '0%', 
      icon: TrendingUp, 
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      change: '+0%',
      trend: 'up'
    },
  ];

  const quickActions = [
    { 
      to: '/products/new', 
      label: '商品登録', 
      icon: Package, 
      gradient: 'from-blue-500 to-blue-600',
      description: '新しい商品を追加'
    },
    { 
      to: '/purchases/new', 
      label: '仕入登録', 
      icon: ShoppingCart, 
      gradient: 'from-green-500 to-green-600',
      description: '仕入情報を記録'
    },
    { 
      to: '/listing', 
      label: '出品準備', 
      icon: FileText, 
      gradient: 'from-purple-500 to-purple-600',
      description: '商品を出品準備'
    },
    { 
      to: '/sales', 
      label: '売却処理', 
      icon: DollarSign, 
      gradient: 'from-orange-500 to-orange-600',
      description: '売却を記録'
    },
  ];

  const recentActivities = [
    { time: '10分前', action: 'システム起動', icon: Zap, color: 'text-green-600 bg-green-100' },
    { time: '1時間前', action: 'データベース接続確立', icon: Activity, color: 'text-blue-600 bg-blue-100' },
    { time: '2時間前', action: '自動バックアップ完了', icon: Archive, color: 'text-purple-600 bg-purple-100' },
  ];

  useEffect(() => {
    // デバッグ用：データベース構造をテスト
    testDatabaseStructure();
  }, []);

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-10">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <span className="text-xs text-gray-500 uppercase tracking-wider">Dashboard</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          ダッシュボード
        </h1>
        <p className="text-gray-600 mt-2">メルカリ販売管理システムへようこそ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 relative overflow-hidden group hover:scale-[1.02]"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`}></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className={`flex items-center space-x-1 text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 
                    stat.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    <span>{stat.change}</span>
                    <ArrowUpRight size={16} className={stat.trend === 'down' ? 'rotate-180' : ''} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                クイックアクション
              </h2>
              <Zap className="text-yellow-500" size={24} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.to}
                    className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    <div className="relative z-10">
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg mb-4`}>
                        <Icon size={24} className="text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{action.label}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                お知らせ
              </h2>
              <AlertCircle className="text-blue-500" size={24} />
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-blue-500 rounded-lg shadow-lg">
                  <AlertCircle className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 mb-2">システム情報</h3>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Web版メルカリ管理ツールへようこそ。.envファイルにSupabaseの接続情報を設定してください。
                    すべての機能が利用可能になります。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                アクティビティ
              </h2>
              <Clock className="text-gray-500" size={20} />
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-start space-x-3 group">
                    <div className={`p-2 rounded-lg ${activity.color} group-hover:scale-110 transition-transform`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">システムステータス</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">正常</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;