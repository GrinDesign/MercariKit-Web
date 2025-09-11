import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product, PurchaseSession, StorePurchase } from '../types';
import { TrendingUp, Calendar, DollarSign, Package, PieChart, BarChart2, ChevronDown, ChevronRight, Database } from 'lucide-react';

interface MonthlyData {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
  itemsSold: number;
  avgPrice: number;
}

interface SessionData {
  sessionId: string;
  sessionTitle: string;
  productCost: number;     // 商品代金
  commonCost: number;      // 共通経費
  storeCost: number;       // 個別経費（店舗ごとの経費）
  totalCost: number;       // 総仕入金額
  itemCount: number;       // 商品数
  soldCount: number;       // 売却数
  listedCount: number;     // 出品中
  inStockCount: number;    // 在庫（未出品）
  discardedCount: number;  // 廃棄数
  totalRevenue: number;    // 売却額（回収額）
  profit: number;          // 収益
  achievementRate: number; // 達成率（回収額/総仕入額）
}

const Analytics: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<'monthly' | 'session' | 'bulk-discard'>('monthly');
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [sessionData, setSessionData] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  
  // 一括廃棄ツール用のstate
  const [sessions, setSessions] = useState<PurchaseSession[]>([]);
  const [storePurchases, setStorePurchases] = useState<StorePurchase[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedStorePurchaseId, setSelectedStorePurchaseId] = useState<string>('');
  const [productPrefix, setProductPrefix] = useState<string>('廃棄商品');
  const [productCount, setProductCount] = useState<number>(42);
  const [discardReason, setDiscardReason] = useState<string>('品質不良');
  const [discardDate, setDiscardDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (activeMenu === 'monthly') {
      fetchMonthlyData();
    } else if (activeMenu === 'session') {
      fetchSessionData();
    } else if (activeMenu === 'bulk-discard') {
      fetchBulkDiscardData();
    }
  }, [activeMenu]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      
      // 売却済み商品データを取得
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'sold')
        .order('sold_at', { ascending: false });

      if (error) throw error;

      // 月別に集計
      const monthlyMap = new Map<string, MonthlyData>();
      
      products?.forEach(product => {
        if (product.sold_at) {
          const date = new Date(product.sold_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          const existing = monthlyMap.get(monthKey) || {
            month: monthKey,
            revenue: 0,
            cost: 0,
            profit: 0,
            itemsSold: 0,
            avgPrice: 0
          };
          
          existing.revenue += product.sold_price || 0;
          existing.cost += product.allocated_cost || product.purchase_cost || 0;
          existing.profit = existing.revenue - existing.cost;
          existing.itemsSold += 1;
          
          monthlyMap.set(monthKey, existing);
        }
      });

      // 平均価格を計算
      monthlyMap.forEach(data => {
        data.avgPrice = data.itemsSold > 0 ? Math.round(data.revenue / data.itemsSold) : 0;
      });

      // ソートして配列に変換
      const sortedData = Array.from(monthlyMap.values())
        .sort((a, b) => b.month.localeCompare(a.month));

      setMonthlyData(sortedData);
    } catch (error) {
      console.error('月別データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      
      // セッション、店舗仕入れ、商品データを取得
      const { data: sessions, error: sessionError } = await supabase
        .from('purchase_sessions')
        .select('*');

      if (sessionError) throw sessionError;

      const { data: storePurchases, error: storeError } = await supabase
        .from('store_purchases')
        .select('*');

      if (storeError) throw storeError;

      const { data: products, error: productError } = await supabase
        .from('products')
        .select('*');

      if (productError) throw productError;

      // セッション別に集計
      const sessionMap = new Map<string, SessionData>();

      sessions?.forEach(session => {
        if (!session || !session.id) return;
        
        // このセッションの店舗仕入れを取得
        const sessionStores = storePurchases?.filter(sp => sp.session_id === session.id) || [];
        const storeIds = sessionStores.map(sp => sp.id);
        
        // 店舗仕入れに紐づく商品を取得
        const sessionProducts = products?.filter(p => 
          p.store_purchase_id && storeIds.includes(p.store_purchase_id)
        ) || [];

        // 集計
        // 商品代金の合計
        const productCost = sessionProducts.reduce((sum, p) => 
          sum + (p.purchase_cost || 0), 0
        );
        
        // 共通経費（輸送費、振込手数料、代行手数料）
        const commonCost = (session.transportation_cost || 0) + 
                          (session.transfer_fee || 0) + 
                          (session.agency_fee || 0);
        
        // 個別経費（店舗ごとの経費 - 今は0、将来的に店舗ごとの経費を追加可能）
        const storeCost = 0;
        
        // 総仕入金額
        const totalCost = productCost + commonCost + storeCost;

        // 商品のステータス別カウント
        const soldProducts = sessionProducts.filter(p => p.status === 'sold');
        const listedProducts = sessionProducts.filter(p => p.status === 'listed');
        const inStockProducts = sessionProducts.filter(p => 
          p.status === 'in_stock' || p.status === 'ready_to_list'
        );
        const discardedProducts = sessionProducts.filter(p => p.status === 'discarded');
        
        // 売却額（回収額）
        const totalRevenue = soldProducts.reduce((sum, p) => sum + (p.sold_price || 0), 0);
        
        // 収益
        const profit = totalRevenue - totalCost;
        
        // 達成率（回収額/総仕入額）
        const achievementRate = totalCost > 0 ? (totalRevenue / totalCost) * 100 : 0;

        sessionMap.set(session.id, {
          sessionId: session.id,
          sessionTitle: session.title || '',
          productCost: productCost || 0,
          commonCost: commonCost || 0,
          storeCost: storeCost || 0,
          totalCost: totalCost || 0,
          itemCount: sessionProducts.length || 0,
          soldCount: soldProducts.length || 0,
          listedCount: listedProducts.length || 0,
          inStockCount: inStockProducts.length || 0,
          discardedCount: discardedProducts.length || 0,
          totalRevenue: totalRevenue || 0,
          profit: profit || 0,
          achievementRate: Math.round(achievementRate) || 0
        });
      });

      const sortedSessionData = Array.from(sessionMap.values());

      setSessionData(sortedSessionData);
    } catch (error) {
      console.error('セッションデータ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBulkDiscardData = async () => {
    try {
      setLoading(true);
      
      const [sessionsRes, purchasesRes] = await Promise.all([
        supabase.from('purchase_sessions').select('*'),
        supabase.from('store_purchases').select('*')
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (purchasesRes.error) throw purchasesRes.error;

      setSessions(sessionsRes.data || []);
      setStorePurchases(purchasesRes.data || []);
    } catch (error) {
      console.error('一括廃棄データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAllocatedCostForBulk = async (storePurchaseId: string): Promise<number> => {
    try {
      // 選択された店舗仕入れの情報を取得
      const selectedStorePurchase = storePurchases.find(sp => sp.id === storePurchaseId);
      if (!selectedStorePurchase) return 0;

      // セッション情報を取得
      const session = sessions.find(s => s.id === selectedStorePurchase.session_id);
      if (!session) return 0;

      // 既存の商品数を取得
      const { data: existingProducts } = await supabase
        .from('products')
        .select('*')
        .eq('store_purchase_id', storePurchaseId);

      const existingCount = existingProducts?.length || 0;
      const totalItems = existingCount + productCount;

      // 按分計算（StorePurchaseDetailと同じロジック）
      const currentStoreAmount = selectedStorePurchase.total_amount || 0;
      const commonCosts = (session.transportation_cost || 0) + 
                         (session.transfer_fee || 0) + 
                         (session.agency_fee || 0);

      // 他の店舗仕入れも含めた総額を計算
      const sessionStores = storePurchases.filter(sp => sp.session_id === session.id);
      const totalAmount = sessionStores.reduce((sum, sp) => sum + (sp.total_amount || 0), 0);

      const allocatedCommonCost = totalAmount > 0 ? 
        (commonCosts * currentStoreAmount / totalAmount) : 0;

      const allocatedCostPerItem = Math.round((currentStoreAmount + allocatedCommonCost) / totalItems);

      return allocatedCostPerItem;
    } catch (error) {
      console.error('按分後単価計算エラー:', error);
      return 0;
    }
  };

  const handleBulkCreate = async () => {
    if (!selectedStorePurchaseId || productCount <= 0) {
      alert('店舗仕入れと作成数を選択してください');
      return;
    }

    try {
      setLoading(true);

      const allocatedCost = await calculateAllocatedCostForBulk(selectedStorePurchaseId);

      const products = [];
      for (let i = 1; i <= productCount; i++) {
        products.push({
          name: `${productPrefix}${String(i).padStart(3, '0')}`,
          store_purchase_id: selectedStorePurchaseId,
          category: 'その他',
          condition: '不明',
          purchase_cost: 0,
          allocated_cost: allocatedCost,
          initial_price: 0,
          current_price: 0,
          status: 'discarded',
          discarded_at: discardDate,
          notes: `一括作成による廃棄商品 - ${discardReason}`,
          photos: []
        });
      }

      const { error } = await supabase
        .from('products')
        .insert(products);

      if (error) throw error;

      alert(`${productCount}件の廃棄商品データを作成しました`);
      
      // リセット
      setSelectedSessionId('');
      setSelectedStorePurchaseId('');
      setProductCount(42);
      
    } catch (error) {
      console.error('一括作成エラー:', error);
      alert('作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) {
      return '¥0';
    }
    return `¥${amount.toLocaleString()}`;
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return `${year}年${parseInt(month)}月`;
  };

  const menuItems = [
    { id: 'monthly', label: '月別集計', icon: Calendar },
    { id: 'session', label: 'セッション別収益', icon: TrendingUp },
    { id: 'bulk-discard', label: '廃棄商品一括作成', icon: Database },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* サイドメニュー */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">分析</h2>
        </div>
        <nav className="mt-4">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id as 'monthly' | 'session' | 'bulk-discard')}
              className={`w-full px-6 py-3 text-left flex items-center space-x-3 transition-colors ${
                activeMenu === item.id
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="text-xl" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">データを読み込み中...</div>
            </div>
          ) : (
            <>
              {/* 月別集計 */}
              {activeMenu === 'monthly' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">月別集計</h1>
                  
                  {/* サマリーカード */}
                  <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">今月の売上</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {formatCurrency(monthlyData[0]?.revenue || 0)}
                          </p>
                        </div>
                        <DollarSign className="text-3xl text-green-500" />
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">今月の利益</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {formatCurrency(monthlyData[0]?.profit || 0)}
                          </p>
                        </div>
                        <TrendingUp className="text-3xl text-blue-500" />
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">販売数</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {monthlyData[0]?.itemsSold || 0}
                          </p>
                        </div>
                        <Package className="text-3xl text-purple-500" />
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">平均単価</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {formatCurrency(monthlyData[0]?.avgPrice || 0)}
                          </p>
                        </div>
                        <PieChart className="text-3xl text-orange-500" />
                      </div>
                    </div>
                  </div>

                  {/* 月別テーブル */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            月
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            売上
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            原価
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            利益
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            利益率
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            販売数
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            平均単価
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {monthlyData.map((data) => (
                          <tr key={data.month} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatMonth(data.month)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {formatCurrency(data.revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {formatCurrency(data.cost)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                              {formatCurrency(data.profit)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {data.revenue > 0 ? Math.round((data.profit / data.revenue) * 100) : 0}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {data.itemsSold}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {formatCurrency(data.avgPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* セッション別収益 */}
              {activeMenu === 'session' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">セッション別収益</h1>
                  
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            セッション
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            販売/出品/在庫/廃棄
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            仕入額
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            回収額
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            現在損益
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            達成率
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sessionData.map((session) => (
                          <React.Fragment key={session.sessionId}>
                            <tr className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => setExpandedSession(
                                    expandedSession === session.sessionId ? null : session.sessionId
                                  )}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  {expandedSession === session.sessionId ? 
                                    <ChevronDown className="w-5 h-5" /> : 
                                    <ChevronRight className="w-5 h-5" />
                                  }
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {session.sessionTitle}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <span className="text-green-600 font-medium">{session.soldCount}</span>
                                <span className="text-gray-400">/</span>
                                <span className="text-blue-600">{session.listedCount}</span>
                                <span className="text-gray-400">/</span>
                                <span className="text-gray-600">{session.inStockCount}</span>
                                <span className="text-gray-400">/</span>
                                <span className="text-red-400">{session.discardedCount}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {formatCurrency(session.totalCost)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {formatCurrency(session.totalRevenue)}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                                session.profit >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(session.profit)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <span className={`font-medium ${
                                    session.achievementRate >= 100 ? 'text-green-600' : 
                                    session.achievementRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {session.achievementRate}%
                                  </span>
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all ${
                                        session.achievementRate >= 100 ? 'bg-green-500' :
                                        session.achievementRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${Math.min(session.achievementRate, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                            {expandedSession === session.sessionId && (
                              <tr>
                                <td colSpan={7} className="px-6 py-4 bg-gray-50">
                                  <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg">
                                    <div>
                                      <h4 className="font-semibold text-gray-700 mb-2">費用内訳</h4>
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">商品代金:</span>
                                          <span className="font-medium">{formatCurrency(session.productCost)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">共通経費:</span>
                                          <span className="font-medium">{formatCurrency(session.commonCost)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">個別経費:</span>
                                          <span className="font-medium">{formatCurrency(session.storeCost)}</span>
                                        </div>
                                        <div className="border-t pt-1 flex justify-between text-sm font-semibold">
                                          <span className="text-gray-700">合計:</span>
                                          <span>{formatCurrency(session.totalCost)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-700 mb-2">収益分析</h4>
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">売却状況:</span>
                                          <span className="font-medium">{session.soldCount} / {session.itemCount} 点</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">売上額:</span>
                                          <span className="font-medium">{formatCurrency(session.totalRevenue)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">総仕入額:</span>
                                          <span className="font-medium">-{formatCurrency(session.totalCost)}</span>
                                        </div>
                                        <div className="border-t pt-1 flex justify-between text-sm font-semibold">
                                          <span className="text-gray-700">利益:</span>
                                          <span className={session.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            {formatCurrency(session.profit)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">利益率:</span>
                                          <span className="font-medium">
                                            {session.totalRevenue > 0 ? 
                                              Math.round((session.profit / session.totalRevenue) * 100) : 0}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 廃棄商品一括作成 */}
              {activeMenu === 'bulk-discard' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">廃棄商品データ一括作成ツール</h1>
                  <p className="text-gray-600 mb-6">過去データ整理用：商品データが存在しない廃棄商品を一括で作成します</p>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 左側：設定フォーム */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">作成設定</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              対象セッション
                            </label>
                            <select
                              value={selectedSessionId}
                              onChange={(e) => {
                                setSelectedSessionId(e.target.value);
                                setSelectedStorePurchaseId('');
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">セッションを選択してください</option>
                              {sessions.map(session => (
                                <option key={session.id} value={session.id}>
                                  {session.title}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              対象店舗仕入
                            </label>
                            <select
                              value={selectedStorePurchaseId}
                              onChange={(e) => setSelectedStorePurchaseId(e.target.value)}
                              disabled={!selectedSessionId}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            >
                              <option value="">店舗仕入を選択してください</option>
                              {storePurchases
                                .filter(sp => sp.session_id === selectedSessionId)
                                .map(storePurchase => (
                                  <option key={storePurchase.id} value={storePurchase.id}>
                                    {formatCurrency(storePurchase.total_amount)} - {storePurchase.payment_notes || '店舗仕入'}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              商品名プレフィックス
                            </label>
                            <input
                              type="text"
                              value={productPrefix}
                              onChange={(e) => setProductPrefix(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              作成個数
                            </label>
                            <input
                              type="number"
                              value={productCount}
                              onChange={(e) => setProductCount(Number(e.target.value))}
                              min="1"
                              max="1000"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              廃棄理由
                            </label>
                            <select
                              value={discardReason}
                              onChange={(e) => setDiscardReason(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="品質不良">品質不良</option>
                              <option value="需要なし">需要なし</option>
                              <option value="季節外れ">季節外れ</option>
                              <option value="その他">その他</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              廃棄日
                            </label>
                            <input
                              type="date"
                              value={discardDate}
                              onChange={(e) => setDiscardDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 右側：プレビュー */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">プレビュー</h3>
                        
                        {selectedStorePurchaseId && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">商品名例:</span>
                                <div className="ml-4 text-gray-600">
                                  • {productPrefix}001<br/>
                                  • {productPrefix}002<br/>
                                  • ...<br/>
                                  • {productPrefix}{String(productCount).padStart(3, '0')}
                                </div>
                              </div>
                              
                              <div className="border-t pt-2">
                                <span className="font-medium">作成データ:</span>
                                <div className="ml-4 text-gray-600">
                                  • 個数: {productCount}件<br/>
                                  • 商品仕入価格: ¥0（一括仕入のため）<br/>
                                  • ステータス: 廃棄<br/>
                                  • 廃棄理由: {discardReason}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-6">
                          <button
                            onClick={handleBulkCreate}
                            disabled={!selectedStorePurchaseId || productCount <= 0 || loading}
                            className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {loading ? '作成中...' : `${productCount}件の廃棄商品データを作成`}
                          </button>
                        </div>

                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⚠️ 注意: この操作は取り消せません。作成前に設定内容をご確認ください。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;