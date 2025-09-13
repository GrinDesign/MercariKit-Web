import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  Filter,
  FileSpreadsheet,
  FilePlus,
  AlertCircle,
  Check,
  Clock
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'monthly' | 'weekly' | 'custom';
  icon: React.ElementType;
  color: string;
}

interface ReportData {
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  summary: {
    totalRevenue: number;
    totalProfit: number;
    totalItemsSold: number;
    profitMargin: number;
    avgSellingPrice: number;
    topCategories: Array<{ name: string; count: number; revenue: number }>;
    topStores: Array<{ name: string; count: number; revenue: number }>;
  };
  inventory: {
    totalItems: number;
    totalValue: number;
    byStatus: Array<{ status: string; count: number; value: number }>;
    slowMoving: Array<{ name: string; daysInStock: number; cost: number }>;
  };
  trends: {
    dailySales: Array<{ date: string; revenue: number; profit: number }>;
    categoryPerformance: Array<{ category: string; trend: 'up' | 'down' | 'stable'; change: number }>;
  };
}

const Reports: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('monthly');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'monthly',
      name: '月次レポート',
      description: '月間の売上・在庫・収益分析',
      type: 'monthly',
      icon: Calendar,
      color: 'blue'
    },
    {
      id: 'weekly',
      name: '週次レポート',
      description: '週間のパフォーマンスサマリー',
      type: 'weekly',
      icon: Clock,
      color: 'green'
    },
    {
      id: 'inventory',
      name: '在庫レポート',
      description: '現在の在庫状況と分析',
      type: 'custom',
      icon: Package,
      color: 'purple'
    },
    {
      id: 'profit',
      name: '収益分析レポート',
      description: '利益率とコスト分析',
      type: 'custom',
      icon: TrendingUp,
      color: 'orange'
    }
  ];

  useEffect(() => {
    // デフォルトの期間を設定（今月）
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // 売上データの取得
      const { data: salesData, error: salesError } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'sold')
        .gte('sold_at', startDate)
        .lte('sold_at', endDate);

      if (salesError) throw salesError;

      // 在庫データの取得
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('products')
        .select('*')
        .in('status', ['in_stock', 'ready_to_list', 'listed']);

      if (inventoryError) throw inventoryError;

      // 店舗データの取得
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*');

      if (storesError) throw storesError;

      // レポートデータの生成
      const totalRevenue = salesData?.reduce((sum, item) => sum + (item.sold_price || 0), 0) || 0;
      const totalCost = salesData?.reduce((sum, item) => sum + (item.allocated_cost || item.purchase_cost || 0), 0) || 0;
      const totalProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      // カテゴリ別集計
      const categoryStats = salesData?.reduce((acc, item) => {
        const category = item.category || 'その他';
        if (!acc[category]) {
          acc[category] = { name: category, count: 0, revenue: 0 };
        }
        acc[category].count++;
        acc[category].revenue += item.sold_price || 0;
        return acc;
      }, {} as Record<string, any>);

      const topCategories = Object.values(categoryStats || {})
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      // 在庫ステータス別集計
      const statusGroups = inventoryData?.reduce((acc, item) => {
        const status = item.status;
        if (!acc[status]) {
          acc[status] = { status, count: 0, value: 0 };
        }
        acc[status].count++;
        acc[status].value += item.allocated_cost || item.purchase_cost || 0;
        return acc;
      }, {} as Record<string, any>);

      // 滞留商品の抽出
      const slowMoving = inventoryData?.filter(item => {
        const createdDate = new Date(item.created_at);
        const daysInStock = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysInStock > 60;
      }).map(item => ({
        name: item.name,
        daysInStock: Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        cost: item.allocated_cost || item.purchase_cost || 0
      })).slice(0, 10);

      setReportData({
        period: {
          start: new Date(startDate),
          end: new Date(endDate),
          label: `${startDate} 〜 ${endDate}`
        },
        summary: {
          totalRevenue,
          totalProfit,
          totalItemsSold: salesData?.length || 0,
          profitMargin,
          avgSellingPrice: salesData?.length ? totalRevenue / salesData.length : 0,
          topCategories,
          topStores: []
        },
        inventory: {
          totalItems: inventoryData?.length || 0,
          totalValue: inventoryData?.reduce((sum, item) => sum + (item.allocated_cost || item.purchase_cost || 0), 0) || 0,
          byStatus: Object.values(statusGroups || {}),
          slowMoving: slowMoving || []
        },
        trends: {
          dailySales: [],
          categoryPerformance: []
        }
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData();
    }
  }, [startDate, endDate]);

  const generatePDF = async () => {
    setGenerating(true);
    // PDF生成のシミュレーション
    setTimeout(() => {
      alert('PDF生成機能は実装準備中です。\njsPDFまたはhtml2canvasを使用して実装予定です。');
      setGenerating(false);
    }, 1500);
  };

  const exportToExcel = async () => {
    setGenerating(true);
    // Excel出力のシミュレーション
    setTimeout(() => {
      alert('Excel出力機能は実装準備中です。\nSheetJSを使用して実装予定です。');
      setGenerating(false);
    }, 1500);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">レポート生成</h1>
        <p className="text-sm text-gray-600 mt-1">売上・在庫・収益の分析レポートを自動生成</p>
      </div>

      {/* レポートテンプレート選択 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FileText className="mr-2 text-gray-600" size={20} />
          レポートテンプレート
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            const isSelected = selectedTemplate === template.id;
            return (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`p-2 rounded-lg bg-${template.color}-100 w-fit mb-3`}>
                  <Icon className={`text-${template.color}-600`} size={20} />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 text-left">{template.name}</h3>
                <p className="text-xs text-gray-600 mt-1 text-left">{template.description}</p>
                {isSelected && (
                  <div className="mt-2 flex justify-end">
                    <Check className="text-blue-600" size={16} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 期間設定 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="mr-2 text-gray-600" size={20} />
          レポート期間
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">開始日</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">終了日</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              const now = new Date();
              const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
              const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              setStartDate(firstDay.toISOString().split('T')[0]);
              setEndDate(lastDay.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            今月
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
              setStartDate(firstDay.toISOString().split('T')[0]);
              setEndDate(lastDay.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            先月
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              setStartDate(lastWeek.toISOString().split('T')[0]);
              setEndDate(now.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            過去7日間
          </button>
        </div>
      </div>

      {/* レポートプレビュー */}
      {reportData && !loading && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="mr-2 text-gray-600" size={20} />
            レポートプレビュー
          </h2>
          
          <div className="space-y-6">
            {/* サマリー */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">売上サマリー</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600">総売上</p>
                  <p className="text-lg font-bold text-blue-900">¥{reportData.summary.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600">総利益</p>
                  <p className="text-lg font-bold text-green-900">¥{reportData.summary.totalProfit.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-purple-600">利益率</p>
                  <p className="text-lg font-bold text-purple-900">{reportData.summary.profitMargin.toFixed(1)}%</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-orange-600">販売数</p>
                  <p className="text-lg font-bold text-orange-900">{reportData.summary.totalItemsSold}点</p>
                </div>
              </div>
            </div>

            {/* カテゴリ別売上 */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">カテゴリ別売上TOP5</h3>
              <div className="space-y-2">
                {reportData.summary.topCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-600">{category.count}点</span>
                      <span className="text-sm font-semibold text-gray-900">¥{category.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 在庫状況 */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">在庫状況</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {reportData.inventory.byStatus.map((status, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600">{status.status}</p>
                    <p className="text-base font-semibold text-gray-900">{status.count}点</p>
                    <p className="text-xs text-gray-500">¥{status.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 滞留商品 */}
            {reportData.inventory.slowMoving.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertCircle className="mr-2 text-yellow-600" size={16} />
                  60日以上滞留商品
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    {reportData.inventory.slowMoving.length}点の商品が60日以上在庫として滞留しています
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* エクスポートオプション */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Download className="mr-2 text-gray-600" size={20} />
          エクスポート
        </h2>
        <div className="flex gap-3">
          <button
            onClick={generatePDF}
            disabled={!reportData || generating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              !reportData || generating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <FileText size={18} />
            PDFで保存
          </button>
          <button
            onClick={exportToExcel}
            disabled={!reportData || generating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              !reportData || generating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <FileSpreadsheet size={18} />
            Excelで保存
          </button>
          <button
            disabled={!reportData || generating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              !reportData || generating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            <FilePlus size={18} />
            テンプレートとして保存
          </button>
        </div>
        {generating && (
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            レポートを生成中...
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;