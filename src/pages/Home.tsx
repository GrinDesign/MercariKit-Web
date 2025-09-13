import React, { useEffect, useState } from 'react';
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
  Zap,
  Gem,
  PieChart,
  BarChart3,
  Target,
  TrendingDown,
  Calendar,
  Bell,
  CheckCircle
} from 'lucide-react';
import { testDatabaseStructure } from '../utils/database-test';
import { supabase } from '../lib/supabase';

interface ProductTypeStats {
  asset: {
    count: number;
    value: number;
    percentage: number;
  };
  quickTurn: {
    count: number;
    value: number;
    percentage: number;
  };
  total: {
    count: number;
    value: number;
  };
}

interface ManagementKPI {
  currentMonth: {
    revenue: number;
    profit: number;
    profitMargin: number;
    itemsSold: number;
    avgPrice: number;
    inventoryTurnover: number;
  };
  previousMonth: {
    revenue: number;
    profit: number;
    profitMargin: number;
    itemsSold: number;
    avgPrice: number;
    inventoryTurnover: number;
  };
  trends: {
    revenueChange: number;
    profitChange: number;
    marginChange: number;
    volumeChange: number;
  };
  goals: {
    monthlyRevenueTarget: number;
    monthlyProfitTarget: number;
    revenueAchievement: number;
    profitAchievement: number;
  };
}

