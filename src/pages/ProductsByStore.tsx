import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Package, Eye, Edit, List, Grid, ChevronRight, Gem, Zap, Plus, Upload, Tag, ShoppingCart, CheckCircle, Pause, Trash2, ClipboardList } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PurchaseSession, StorePurchase, Store as StoreType, Product } from '../types/index';
import { format } from 'date-fns';

type ViewMode = 'cards' | 'table';
type StatusFilter = 'all' | 'in_stock' | 'ready_to_list' | 'listed' | 'sold' | 'on_hold' | 'discarded';

interface StatusCard {
  status: string;
  label: string;
  count: number;
  color: string;
  description: string;
}

const ProductsByStore: React.FC = () => {
  const { sessionId, storeId } = useParams<{ sessionId: string; storeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<PurchaseSession | null>(null);
  const [store, setStore] = useState<StoreType | null>(null);
  const [storePurchase, setStorePurchase] = useState<StorePurchase | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [assetTypeFilter, setAssetTypeFilter] = useState<'all' | 'asset' | 'quick_turn'>('all');

  useEffect(() => {
    if (sessionId && storeId) {
      fetchData();
    }
  }, [sessionId, storeId]);

  const fetchData = async () => {
    if (!sessionId || !storeId) return;

    try {
      // セッション情報を取得
      const { data: sessionData, error: sessionError } = await supabase
        .from('purchase_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // 店舗情報を取得
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (storeError) throw storeError;

      // 店舗購入情報を取得
      const { data: storePurchaseData, error: storePurchaseError } = await supabase
        .from('store_purchases')
        .select('*')
        .eq('session_id', sessionId)
        .eq('store_id', storeId)
        .single();

      if (storePurchaseError) throw storePurchaseError;

      // 商品一覧を取得（店舗購入情報も含む）
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          store_purchases:store_purchase_id (
            purchase_date
          )
        `)
        .eq('store_purchase_id', storePurchaseData.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      setSession(sessionData);
      setStore(storeData);
      setStorePurchase(storePurchaseData);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRegistrationStatus = () => {
    const totalExpected = storePurchase?.item_count || 0;
    const registeredCount = products.length;
    const unregisteredCount = totalExpected - registeredCount;
    const progressPercentage = totalExpected > 0 ? (registeredCount / totalExpected) * 100 : 0;
    
    return {
      totalExpected,
      registeredCount,
      unregisteredCount,
      progressPercentage
    };
  };

  const getStatusCards = (): (StatusCard & { icon: React.ReactNode; actionText: string; actionColor: string })[] => {
    const statusCounts = {
      in_stock: 0,
      ready_to_list: 0,
      listed: 0,
      sold: 0,
      on_hold: 0,
      discarded: 0
    };

    products.forEach(product => {
      if (statusCounts.hasOwnProperty(product.status)) {
        statusCounts[product.status as keyof typeof statusCounts]++;
      }
    });

    return [
      {
        status: 'in_stock',
        label: '在庫',
        count: statusCounts.in_stock,
        color: 'bg-gray-50 text-gray-800 border-gray-300',
        description: '出品準備が必要な商品',
        icon: <Package size={24} className="text-gray-600" />,
        actionText: '出品準備を開始',
        actionColor: 'bg-gray-600 hover:bg-gray-700'
      },
      {
        status: 'ready_to_list',
        label: '出品準備完了',
        count: statusCounts.ready_to_list,
        color: 'bg-blue-50 text-blue-800 border-blue-300',
        description: '出品可能な商品',
        icon: <Upload size={24} className="text-blue-600" />,
        actionText: 'メルカリに出品',
        actionColor: 'bg-blue-600 hover:bg-blue-700'
      },
      {
        status: 'listed',
        label: '出品中',
        count: statusCounts.listed,
        color: 'bg-green-50 text-green-800 border-green-300',
        description: '現在出品中の商品',
        icon: <ShoppingCart size={24} className="text-green-600" />,
        actionText: '価格調整・管理',
        actionColor: 'bg-green-600 hover:bg-green-700'
      },
      {
        status: 'sold',
        label: '売却済み',
        count: statusCounts.sold,
        color: 'bg-purple-50 text-purple-800 border-purple-300',
        description: '売却完了した商品',
        icon: <CheckCircle size={24} className="text-purple-600" />,
        actionText: '売上を確認',
        actionColor: 'bg-purple-600 hover:bg-purple-700'
      },
      {
        status: 'on_hold',
        label: '保留',
        count: statusCounts.on_hold,
        color: 'bg-yellow-50 text-yellow-800 border-yellow-300',
        description: '一時保留中の商品',
        icon: <Pause size={24} className="text-yellow-600" />,
        actionText: '保留理由を確認',
        actionColor: 'bg-yellow-600 hover:bg-yellow-700'
      },
      {
        status: 'discarded',
        label: '廃棄',
        count: statusCounts.discarded,
        color: 'bg-red-50 text-red-800 border-red-300',
        description: '廃棄された商品',
        icon: <Trash2 size={24} className="text-red-600" />,
        actionText: '廃棄記録を確認',
        actionColor: 'bg-red-600 hover:bg-red-700'
      }
    ];
  };

  const filteredProducts = products.filter(product => {
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesAssetType = assetTypeFilter === 'all' || product.asset_type === assetTypeFilter;
    return matchesStatus && matchesAssetType;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'in_stock': { label: '在庫', className: 'bg-gray-100 text-gray-700' },
      'ready_to_list': { label: '出品準備完了', className: 'bg-blue-100 text-blue-700' },
      'listed': { label: '出品中', className: 'bg-green-100 text-green-700' },
      'sold': { label: '売却済み', className: 'bg-purple-100 text-purple-700' },
      'on_hold': { label: '保留', className: 'bg-yellow-100 text-yellow-700' },
      'discarded': { label: '破棄', className: 'bg-red-100 text-red-700' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['in_stock'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getAssetTypeIcon = (assetType: string) => {
    if (assetType === 'asset') {
      return <Gem size={16} className="text-blue-600" title="資産型商品" />;
    } else {
      return <Zap size={16} className="text-orange-600" title="回転型商品" />;
    }
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

  if (!session || !store || !storePurchase) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">
          データが見つかりません
        </div>
      </div>
    );
  }

  const statusCards = getStatusCards();

  return (
    <div className="p-8">
      {/* パンくずナビ */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
        <Link to="/products" className="hover:text-gray-700">商品管理</Link>
        <ChevronRight size={16} />
        <span className="text-gray-600">{session.title}</span>
        <ChevronRight size={16} />
        <span className="text-gray-900 font-medium">{store.name}</span>
      </div>

      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>戻る</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
            <p className="text-gray-600 mt-1">
              {session.title} - 全{products.length}商品
            </p>
          </div>
        </div>

        {/* 表示切り替え */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid size={16} className="inline mr-1" />
              カード
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={16} className="inline mr-1" />
              一覧
            </button>
          </div>
        </div>
      </div>

      {/* カード表示モード */}
      {viewMode === 'cards' ? (
        <div className="space-y-8">
          {/* 商品登録状況カード */}
          {(() => {
            const regStatus = getRegistrationStatus();
            return (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <ClipboardList size={24} className="text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">商品登録状況</h3>
                      <p className="text-sm text-blue-700">仕入商品の登録進捗</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900">
                      {regStatus.registeredCount}/{regStatus.totalExpected}
                    </div>
                    <div className="text-sm text-blue-700">登録済み</div>
                  </div>
                </div>
                
                {/* 進捗バー */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-blue-700">進捗率</span>
                    <span className="text-sm font-medium text-blue-900">{regStatus.progressPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${regStatus.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* 詳細情報 */}
                {regStatus.unregisteredCount > 0 && (
                  <div className="bg-white bg-opacity-70 rounded-lg p-4 mb-4">
                    <div className="text-sm text-blue-800">
                      <strong>のこり {regStatus.unregisteredCount}件</strong> の商品登録が必要です
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      商品登録は「仕入管理」ページで行ってください
                    </div>
                  </div>
                )}
                
                {/* 完了状態 */}
                {regStatus.unregisteredCount === 0 && regStatus.totalExpected > 0 && (
                  <div className="bg-green-100 rounded-lg p-4 mb-4">
                    <div className="text-sm text-green-800 font-medium">
                      ✅ 全商品の登録が完了しました！
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* アクションカード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statusCards.map((card) => (
              <div
                key={card.status}
                className={`border-2 rounded-xl p-6 transition-all hover:shadow-lg hover:scale-[1.02] ${card.color} ${
                  card.count === 0 ? 'opacity-60' : ''
                }`}
              >
                {/* カードヘッダー */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {card.icon}
                    <div>
                      <h3 className="text-lg font-semibold">{card.label}</h3>
                      <p className="text-sm opacity-75">{card.description}</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{card.count}</div>
                </div>
                
                {/* 商品タイプ内訳 */}
                {card.count > 0 && (
                  <div className="mb-4 p-3 bg-white bg-opacity-50 rounded-lg">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-1">
                        <Gem size={12} className="text-blue-500" />
                        <span>資産型: {products.filter(p => p.status === card.status && p.asset_type === 'asset').length}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap size={12} className="text-orange-500" />
                        <span>回転型: {products.filter(p => p.status === card.status && p.asset_type === 'quick_turn').length}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* アクションボタン */}
                <div className="space-y-2">
                  {card.count > 0 ? (
                    <>
                      <button
                        onClick={() => {
                          setStatusFilter(card.status as StatusFilter);
                          setViewMode('table');
                        }}
                        className={`w-full px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${card.actionColor}`}
                      >
                        {card.actionText}
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter(card.status as StatusFilter);
                          setViewMode('table');
                        }}
                        className="w-full px-4 py-2 bg-white bg-opacity-70 text-gray-700 text-sm font-medium rounded-lg hover:bg-opacity-100 transition-all"
                      >
                        商品一覧を表示 →
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-2 text-sm text-gray-500">
                      該当商品なし
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* クイックアクションセクション */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Tag size={20} className="text-blue-600" />
              <span>クイックアクション</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setViewMode('table');
                }}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <List size={20} className="text-gray-600" />
                <div className="text-left">
                  <div className="font-medium">全商品一覧</div>
                  <div className="text-sm text-gray-500">{products.length}件の商品</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setAssetTypeFilter('asset');
                  setViewMode('table');
                }}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Gem size={20} className="text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">資産型商品のみ</div>
                  <div className="text-sm text-gray-500">{products.filter(p => p.asset_type === 'asset').length}件の商品</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setAssetTypeFilter('quick_turn');
                  setViewMode('table');
                }}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-orange-50 transition-colors"
              >
                <Zap size={20} className="text-orange-600" />
                <div className="text-left">
                  <div className="font-medium">回転型商品のみ</div>
                  <div className="text-sm text-gray-500">{products.filter(p => p.asset_type === 'quick_turn').length}件の商品</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* テーブル表示モード */
        <div className="bg-white rounded-xl shadow-sm">
          {/* フィルター */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setViewMode('cards')}
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
                >
                  <ArrowLeft size={16} />
                  <span>カード表示に戻る</span>
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべて ({products.length})</option>
                  {statusCards.map(card => (
                    <option key={card.status} value={card.status}>
                      {card.label} ({card.count})
                    </option>
                  ))}
                </select>
                <select
                  value={assetTypeFilter}
                  onChange={(e) => setAssetTypeFilter(e.target.value as 'all' | 'asset' | 'quick_turn')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべてのタイプ ({products.length})</option>
                  <option value="asset">資産型商品 ({products.filter(p => p.asset_type === 'asset').length})</option>
                  <option value="quick_turn">回転型商品 ({products.filter(p => p.asset_type === 'quick_turn').length})</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                {statusFilter === 'all' ? '全' : statusCards.find(c => c.status === statusFilter)?.label} {filteredProducts.length} 件
              </div>
            </div>
          </div>

          {/* 商品テーブル */}
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              該当する商品がありません
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* 第1行：写真、商品名、ブランド、カテゴリー、価格情報、ステータス */}
                    <div className="col-span-2">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {product.photos && product.photos.length > 0 ? (
                          <img
                            src={product.photos[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg></div>';
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package size={20} />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-span-3">
                      <div className="flex items-center space-x-2 mb-1">
                        {getAssetTypeIcon(product.asset_type)}
                        <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                      </div>
                      <div className="text-xs text-gray-500">{product.brand || '-'}</div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="text-xs text-gray-600">カテゴリー</div>
                      <div className="text-sm text-gray-900">{product.category}</div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="text-xs text-gray-600">仕入価格</div>
                      <div className="text-sm font-medium text-gray-900">
                        ¥{(product.allocated_cost || product.purchase_cost || 0).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="text-xs text-gray-600">現在価格</div>
                      <div className="text-sm font-medium text-blue-600">
                        ¥{product.current_price.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="col-span-1 flex justify-end">
                      {getStatusBadge(product.status)}
                    </div>
                  </div>
                  
                  {/* 第2行：日付情報と詳細表示ボタン */}
                  <div className="grid grid-cols-12 gap-4 mt-3 pt-3 border-t border-gray-100">
                    <div className="col-span-2">
                      {/* 写真と同じ位置に仕入日を配置 */}
                      <div className="text-xs text-gray-600">仕入日</div>
                      <div className="text-sm text-gray-900">
                        {product.store_purchases?.purchase_date ? format(new Date(product.store_purchases.purchase_date), 'yyyy/MM/dd') : '-'}
                      </div>
                    </div>
                    
                    <div className="col-span-3">
                      <div className="text-xs text-gray-600">出品日</div>
                      <div className="text-sm text-gray-900">
                        {product.listed_at ? format(new Date(product.listed_at), 'yyyy/MM/dd') : '-'}
                      </div>
                    </div>
                    
                    <div className="col-span-3">
                      <div className="text-xs text-gray-600">売却日</div>
                      <div className="text-sm text-gray-900">
                        {product.sold_at ? format(new Date(product.sold_at), 'yyyy/MM/dd') : '-'}
                      </div>
                    </div>
                    
                    <div className="col-span-4 flex justify-end">
                      <Link
                        to={`/products/${product.id}`}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        onClick={() => {
                          sessionStorage.setItem('previousProductListPath', location.pathname);
                        }}
                      >
                        詳細表示
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductsByStore;