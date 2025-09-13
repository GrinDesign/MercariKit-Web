import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, TrendingUp, Calendar, Package, DollarSign, Target, BarChart3, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface StoreData {
  id: string;
  name: string;
  total_purchases: number;
  total_amount: number;
  total_items: number;
  total_sold: number;
  total_revenue: number;
  total_profit: number;
  avg_profit_rate: number;
  avg_roi: number;
  last_purchase_date: string | null;
}

interface MonthlyData {
  month: string;
  purchases: number;
  items: number;
  amount: number;
  sold: number;
  revenue: number;
  profit: number;
  profit_rate: number;
  roi: number;
}

interface SessionData {
  session_id: string;
  session_title: string;
  session_date: string;
  purchases: number;
  items: number;
  amount: number;
  sold: number;
  revenue: number;
  profit: number;
  profit_rate: number;
}

interface ComparisonData {
  rank: number;
  totalStores: number;
  avgRoi: number;
  avgProfitRate: number;
  avgTurnoverDays: number;
  recommendation: 'S' | 'A' | 'B' | 'C' | 'D';
  recommendationText: string;
}

interface CategoryAnalysis {
  category: string;
  totalItems: number;
  soldItems: number;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  roi: number;
  sellThroughRate: number;
}

interface BrandAnalysis {
  brand: string;
  totalItems: number;
  soldItems: number;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  roi: number;
  sellThroughRate: number;
}

interface PriceRangeAnalysis {
  priceRange: string;
  totalItems: number;
  soldItems: number;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  roi: number;
  sellThroughRate: number;
}