interface BusinessInsight {
  type: 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

interface CashFlowData {
  invested: number;
  recovered: number;
  unrealized: number;
  roi: number;
  paybackPeriod: number; // days
}

const Home: React.FC = () => {
  const [productTypeStats, setProductTypeStats] = useState<ProductTypeStats>({
    asset: { count: 0, value: 0, percentage: 0 },
    quickTurn: { count: 0, value: 0, percentage: 0 },
    total: { count: 0, value: 0 }
  });
  const [managementKPI, setManagementKPI] = useState<ManagementKPI | null>(null);
  const [businessInsights, setBusinessInsights] = useState<BusinessInsight[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);

  // 動的な統計情報（managementKPIから生成）
  const getStats = () => {
    if (!managementKPI) {
      return [
        { 
          label: '今月売上', 
          value: '¥0', 
          icon: DollarSign, 
          gradient: 'from-blue-500 to-cyan-500',
          bgGradient: 'from-blue-50 to-cyan-50',
          change: '+0%',
          trend: 'neutral' as const
        },
        { 
          label: '今月利益', 
          value: '¥0', 
          icon: TrendingUp, 
          gradient: 'from-emerald-500 to-green-500',
          bgGradient: 'from-emerald-50 to-green-50',
          change: '+0%',
          trend: 'neutral' as const
        },
        { 
          label: '利益率', 
          value: '0%', 
          icon: Target, 
          gradient: 'from-purple-500 to-pink-500',
          bgGradient: 'from-purple-50 to-pink-50',
          change: '+0%',
          trend: 'neutral' as const
        },
        { 
          label: '在庫回転率', 
          value: '0回/月', 
          icon: Activity, 
          gradient: 'from-orange-500 to-red-500',
          bgGradient: 'from-orange-50 to-red-50',
          change: '+0%',
          trend: 'neutral' as const
        },
      ];
    }

    const { currentMonth, trends } = managementKPI;
    
    return [
      { 
        label: '今月売上', 
        value: `¥${currentMonth.revenue.toLocaleString()}`, 
        icon: DollarSign, 
        gradient: 'from-blue-500 to-cyan-500',
        bgGradient: 'from-blue-50 to-cyan-50',
        change: `${trends.revenueChange >= 0 ? '+' : ''}${trends.revenueChange.toFixed(1)}%`,
        trend: trends.revenueChange > 5 ? 'up' : trends.revenueChange < -5 ? 'down' : 'neutral' as const
      },
      { 
        label: '今月利益', 
        value: `¥${currentMonth.profit.toLocaleString()}`, 
        icon: TrendingUp, 
        gradient: 'from-emerald-500 to-green-500',
        bgGradient: 'from-emerald-50 to-green-50',
        change: `${trends.profitChange >= 0 ? '+' : ''}${trends.profitChange.toFixed(1)}%`,
        trend: trends.profitChange > 5 ? 'up' : trends.profitChange < -5 ? 'down' : 'neutral' as const
      },
      { 
        label: '利益率', 
        value: `${currentMonth.profitMargin.toFixed(1)}%`, 
        icon: Target, 
        gradient: 'from-purple-500 to-pink-500',
        bgGradient: 'from-purple-50 to-pink-50',
        change: `${trends.marginChange >= 0 ? '+' : ''}${trends.marginChange.toFixed(1)}pt`,
        trend: trends.marginChange > 2 ? 'up' : trends.marginChange < -2 ? 'down' : 'neutral' as const
      },
      { 
        label: '在庫回転率', 
        value: `${currentMonth.inventoryTurnover.toFixed(1)}回/月`, 
        icon: Activity, 
        gradient: 'from-orange-500 to-red-500',
        bgGradient: 'from-orange-50 to-red-50',
        change: `${currentMonth.inventoryTurnover > 2 ? '良好' : currentMonth.inventoryTurnover > 1 ? '普通' : '要改善'}`,
        trend: currentMonth.inventoryTurnover > 2 ? 'up' : currentMonth.inventoryTurnover > 1 ? 'neutral' : 'down' as const
      },
    ];
  };


  const recentActivities = [
    { time: '10分前', action: 'システム起動', icon: Zap, color: 'text-green-600 bg-green-100' },
    { time: '1時間前', action: 'データベース接続確立', icon: Activity, color: 'text-blue-600 bg-blue-100' },
    { time: '2時間前', action: '自動バックアップ完了', icon: Archive, color: 'text-purple-600 bg-purple-100' },
  ];

  const fetchProductTypeStats = async () => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('asset_type, allocated_cost, purchase_cost')
        .in('status', ['in_stock', 'ready_to_list', 'listed']);

      if (error) {
        console.error('Error fetching product type stats:', error);
        return;
      }

      let assetCount = 0;
      let assetValue = 0;
      let quickTurnCount = 0;
      let quickTurnValue = 0;

      products?.forEach(product => {
        const cost = product.allocated_cost || product.purchase_cost || 0;
        
        if (product.asset_type === 'asset') {
          assetCount++;
          assetValue += cost;
        } else {
          quickTurnCount++;
          quickTurnValue += cost;
        }
      });

      const totalCount = assetCount + quickTurnCount;
      const totalValue = assetValue + quickTurnValue;

      setProductTypeStats({
        asset: {
          count: assetCount,
          value: assetValue,
          percentage: totalCount > 0 ? (assetCount / totalCount) * 100 : 0
        },
        quickTurn: {
          count: quickTurnCount,
          value: quickTurnValue,
          percentage: totalCount > 0 ? (quickTurnCount / totalCount) * 100 : 0
        },
        total: {
          count: totalCount,
          value: totalValue
        }
      });
    } catch (error) {
      console.error('Error in fetchProductTypeStats:', error);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      try {
        // デバッグ用：データベース構造をテスト
        testDatabaseStructure();
        
        // 各種データを並行して取得
        await Promise.all([
          fetchProductTypeStats(),
          fetchManagementKPI(),
          fetchBusinessInsights(),
          fetchCashFlowData()
        ]);
      } catch (error) {
        console.error('Dashboard initialization error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeDashboard();
  }, []);

  const fetchManagementKPI = async () => {
    try {
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
      const prevMonthStr = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;

      // 今月と前月の売却済み商品を取得
      const { data: currentProducts, error: currentError } = await supabase
        .from('products')
        .select('sold_price, allocated_cost, purchase_cost, sold_at')
        .eq('status', 'sold')
        .gte('sold_at', `${currentMonth}-01`)
        .lt('sold_at', `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 2).padStart(2, '0')}-01`);

      const { data: previousProducts, error: previousError } = await supabase
        .from('products')
        .select('sold_price, allocated_cost, purchase_cost, sold_at')
        .eq('status', 'sold')
        .gte('sold_at', `${prevMonthStr}-01`)
        .lt('sold_at', `${currentMonth}-01`);

      if (currentError || previousError) throw currentError || previousError;

      // 在庫商品を取得（回転率計算用）
      const { data: inventory, error: inventoryError } = await supabase
        .from('products')
        .select('allocated_cost, purchase_cost')
        .in('status', ['in_stock', 'ready_to_list', 'listed']);

      if (inventoryError) throw inventoryError;

      // 今月のKPI計算
      const currentRevenue = currentProducts?.reduce((sum, p) => sum + (p.sold_price || 0), 0) || 0;
      const currentCost = currentProducts?.reduce((sum, p) => sum + (p.allocated_cost || p.purchase_cost || 0), 0) || 0;
      const currentProfit = currentRevenue - currentCost;
      const currentProfitMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
      const currentItemsSold = currentProducts?.length || 0;
      const currentAvgPrice = currentItemsSold > 0 ? currentRevenue / currentItemsSold : 0;
      
      // 在庫回転率（月間売上原価 ÷ 平均在庫価値）
      const averageInventoryValue = inventory?.reduce((sum, p) => sum + (p.allocated_cost || p.purchase_cost || 0), 0) || 1;
      const currentTurnover = averageInventoryValue > 0 ? currentCost / averageInventoryValue : 0;

      // 前月のKPI計算
      const previousRevenue = previousProducts?.reduce((sum, p) => sum + (p.sold_price || 0), 0) || 0;
      const previousCost = previousProducts?.reduce((sum, p) => sum + (p.allocated_cost || p.purchase_cost || 0), 0) || 0;
      const previousProfit = previousRevenue - previousCost;
      const previousProfitMargin = previousRevenue > 0 ? (previousProfit / previousRevenue) * 100 : 0;
      const previousItemsSold = previousProducts?.length || 0;
      const previousAvgPrice = previousItemsSold > 0 ? previousRevenue / previousItemsSold : 0;
      const previousTurnover = averageInventoryValue > 0 ? previousCost / averageInventoryValue : 0;

      // トレンド計算
      const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      const profitChange = previousProfit > 0 ? ((currentProfit - previousProfit) / Math.abs(previousProfit)) * 100 : 0;
      const marginChange = currentProfitMargin - previousProfitMargin;
      const volumeChange = previousItemsSold > 0 ? ((currentItemsSold - previousItemsSold) / previousItemsSold) * 100 : 0;

      // 目標設定（例：前月比110%）
      const monthlyRevenueTarget = previousRevenue * 1.1;
      const monthlyProfitTarget = previousProfit * 1.1;
      const revenueAchievement = monthlyRevenueTarget > 0 ? (currentRevenue / monthlyRevenueTarget) * 100 : 0;
      const profitAchievement = monthlyProfitTarget > 0 ? (currentProfit / monthlyProfitTarget) * 100 : 0;

      setManagementKPI({
        currentMonth: {
          revenue: currentRevenue,
          profit: currentProfit,
          profitMargin: currentProfitMargin,
          itemsSold: currentItemsSold,
          avgPrice: currentAvgPrice,
          inventoryTurnover: currentTurnover
        },
        previousMonth: {
          revenue: previousRevenue,
          profit: previousProfit,
          profitMargin: previousProfitMargin,
          itemsSold: previousItemsSold,
          avgPrice: previousAvgPrice,
          inventoryTurnover: previousTurnover
        },
        trends: {
          revenueChange,
          profitChange,
          marginChange,
          volumeChange
        },
        goals: {
          monthlyRevenueTarget,
          monthlyProfitTarget,
          revenueAchievement,
          profitAchievement
        }
      });
    } catch (error) {
      console.error('Error fetching management KPI:', error);
    }
  };

  const fetchBusinessInsights = async () => {
    try {
      const insights: BusinessInsight[] = [];
      
      // 滞留商品チェック
      const { data: slowMoving, error: slowError } = await supabase
        .from('products')
        .select('id, name, created_at, listed_at')
        .in('status', ['listed', 'ready_to_list'])
        .order('created_at', { ascending: true });

      if (!slowError && slowMoving) {
        const oldItems = slowMoving.filter(item => {
          const createdDate = new Date(item.created_at);
          const daysSince = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysSince > 60;
        });

        if (oldItems.length > 5) {
          insights.push({
            type: 'warning',
            title: '滞留在庫アラート',
            description: `60日以上滞留している商品が${oldItems.length}点あります`,
            action: '価格見直しを推奨',
            priority: 'high'
          });
        }
      }

      // 売れ筋カテゴリチェック
      const { data: soldItems, error: soldError } = await supabase
        .from('products')
        .select('category, sold_at')
        .eq('status', 'sold')
        .gte('sold_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (!soldError && soldItems && soldItems.length > 0) {
        const categoryCount = soldItems.reduce((acc, item) => {
          const cat = item.category || 'その他';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topCategory = Object.entries(categoryCount)
          .sort(([,a], [,b]) => b - a)[0];

        if (topCategory && topCategory[1] >= 3) {
          insights.push({
            type: 'opportunity',
            title: '売れ筋カテゴリ',
            description: `「${topCategory[0]}」が好調です（${topCategory[1]}点売却）`,
            action: '同カテゴリの仕入れ強化を検討',
            priority: 'medium'
          });
        }
      }

      // 利益率チェック
      if (managementKPI?.currentMonth.profitMargin && managementKPI.currentMonth.profitMargin > 30) {
        insights.push({
          type: 'success',
          title: '高利益率達成',
          description: `今月の利益率が${managementKPI.currentMonth.profitMargin.toFixed(1)}%と優秀です`,
          priority: 'low'
        });
      }

      setBusinessInsights(insights);
    } catch (error) {
      console.error('Error fetching business insights:', error);
    }
  };

  const fetchCashFlowData = async () => {
    try {
      // 投資額（仕入コスト）
      const { data: allProducts, error } = await supabase
        .from('products')
        .select('status, allocated_cost, purchase_cost, sold_price, created_at');

      if (error) throw error;

      const invested = allProducts?.reduce((sum, p) => {
        return sum + (p.allocated_cost || p.purchase_cost || 0);
      }, 0) || 0;

      const recovered = allProducts?.filter(p => p.status === 'sold')
        .reduce((sum, p) => sum + (p.sold_price || 0), 0) || 0;

      const unrealized = allProducts?.filter(p => p.status !== 'sold')
        .reduce((sum, p) => sum + (p.allocated_cost || p.purchase_cost || 0), 0) || 0;

      const roi = invested > 0 ? ((recovered - invested) / invested) * 100 : 0;

      // 平均回収期間計算（売却済み商品から）
      const soldProducts = allProducts?.filter(p => p.status === 'sold' && p.created_at) || [];
      const totalDays = soldProducts.reduce((sum, p) => {
        const created = new Date(p.created_at).getTime();
        const today = Date.now();
        return sum + Math.floor((today - created) / (1000 * 60 * 60 * 24));
      }, 0);
      const paybackPeriod = soldProducts.length > 0 ? totalDays / soldProducts.length : 0;

      setCashFlow({
        invested,
        recovered,
        unrealized,
        roi,
        paybackPeriod
      });
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ダッシュボードを読み込み中...</p>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <span className="text-xs text-gray-500 uppercase tracking-wider">Dashboard</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          ダッシュボード
        </h1>
        <p className="text-sm text-gray-600 mt-1">メルカリ販売管理システムへようこそ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 relative overflow-hidden group hover:scale-[1.02]"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`}></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-md`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className={`flex items-center space-x-1 text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 
                    stat.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    <span>{stat.change}</span>
                    <ArrowUpRight size={16} className={stat.trend === 'down' ? 'rotate-180' : ''} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 商品タイプ別構成 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center space-x-2">
            <PieChart className="text-blue-600" size={20} />
            <span>商品構成分析</span>
          </h2>
          <Link
            to="/products"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            詳細表示 →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 資産型商品 */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Gem size={16} className="text-blue-600" />
                <h3 className="text-base font-semibold text-blue-900">資産型商品</h3>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-700">
                  {productTypeStats.asset.percentage.toFixed(1)}%
                </div>
                <div className="text-xs text-blue-600">在庫構成比</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-blue-700 text-xs">商品数</span>
                <span className="font-semibold text-blue-900 text-sm">{productTypeStats.asset.count}点</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700 text-xs">在庫価値</span>
                <span className="font-semibold text-blue-900 text-sm">¥{productTypeStats.asset.value.toLocaleString()}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${productTypeStats.asset.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 回転型商品 */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Zap size={16} className="text-orange-600" />
                <h3 className="text-base font-semibold text-orange-900">回転型商品</h3>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-orange-700">
                  {productTypeStats.quickTurn.percentage.toFixed(1)}%
                </div>
                <div className="text-xs text-orange-600">在庫構成比</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-orange-700 text-xs">商品数</span>
                <span className="font-semibold text-orange-900 text-sm">{productTypeStats.quickTurn.count}点</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-700 text-xs">在庫価値</span>
                <span className="font-semibold text-orange-900 text-sm">¥{productTypeStats.quickTurn.value.toLocaleString()}</span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${productTypeStats.quickTurn.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 全体サマリー */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-6 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{productTypeStats.total.count}</div>
              <div className="text-xs text-gray-600">総商品数</div>
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <div className="text-lg font-bold text-blue-600">¥{productTypeStats.total.value.toLocaleString()}</div>
              <div className="text-xs text-gray-600">総在庫価値</div>
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {productTypeStats.total.count > 0 ? '運用中' : '準備中'}
              </div>
              <div className="text-xs text-gray-600">ポートフォリオ</div>
            </div>
          </div>
        </div>
      </div>

      {/* 目標達成度セクション */}
      {managementKPI && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center space-x-2">
              <Target className="text-green-600" size={20} />
              <span>今月の目標達成度</span>
            </h2>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 売上目標 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">売上目標</h3>
                  <p className="text-sm text-blue-700">前月比110%目標</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-700">
                    {managementKPI.goals.revenueAchievement.toFixed(1)}%
                  </div>
                  <div className="text-sm text-blue-600">達成率</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">現在売上</span>
                  <span className="font-semibold">¥{managementKPI.currentMonth.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">目標売上</span>
                  <span className="font-semibold">¥{managementKPI.goals.monthlyRevenueTarget.toLocaleString()}</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      managementKPI.goals.revenueAchievement >= 100 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                    }`}
                    style={{ width: `${Math.min(100, managementKPI.goals.revenueAchievement)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 利益目標 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-900">利益目標</h3>
                  <p className="text-sm text-green-700">前月比110%目標</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-700">
                    {managementKPI.goals.profitAchievement.toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-600">達成率</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">現在利益</span>
                  <span className="font-semibold">¥{managementKPI.currentMonth.profit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">目標利益</span>
                  <span className="font-semibold">¥{managementKPI.goals.monthlyProfitTarget.toLocaleString()}</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      managementKPI.goals.profitAchievement >= 100 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                    }`}
                    style={{ width: `${Math.min(100, managementKPI.goals.profitAchievement)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* キャッシュフロー分析 */}
      {cashFlow && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center space-x-2">
              <BarChart3 className="text-purple-600" size={20} />
              <span>キャッシュフロー分析</span>
            </h2>
            <Link
              to="/analytics"
              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
            >
              詳細分析 →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl mb-3">
                <DollarSign className="text-white mx-auto" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900">¥{cashFlow.invested.toLocaleString()}</div>
              <div className="text-sm text-gray-600">総投資額</div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl mb-3">
                <TrendingUp className="text-white mx-auto" size={24} />
              </div>
              <div className="text-2xl font-bold text-green-600">¥{cashFlow.recovered.toLocaleString()}</div>
              <div className="text-sm text-gray-600">回収済み</div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl mb-3">
                <Package className="text-white mx-auto" size={24} />
              </div>
              <div className="text-2xl font-bold text-orange-600">¥{cashFlow.unrealized.toLocaleString()}</div>
              <div className="text-sm text-gray-600">未回収在庫</div>
            </div>

            <div className="text-center">
              <div className={`bg-gradient-to-br ${cashFlow.roi >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} p-4 rounded-xl mb-3`}>
                <Target className="text-white mx-auto" size={24} />
              </div>
              <div className={`text-2xl font-bold ${cashFlow.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {cashFlow.roi >= 0 ? '+' : ''}{cashFlow.roi.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">ROI</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <div className="inline-flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar size={16} />
                <span>平均回収期間: {Math.round(cashFlow.paybackPeriod)}日</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <Activity size={16} />
                <span>資金効率: {cashFlow.roi > 20 ? '良好' : cashFlow.roi > 0 ? '普通' : '要改善'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ビジネスインサイト */}
      {businessInsights.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center space-x-2">
              <Bell className="text-yellow-600" size={20} />
              <span>ビジネスインサイト</span>
            </h2>
            <div className="text-sm text-gray-500">
              {businessInsights.length}件の提案
            </div>
          </div>

          <div className="space-y-4">
            {businessInsights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-l-4 ${
                  insight.type === 'opportunity' 
                    ? 'bg-green-50 border-green-500' 
                    : insight.type === 'warning'
                    ? 'bg-red-50 border-red-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {insight.type === 'opportunity' && <TrendingUp className="text-green-600" size={16} />}
                      {insight.type === 'warning' && <AlertCircle className="text-red-600" size={16} />}
                      {insight.type === 'success' && <CheckCircle className="text-blue-600" size={16} />}
                      <h3 className={`font-semibold ${
                        insight.type === 'opportunity' ? 'text-green-900' :
                        insight.type === 'warning' ? 'text-red-900' : 'text-blue-900'
                      }`}>
                        {insight.title}
                      </h3>
                    </div>
                    <p className={`text-sm mb-2 ${
                      insight.type === 'opportunity' ? 'text-green-800' :
                      insight.type === 'warning' ? 'text-red-800' : 'text-blue-800'
                    }`}>
                      {insight.description}
                    </p>
                    {insight.action && (
                      <p className={`text-xs font-medium ${
                        insight.type === 'opportunity' ? 'text-green-700' :
                        insight.type === 'warning' ? 'text-red-700' : 'text-blue-700'
                      }`}>
                        💡 {insight.action}
                      </p>
                    )}
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full font-medium ${
                    insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                    insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {insight.priority === 'high' ? '高' : insight.priority === 'medium' ? '中' : '低'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
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
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
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