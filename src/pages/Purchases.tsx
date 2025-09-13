import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Package, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PurchaseSession, StorePurchase } from '../types/index';
import { format } from 'date-fns';

const Purchases: React.FC = () => {
  const [sessions, setSessions] = useState<PurchaseSession[]>([]);
  const [storePurchases, setStorePurchases] = useState<StorePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<PurchaseSession | null>(null);
  const [sessionFormData, setSessionFormData] = useState({
    title: '',
    session_date: format(new Date(), 'yyyy-MM-dd'),
    transportation_cost: 0,
    transfer_fee: 0,
    agency_fee: 0,
    status: 'active' as PurchaseSession['status']
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // まずテーブル構造を確認
      const { data: testData, error: testError } = await supabase
        .from('purchase_sessions')
        .select('*')
        .limit(1);
      
      console.log('purchase_sessions test:', testData, testError);
      
      const [sessionsRes, purchasesRes] = await Promise.all([
        supabase.from('purchase_sessions').select('*'),
        supabase.from('store_purchases').select('*')
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (purchasesRes.error) throw purchasesRes.error;
      
      const validSessions = (sessionsRes.data || []).filter(session => session && session.id);
      console.log('有効なセッション:', validSessions);
      
      setSessions(validSessions);
      setStorePurchases(purchasesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSession) {
        // 編集の場合
        const { error } = await supabase
          .from('purchase_sessions')
          .update(sessionFormData)
          .eq('id', editingSession.id);
        
        if (error) throw error;
      } else {
        // 新規作成の場合
        const { error } = await supabase
          .from('purchase_sessions')
          .insert([sessionFormData]);
        
        if (error) throw error;
      }
      
      setShowSessionForm(false);
      setEditingSession(null);
      setSessionFormData({
        title: '',
        session_date: format(new Date(), 'yyyy-MM-dd'),
        transportation_cost: 0,
        transfer_fee: 0,
        agency_fee: 0,
        status: 'active'
      });
      fetchData();
    } catch (error: any) {
      console.error('Error saving session:', error);
      alert(`セッション保存エラー: ${error.message || '不明なエラーが発生しました'}`);
    }
  };

  const handleEditSession = (session: PurchaseSession) => {
    setEditingSession(session);
    setSessionFormData({
      title: session.title,
      session_date: session.session_date,
      transportation_cost: session.transportation_cost || 0,
      transfer_fee: session.transfer_fee || 0,
      agency_fee: session.agency_fee || 0,
      status: session.status
    });
    setShowSessionForm(true);
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('このセッションを削除しますか？')) return;
    
    try {
      const { error } = await supabase
        .from('purchase_sessions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const getSessionStats = (sessionId: string) => {
    const purchases = storePurchases.filter(p => p.session_id === sessionId);
    // Calculate total amount using the correct field names from updated schema
    const totalAmount = purchases.reduce((sum, p) => {
      const productCost = p.product_cost || 0;
      const shippingCost = p.shipping_cost || 0;
      const commissionFee = p.commission_fee || 0;
      return sum + productCost + shippingCost + commissionFee;
    }, 0);
    const totalItems = purchases.reduce((sum, p) => sum + (p.item_count || 0), 0);
    return { purchaseCount: purchases.length, totalAmount: totalAmount || 0, totalItems };
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">仕入管理</h1>
          <p className="text-gray-600 mt-2">全 {sessions.length} セッション</p>
        </div>
        <button
          onClick={() => setShowSessionForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>新規セッション</span>
        </button>
      </div>

      {showSessionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingSession ? 'セッション編集' : '新規セッション作成'}
            </h2>
            <form onSubmit={handleSessionSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル *
                </label>
                <input
                  type="text"
                  value={sessionFormData.title}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 新宿仕入れ"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  仕入日 *
                </label>
                <input
                  type="date"
                  value={sessionFormData.session_date}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, session_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    交通費
                  </label>
                  <input
                    type="number"
                    value={sessionFormData.transportation_cost || ''}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, transportation_cost: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    振込手数料
                  </label>
                  <input
                    type="number"
                    value={sessionFormData.transfer_fee || ''}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, transfer_fee: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    代行料
                  </label>
                  <input
                    type="number"
                    value={sessionFormData.agency_fee || ''}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, agency_fee: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <select
                  value={sessionFormData.status}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, status: e.target.value as 'active' | 'completed' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">進行中</option>
                  <option value="completed">完了</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSessionForm(false);
                    setEditingSession(null);
                    setSessionFormData({
                      title: '',
                      transportation_cost: 0,
                      transfer_fee: 0,
                      agency_fee: 0,
                      status: 'active'
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSession ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            セッションがありません
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sessions.map((session) => {
              const stats = getSessionStats(session.id);
              const totalCost = (session.transportation_cost || 0) + (session.transfer_fee || 0) + (session.agency_fee || 0);
              
              return (
                <Link key={session.id} to={`/purchases/${session.id}`} className="block">
                  <div className="p-6 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Calendar className="text-gray-500" size={20} />
                        <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {session.status === 'active' ? '作業中' : '完了'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">店舗数</div>
                          <div className="text-lg font-semibold">{stats.purchaseCount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">商品数</div>
                          <div className="text-lg font-semibold">{stats.totalItems}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">仕入額</div>
                          <div className="text-lg font-semibold">¥{(stats.totalAmount || 0).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">共通経費</div>
                          <div className="text-lg font-semibold">¥{(totalCost || 0).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">合計</div>
                          <div className="text-lg font-semibold text-blue-600">
                            ¥{((stats.totalAmount || 0) + (totalCost || 0)).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                      <div className="flex items-center space-x-2 ml-4">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditSession(session);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Purchases;