const StoreAnalysis: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [sessionData, setSessionData] = useState<SessionData[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>([]);
  const [brandAnalysis, setBrandAnalysis] = useState<BrandAnalysis[]>([]);
  const [priceRangeAnalysis, setPriceRangeAnalysis] = useState<PriceRangeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeId) {
      fetchStoreAnalysis();
    }
  }, [storeId]);

  const fetchStoreAnalysis = async () => {
    if (!storeId) return;

    try {
      // 店舗購入データと関連商品、店舗情報を取得
      const { data: purchases, error: purchaseError } = await supabase
        .from('store_purchases')
        .select(`
          *,
          purchase_sessions(id, title),
          products(id, status, allocated_cost, purchase_cost, sold_price),
          stores(name)
        `)
        .eq('store_id', storeId);

      if (purchaseError) throw purchaseError;

      console.log('Purchases data:', purchases); // デバッグ用
      console.log('First purchase stores data:', purchases?.[0]?.stores); // デバッグ用

      // 店舗データの集計
      let totalAmount = 0;
      let totalItems = 0;
      let totalSold = 0;
      let totalRevenue = 0;
      let totalProfit = 0;
      const sessionMap: Record<string, SessionData> = {};
      const monthlyMap: Record<string, MonthlyData> = {};

      purchases?.forEach(purchase => {
        const purchaseAmount = (purchase.product_amount || 0) + 
                              (purchase.shipping_cost || 0) + 
                              (purchase.commission_fee || 0);
        const itemCount = purchase.item_count || 0;

        totalAmount += purchaseAmount;
        totalItems += itemCount;

        // 商品の売却データ集計
        let soldCount = 0;
        let soldAmount = 0;
        purchase.products?.forEach((product: any) => {
          if (product.status === 'sold') {
            soldCount++;
            soldAmount += product.sold_price || 0;
          }
        });

        totalSold += soldCount;
        totalRevenue += soldAmount;
        totalProfit += (soldAmount - purchaseAmount);

        // セッション別集計
        const sessionId = purchase.purchase_sessions?.id;
        if (sessionId && purchase.purchase_sessions) {
          if (!sessionMap[sessionId]) {
            sessionMap[sessionId] = {
              session_id: sessionId,
              session_title: purchase.purchase_sessions.title || 'Untitled Session',
              session_date: purchase.purchase_date || purchase.created_at || '',
              purchases: 0,
              items: 0,
              amount: 0,
              sold: 0,
              revenue: 0,
              profit: 0,
              profit_rate: 0
            };
          }

          const session = sessionMap[sessionId];
          session.purchases++;
          session.items += itemCount;
          session.amount += purchaseAmount;
          session.sold += soldCount;
          session.revenue += soldAmount;
          session.profit += (soldAmount - purchaseAmount);
        }

        // 月次集計（purchase_dateまたはcreated_atを使用）
        const purchaseDate = purchase.purchase_date || purchase.created_at;
        if (purchaseDate) {
          const monthKey = format(new Date(purchaseDate), 'yyyy-MM');
          
          if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = {
              month: monthKey,
              purchases: 0,
              items: 0,
              amount: 0,
              sold: 0,
              revenue: 0,
              profit: 0,
              profit_rate: 0,
              roi: 0
            };
          }

          const monthly = monthlyMap[monthKey];
          monthly.purchases++;
          monthly.items += itemCount;
          monthly.amount += purchaseAmount;
          monthly.sold += soldCount;
          monthly.revenue += soldAmount;
          monthly.profit += (soldAmount - purchaseAmount);
        }
      });

      // 利益率とROIの計算
      Object.values(sessionMap).forEach(session => {
        session.profit_rate = session.revenue > 0 ? (session.profit / session.revenue) * 100 : 0;
      });

      Object.values(monthlyMap).forEach(monthly => {
        monthly.profit_rate = monthly.revenue > 0 ? (monthly.profit / monthly.revenue) * 100 : 0;
        monthly.roi = monthly.amount > 0 ? (monthly.profit / monthly.amount) * 100 : 0;
      });

      const avgProfitRate = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
      const avgRoi = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0;

      const lastPurchaseDate = purchases && purchases.length > 0 
        ? purchases.reduce((latest, p) => {
            const date = p.purchase_date || p.created_at;
            return date && (!latest || date > latest) ? date : latest;
          }, null as string | null)
        : null;

      // JOINした店舗データから店舗名を取得（最初のレコードから）
      const storeName = purchases && purchases.length > 0 && purchases[0].stores
        ? purchases[0].stores.name || 'Unknown Store'
        : 'Unknown Store';

      setStoreData({
        id: storeId,
        name: storeName,
        total_purchases: purchases?.length || 0,
        total_amount: totalAmount,
        total_items: totalItems,
        total_sold: totalSold,
        total_revenue: totalRevenue,
        total_profit: totalProfit,
        avg_profit_rate: avgProfitRate,
        avg_roi: avgRoi,
        last_purchase_date: lastPurchaseDate
      });

      setSessionData(Object.values(sessionMap).sort((a, b) => 
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
      ));

      setMonthlyData(Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month)));

      // 店舗比較データを取得
      await fetchComparisonData(avgRoi, avgProfitRate);

      // 商品分析データを取得
      await fetchProductAnalysis(purchases);

    } catch (error) {
      console.error('Error fetching store analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisonData = async (currentRoi: number, currentProfitRate: number) => {
    try {
      // 全店舗の購入データを取得して比較データを作成
      const { data: allStores, error } = await supabase
        .from('stores')
        .select('id, name');

      if (error) throw error;

      if (!allStores) return;

      // 各店舗のROIと利益率を計算
      const storeStats = [];
      
      for (const store of allStores) {
        const { data: storePurchases } = await supabase
          .from('store_purchases')
          .select(`
            *,
            products(status, sold_price)
          `)
          .eq('store_id', store.id);

        if (storePurchases && storePurchases.length > 0) {
          let totalAmount = 0;
          let totalRevenue = 0;
          let totalProfit = 0;

          storePurchases.forEach(purchase => {
            const purchaseAmount = (purchase.product_amount || 0) + 
                                  (purchase.shipping_cost || 0) + 
                                  (purchase.commission_fee || 0);
            totalAmount += purchaseAmount;

            purchase.products?.forEach((product: any) => {
              if (product.status === 'sold') {
                const soldPrice = product.sold_price || 0;
                totalRevenue += soldPrice;
                totalProfit += (soldPrice - purchaseAmount);
              }
            });
          });

          const roi = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0;
          const profitRate = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
          
          storeStats.push({ storeId: store.id, roi, profitRate });
        }
      }

      // ROIでソートしてランキングを計算
      storeStats.sort((a, b) => b.roi - a.roi);
      const currentStoreRank = storeStats.findIndex(s => s.storeId === storeId) + 1;
      
      // 平均値を計算
      const avgRoi = storeStats.reduce((sum, s) => sum + s.roi, 0) / storeStats.length;
      const avgProfitRate = storeStats.reduce((sum, s) => sum + s.profitRate, 0) / storeStats.length;

      // 推奨ランクを計算
      let recommendation: 'S' | 'A' | 'B' | 'C' | 'D';
      let recommendationText: string;

      if (currentRoi >= avgRoi + 20) {
        recommendation = 'S';
        recommendationText = '優秀な店舗です。積極的に仕入れを継続しましょう。';
      } else if (currentRoi >= avgRoi + 10) {
        recommendation = 'A';
        recommendationText = '良い成績の店舗です。継続して利用することをお勧めします。';
      } else if (currentRoi >= avgRoi) {
        recommendation = 'B';
        recommendationText = '平均的な店舗です。状況を見ながら利用しましょう。';
      } else if (currentRoi >= avgRoi - 10) {
        recommendation = 'C';
        recommendationText = '平均を下回っています。仕入れ戦略の見直しを検討しましょう。';
      } else {
        recommendation = 'D';
        recommendationText = '成績が良くありません。この店舗の利用を避けることを検討してください。';
      }

      setComparisonData({
        rank: currentStoreRank,
        totalStores: storeStats.length,
        avgRoi,
        avgProfitRate,
        avgTurnoverDays: 30, // 仮値
        recommendation,
        recommendationText
      });

    } catch (error) {
      console.error('Error fetching comparison data:', error);
    }
  };

  const fetchProductAnalysis = async (purchases: any[]) => {
    try {
      // カテゴリ別分析
      const categoryMap: Record<string, CategoryAnalysis> = {};
      // ブランド別分析  
      const brandMap: Record<string, BrandAnalysis> = {};
      // 価格帯別分析
      const priceRangeMap: Record<string, PriceRangeAnalysis> = {};

      purchases?.forEach(purchase => {
        const purchaseAmount = (purchase.product_amount || 0) + 
                              (purchase.shipping_cost || 0) + 
                              (purchase.commission_fee || 0);

        purchase.products?.forEach((product: any) => {
          const category = product.category || 'その他';
          const brand = product.brand || 'ノーブランド';
          const priceRange = getPriceRange(product.sold_price || product.current_price || 0);
          const isSold = product.status === 'sold';
          const cost = purchaseAmount / (purchase.products?.length || 1); // 商品数で割る
          const revenue = isSold ? (product.sold_price || 0) : 0;
          const profit = revenue - cost;

          // カテゴリ別集計
          if (!categoryMap[category]) {
            categoryMap[category] = {
              category,
              totalItems: 0,
              soldItems: 0,
              totalCost: 0,
              totalRevenue: 0,
              profit: 0,
              roi: 0,
              sellThroughRate: 0
            };
          }
          const catData = categoryMap[category];
          catData.totalItems++;
          if (isSold) catData.soldItems++;
          catData.totalCost += cost;
          catData.totalRevenue += revenue;
          catData.profit += profit;

          // ブランド別集計
          if (!brandMap[brand]) {
            brandMap[brand] = {
              brand,
              totalItems: 0,
              soldItems: 0,
              totalCost: 0,
              totalRevenue: 0,
              profit: 0,
              roi: 0,
              sellThroughRate: 0
            };
          }
          const brandData = brandMap[brand];
          brandData.totalItems++;
          if (isSold) brandData.soldItems++;
          brandData.totalCost += cost;
          brandData.totalRevenue += revenue;
          brandData.profit += profit;

          // 価格帯別集計
          if (!priceRangeMap[priceRange]) {
            priceRangeMap[priceRange] = {
              priceRange,
              totalItems: 0,
              soldItems: 0,
              totalCost: 0,
              totalRevenue: 0,
              profit: 0,
              roi: 0,
              sellThroughRate: 0
            };
          }
          const priceData = priceRangeMap[priceRange];
          priceData.totalItems++;
          if (isSold) priceData.soldItems++;
          priceData.totalCost += cost;
          priceData.totalRevenue += revenue;
          priceData.profit += profit;
        });
      });

      // ROIと売却率の計算
      Object.values(categoryMap).forEach(data => {
        data.roi = data.totalCost > 0 ? (data.profit / data.totalCost) * 100 : 0;
        data.sellThroughRate = data.totalItems > 0 ? (data.soldItems / data.totalItems) * 100 : 0;
      });

      Object.values(brandMap).forEach(data => {
        data.roi = data.totalCost > 0 ? (data.profit / data.totalCost) * 100 : 0;
        data.sellThroughRate = data.totalItems > 0 ? (data.soldItems / data.totalItems) * 100 : 0;
      });

      Object.values(priceRangeMap).forEach(data => {
        data.roi = data.totalCost > 0 ? (data.profit / data.totalCost) * 100 : 0;
        data.sellThroughRate = data.totalItems > 0 ? (data.soldItems / data.totalItems) * 100 : 0;
      });

      // ROIでソート
      setCategoryAnalysis(Object.values(categoryMap).sort((a, b) => b.roi - a.roi));
      setBrandAnalysis(Object.values(brandMap).sort((a, b) => b.roi - a.roi));
      setPriceRangeAnalysis(Object.values(priceRangeMap).sort((a, b) => b.roi - a.roi));

    } catch (error) {
      console.error('Error fetching product analysis:', error);
    }
  };

  const getPriceRange = (price: number): string => {
    if (price === 0) return '未設定';
    if (price < 1000) return '~999円';
    if (price < 3000) return '1,000~2,999円';
    if (price < 5000) return '3,000~4,999円';
    if (price < 10000) return '5,000~9,999円';
    if (price < 20000) return '10,000~19,999円';
    if (price < 50000) return '20,000~49,999円';
    return '50,000円~';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">
          店舗データが見つかりません
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/stores')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>店舗一覧に戻る</span>
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center space-x-2">
            <Store size={24} className="text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">{storeData.name}</h1>
          </div>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="text-blue-600" size={20} />
            <span className="text-sm font-medium text-gray-600">総仕入</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{storeData.total_purchases}回</div>
          <div className="text-sm text-gray-500">{storeData.total_items}点</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="text-green-600" size={20} />
            <span className="text-sm font-medium text-gray-600">総仕入額（経費込み）</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">¥{storeData.total_amount.toLocaleString()}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="text-purple-600" size={20} />
            <span className="text-sm font-medium text-gray-600">売上・利益</span>
          </div>
          <div className="text-2xl font-bold text-green-600">¥{storeData.total_revenue.toLocaleString()}</div>
          <div className="text-sm text-gray-600">利益: ¥{storeData.total_profit.toLocaleString()}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="text-orange-600" size={20} />
            <span className="text-sm font-medium text-gray-600">ROI</span>
          </div>
          <div className={`text-2xl font-bold ${storeData.avg_roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {storeData.avg_roi.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">利益率: {storeData.avg_profit_rate.toFixed(1)}%</div>
        </div>
      </div>

      {/* 店舗比較・評価 */}
      {comparisonData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Award size={20} className="text-yellow-600" />
            <span>店舗評価・ランキング</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ランキング */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">全店舗中のランキング</div>
              <div className="text-3xl font-bold text-blue-600">
                {comparisonData.rank}位
              </div>
              <div className="text-sm text-gray-500">/ {comparisonData.totalStores}店舗</div>
            </div>

            {/* 評価ランク */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">総合評価</div>
              <div className={`text-4xl font-bold ${
                comparisonData.recommendation === 'S' ? 'text-purple-600' :
                comparisonData.recommendation === 'A' ? 'text-green-600' :
                comparisonData.recommendation === 'B' ? 'text-blue-600' :
                comparisonData.recommendation === 'C' ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {comparisonData.recommendation}
              </div>
              <div className="text-sm text-gray-500 mt-1">ランク</div>
            </div>

            {/* 平均との比較 */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">平均ROI</div>
              <div className="flex items-center justify-center space-x-2">
                <div className={`text-xl font-bold ${storeData.avg_roi >= comparisonData.avgRoi ? 'text-green-600' : 'text-red-600'}`}>
                  {storeData.avg_roi.toFixed(1)}%
                </div>
                <div className="text-gray-400">vs</div>
                <div className="text-xl font-bold text-gray-600">
                  {comparisonData.avgRoi.toFixed(1)}%
                </div>
              </div>
              <div className={`text-sm ${storeData.avg_roi >= comparisonData.avgRoi ? 'text-green-600' : 'text-red-600'}`}>
                {storeData.avg_roi >= comparisonData.avgRoi ? '平均を上回る' : '平均を下回る'}
              </div>
            </div>
          </div>

          {/* 推奨メッセージ */}
          <div className={`mt-6 p-4 rounded-lg ${
            comparisonData.recommendation === 'S' || comparisonData.recommendation === 'A' ? 'bg-green-50 border border-green-200' :
            comparisonData.recommendation === 'B' ? 'bg-blue-50 border border-blue-200' :
            comparisonData.recommendation === 'C' ? 'bg-orange-50 border border-orange-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <div className={`text-sm ${
              comparisonData.recommendation === 'S' || comparisonData.recommendation === 'A' ? 'text-green-800' :
              comparisonData.recommendation === 'B' ? 'text-blue-800' :
              comparisonData.recommendation === 'C' ? 'text-orange-800' :
              'text-red-800'
            }`}>
              <strong>推奨:</strong> {comparisonData.recommendationText}
            </div>
          </div>
        </div>
      )}

      {/* 月次トレンド */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <BarChart3 size={20} className="text-blue-600" />
            <span>月次トレンド</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">月</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">仕入</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">点数</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">仕入額（経費込み）</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">売却済み</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">売上</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">利益</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">ROI</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((data) => (
                  <tr key={data.month} className="border-b border-gray-100">
                    <td className="py-3 text-sm">{data.month}</td>
                    <td className="py-3 text-sm text-right">{data.purchases}回</td>
                    <td className="py-3 text-sm text-right">{data.items}点</td>
                    <td className="py-3 text-sm text-right">¥{data.amount.toLocaleString()}</td>
                    <td className="py-3 text-sm text-right">{data.sold}点</td>
                    <td className="py-3 text-sm text-right">¥{data.revenue.toLocaleString()}</td>
                    <td className={`py-3 text-sm text-right ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ¥{data.profit.toLocaleString()}
                    </td>
                    <td className={`py-3 text-sm text-right font-medium ${data.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.roi.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 商品分析 */}
      {(categoryAnalysis.length > 0 || brandAnalysis.length > 0 || priceRangeAnalysis.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Package size={20} className="text-purple-600" />
            <span>商品分析</span>
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* カテゴリ別分析 */}
            {categoryAnalysis.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">カテゴリ別パフォーマンス</h4>
                <div className="space-y-2">
                  {categoryAnalysis.slice(0, 5).map((item, index) => (
                    <div key={item.category} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.category}</span>
                        <span className={`text-sm font-bold ${item.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ROI: {item.roi.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{item.totalItems}点 (売却: {item.soldItems}点)</span>
                        <span>売却率: {item.sellThroughRate.toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        利益: ¥{item.profit.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ブランド別分析 */}
            {brandAnalysis.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">ブランド別パフォーマンス</h4>
                <div className="space-y-2">
                  {brandAnalysis.slice(0, 5).map((item, index) => (
                    <div key={item.brand} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.brand}</span>
                        <span className={`text-sm font-bold ${item.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ROI: {item.roi.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{item.totalItems}点 (売却: {item.soldItems}点)</span>
                        <span>売却率: {item.sellThroughRate.toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        利益: ¥{item.profit.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 価格帯別分析 */}
            {priceRangeAnalysis.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">価格帯別パフォーマンス</h4>
                <div className="space-y-2">
                  {priceRangeAnalysis.slice(0, 5).map((item, index) => (
                    <div key={item.priceRange} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.priceRange}</span>
                        <span className={`text-sm font-bold ${item.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ROI: {item.roi.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{item.totalItems}点 (売却: {item.soldItems}点)</span>
                        <span>売却率: {item.sellThroughRate.toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        利益: ¥{item.profit.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* セッション別詳細 */}
      {sessionData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Calendar size={20} className="text-green-600" />
            <span>セッション別詳細</span>
          </h3>
          <div className="space-y-3">
            {sessionData.map((session) => (
              <div key={session.session_id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900">{session.session_title}</h4>
                    <span className="text-sm text-gray-500">
                      {format(new Date(session.session_date), 'yyyy年MM月dd日')}
                    </span>
                  </div>
                  <Link
                    to={`/products/session/${session.session_id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    詳細 →
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">仕入点数</div>
                    <div className="font-semibold">{session.items}点</div>
                  </div>
                  <div>
                    <div className="text-gray-500">仕入額（経費込み）</div>
                    <div className="font-semibold">¥{session.amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">売却済み</div>
                    <div className="font-semibold text-green-600">{session.sold}点</div>
                  </div>
                  <div>
                    <div className="text-gray-500">売上</div>
                    <div className="font-semibold text-green-600">¥{session.revenue.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">利益</div>
                    <div className={`font-semibold ${session.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ¥{session.profit.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">利益率</div>
                    <div className={`font-semibold ${session.profit_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {session.profit_rate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreAnalysis;