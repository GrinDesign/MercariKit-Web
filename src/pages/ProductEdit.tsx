import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Gem, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types/index';
import { useHierarchicalNavigation } from '../hooks/useHierarchicalNavigation';

const ProductEdit: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const navigationInfo = useHierarchicalNavigation();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    mercari_title: '',
    brand: '',
    category: '',
    size: '',
    color: '',
    condition: '',
    gender: '',
    purchase_cost: '',
    initial_price: '',
    current_price: '',
    sold_price: '',
    reference_price: '',
    measurements: '',
    description: '',
    notes: '',
    status: '',
    shipping_method: '',
    shipping_cost: '',
    production_country: '',
    decade: '90s',
    asset_type: 'quick_turn',
    listed_at: '',
    sold_at: ''
  });

  // カテゴリー、状態、性別のマッピング
  const categoryMapping = {
    'tops': 'トップス',
    'outerwear': 'アウター', 
    'bottoms': 'パンツ',
    'dresses': 'ワンピース',
    'shoes': 'シューズ',
    'bags': 'バッグ',
    'accessories': 'アクセサリー',
    'other': 'その他'
  };

  const conditionMapping = {
    'new': '新品',
    'used_like_new': '未使用に近い',
    'used_good': '目立った傷や汚れなし',
    'used_fair': 'やや傷や汚れあり',
    'used_poor': '傷や汚れあり',
    'used_damaged': '全体的に状態が悪い'
  };

  const genderMapping = {
    'men': 'メンズ',
    'women': 'レディース',
    'unisex': 'ユニセックス'
  };

  const reverseCategoryMapping = Object.fromEntries(
    Object.entries(categoryMapping).map(([key, value]) => [value, key])
  );

  const reverseConditionMapping = Object.fromEntries(
    Object.entries(conditionMapping).map(([key, value]) => [value, key])
  );

  const reverseGenderMapping = Object.fromEntries(
    Object.entries(genderMapping).map(([key, value]) => [value, key])
  );

  const basicColors = [
    'ホワイト', 'ブラック', 'グレー', 
    'レッド', 'ブルー', 'グリーン', 
    'イエロー', 'ピンク', 'パープル', 
    'ブラウン', 'オレンジ', 'ベージュ', 
    'ゴールド', 'シルバー', 'その他'
  ];

  const countries = [
    'USA', 'Mexico', 'Japan', 'Korea', 'China', 
    'Bangladesh', 'Vietnam', 'Thailand', 'India', '不明', 'Other'
  ];

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    if (!productId) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      console.log('Fetched product data:', data);
      console.log('Product description:', data.description);

      setProduct(data);
      setEditFormData({
        name: data.name || '',
        mercari_title: data.mercari_title || '',
        brand: data.brand || '',
        category: categoryMapping[data.category as keyof typeof categoryMapping] || data.category || '',
        size: data.size || '',
        color: data.color || '',
        condition: conditionMapping[data.condition as keyof typeof conditionMapping] || data.condition || '',
        gender: genderMapping[data.gender as keyof typeof genderMapping] || data.gender || '',
        purchase_cost: data.purchase_cost ? data.purchase_cost.toString() : '',
        initial_price: data.initial_price ? data.initial_price.toString() : '',
        current_price: data.current_price ? data.current_price.toString() : '',
        sold_price: data.sold_price ? data.sold_price.toString() : '',
        reference_price: data.reference_price ? data.reference_price.toString() : '',
        measurements: data.measurements ? JSON.stringify(data.measurements) : '',
        description: data.description || '',
        notes: data.notes || '',
        status: data.status || 'in_stock',
        shipping_method: data.shipping_method || 'ゆうゆうメルカリ便',
        shipping_cost: data.shipping_cost ? data.shipping_cost.toString() : '215',
        production_country: data.production_country || '',
        decade: data.decade || '90s',
        asset_type: data.asset_type || 'quick_turn',
        listed_at: data.listed_at ? new Date(data.listed_at).toISOString().split('T')[0] : '',
        sold_at: data.sold_at ? new Date(data.sold_at).toISOString().split('T')[0] : ''
      });
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSaving(true);
    try {
      // measurementsの安全なパース
      let parsedMeasurements = null;
      if (editFormData.measurements) {
        try {
          parsedMeasurements = JSON.parse(editFormData.measurements);
        } catch (measurementError) {
          console.error('Invalid measurements JSON:', editFormData.measurements);
          alert('採寸データの形式が正しくありません。');
          setSaving(false);
          return;
        }
      }

      // 数値フィールドの安全なパース
      const safeParseFloat = (value: string) => {
        if (!value || value === '') return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      };

      const updateData: any = {
        name: editFormData.name.trim(),
        mercari_title: editFormData.mercari_title?.trim() || null,
        brand: editFormData.brand?.trim() || null,
        category: reverseCategoryMapping[editFormData.category] || editFormData.category,
        size: editFormData.size?.trim() || null,
        color: editFormData.color?.trim() || null,
        condition: reverseConditionMapping[editFormData.condition] || editFormData.condition,
        gender: editFormData.gender ? (reverseGenderMapping[editFormData.gender] || editFormData.gender) : null,
        purchase_cost: safeParseFloat(editFormData.purchase_cost) || 0,
        initial_price: safeParseFloat(editFormData.initial_price) || 0,
        current_price: safeParseFloat(editFormData.current_price) || 0,
        sold_price: safeParseFloat(editFormData.sold_price),
        reference_price: safeParseFloat(editFormData.reference_price),
        measurements: parsedMeasurements,
        description: (editFormData.description && editFormData.description.trim()) ? editFormData.description.trim() : null,
        notes: editFormData.notes?.trim() || null,
        status: editFormData.status,
        shipping_method: editFormData.shipping_method?.trim() || null,
        shipping_cost: safeParseFloat(editFormData.shipping_cost),
        listed_at: editFormData.listed_at ? editFormData.listed_at : null,
        sold_at: editFormData.sold_at ? editFormData.sold_at : null
      };


      // production_country, decade, asset_type はデータベースに存在することを確認済み
      updateData.production_country = editFormData.production_country?.trim() || null;
      updateData.decade = editFormData.decade || '90s';
      updateData.asset_type = editFormData.asset_type || 'quick_turn';

      // 商品名が空でないかチェック
      if (!updateData.name) {
        alert('商品名は必須です。');
        setSaving(false);
        return;
      }

      console.log('Updating product with data:', updateData);
      console.log('Description form value:', editFormData.description);
      console.log('Description in updateData:', updateData.description);
      console.log('Gender form value:', editFormData.gender);
      console.log('Reverse gender mapping result:', reverseGenderMapping[editFormData.gender]);
      console.log('Final gender value:', updateData.gender);
      console.log('Listed_at field value:', editFormData.listed_at);
      console.log('Listed_at in updateData:', updateData.listed_at);
      console.log('Sold_at field value:', editFormData.sold_at);
      console.log('Sold_at in updateData:', updateData.sold_at);

      const { data: updatedProduct, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        console.error('Update data:', updateData);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Updated product from DB:', updatedProduct);
      console.log('Updated listed_at:', updatedProduct?.listed_at);
      console.log('Updated sold_at:', updatedProduct?.sold_at);

      alert('商品が正常に更新されました。');
      // 商品詳細に戻る（1階層上）
      navigate(`/products/${product.id}`);
    } catch (error) {
      console.error('Error updating product:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました。';
      alert(`商品の更新に失敗しました: ${errorMessage}`);
    } finally {
      setSaving(false);
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

  if (!product) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">
          商品が見つかりません
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(navigationInfo.backPath)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>{navigationInfo.backLabel}</span>
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center space-x-2">
            {editFormData.asset_type === 'asset' ? (
              <Gem size={20} className="text-blue-600" />
            ) : (
              <Zap size={20} className="text-orange-600" />
            )}
            <h1 className="text-3xl font-bold text-gray-900">商品編集</h1>
          </div>
        </div>

        {/* ヘッダー右側に保存ボタンを移動 */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate(navigationInfo.backPath)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <X size={18} />
            <span>キャンセル</span>
          </button>
          <button
            type="submit"
            form="product-edit-form"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Save size={18} />
            <span>{saving ? '保存中...' : '保存'}</span>
          </button>
        </div>
      </div>

      <form id="product-edit-form" onSubmit={handleUpdateProduct} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 基本情報 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold border-b pb-4 mb-4">基本情報</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">商品名 *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">メルカリタイトル（40文字まで）</label>
                <textarea
                  value={editFormData.mercari_title}
                  onChange={(e) => setEditFormData({ ...editFormData, mercari_title: e.target.value })}
                  rows={2}
                  maxLength={40}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="メルカリの商品タイトルを入力"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {editFormData.mercari_title.length}/40文字
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ブランド</label>
                <input
                  type="text"
                  value={editFormData.brand}
                  onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">カテゴリー *</label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">選択してください</option>
                  <option value="トップス">トップス</option>
                  <option value="パンツ">パンツ</option>
                  <option value="スカート">スカート</option>
                  <option value="ワンピース">ワンピース</option>
                  <option value="アウター">アウター</option>
                  <option value="シューズ">シューズ</option>
                  <option value="バッグ">バッグ</option>
                  <option value="アクセサリー">アクセサリー</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">サイズ</label>
                <input
                  type="text"
                  value={editFormData.size}
                  onChange={(e) => setEditFormData({ ...editFormData, size: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">色</label>
                <select
                  value={editFormData.color}
                  onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {basicColors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">状態 *</label>
                <select
                  value={editFormData.condition}
                  onChange={(e) => setEditFormData({ ...editFormData, condition: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">選択してください</option>
                  <option value="新品">新品</option>
                  <option value="未使用に近い">未使用に近い</option>
                  <option value="目立った傷や汚れなし">目立った傷や汚れなし</option>
                  <option value="やや傷や汚れあり">やや傷や汚れあり</option>
                  <option value="傷や汚れあり">傷や汚れあり</option>
                  <option value="全体的に状態が悪い">全体的に状態が悪い</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">性別</label>
                <select
                  value={editFormData.gender}
                  onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="メンズ">メンズ</option>
                  <option value="レディース">レディース</option>
                  <option value="ユニセックス">ユニセックス</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ステータス</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="in_stock">在庫</option>
                  <option value="ready_to_list">出品準備完了</option>
                  <option value="listed">出品中</option>
                  <option value="sold">売却済み</option>
                  <option value="on_hold">保留</option>
                  <option value="discarded">廃棄</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">商品タイプ</label>
                <select
                  value={editFormData.asset_type}
                  onChange={(e) => setEditFormData({ ...editFormData, asset_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="quick_turn">回転型商品 (Quick Turn)</option>
                  <option value="asset">資産型商品 (Asset)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  回転型：早期売却重視 / 資産型：長期保有OK
                </p>
              </div>
            </div>
          </div>

          {/* 価格・配送情報 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold border-b pb-4 mb-4">価格・配送情報</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">仕入価格</label>
                <input
                  type="number"
                  value={editFormData.purchase_cost}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">※ 一括購入の場合は変更できません</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">初期価格</label>
                <input
                  type="number"
                  value={editFormData.initial_price}
                  onChange={(e) => setEditFormData({ ...editFormData, initial_price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">現在価格</label>
                <input
                  type="number"
                  value={editFormData.current_price}
                  onChange={(e) => setEditFormData({ ...editFormData, current_price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">売却価格</label>
                <input
                  type="number"
                  value={editFormData.sold_price}
                  onChange={(e) => setEditFormData({ ...editFormData, sold_price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">参考価格</label>
                <input
                  type="number"
                  value={editFormData.reference_price}
                  onChange={(e) => setEditFormData({ ...editFormData, reference_price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">発送タイプ</label>
                <select
                  value={editFormData.shipping_method}
                  onChange={(e) => {
                    const method = e.target.value;
                    let defaultCost = editFormData.shipping_cost;

                    if (method === 'ゆうゆうメルカリ便') {
                      defaultCost = '215';
                    } else if (method === 'らくらくメルカリ便') {
                      defaultCost = '750';
                    }

                    setEditFormData({
                      ...editFormData,
                      shipping_method: method,
                      shipping_cost: defaultCost
                    });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ゆうゆうメルカリ便">ゆうゆうメルカリ便</option>
                  <option value="らくらくメルカリ便">らくらくメルカリ便</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">送料</label>
                <input
                  type="number"
                  value={editFormData.shipping_cost}
                  onChange={(e) => setEditFormData({ ...editFormData, shipping_cost: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">生産国</label>
                <select
                  value={editFormData.production_country}
                  onChange={(e) => setEditFormData({ ...editFormData, production_country: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">生産国を選択してください</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">年代</label>
                <select
                  value={editFormData.decade}
                  onChange={(e) => setEditFormData({ ...editFormData, decade: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="50s">50s</option>
                  <option value="60s">60s</option>
                  <option value="70s">70s</option>
                  <option value="80s">80s</option>
                  <option value="90s">90s</option>
                  <option value="00s">00s</option>
                  <option value="10s">10s</option>
                  <option value="20s">20s</option>
                  <option value="50s～60s">50s～60s</option>
                  <option value="60s～70s">60s～70s</option>
                  <option value="70s～80s">70s～80s</option>
                  <option value="80s～90s">80s～90s</option>
                  <option value="90s～00s">90s～00s</option>
                  <option value="不明">不明</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">出品日</label>
                <input
                  type="date"
                  value={editFormData.listed_at}
                  onChange={(e) => setEditFormData({ ...editFormData, listed_at: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">メルカリに出品した日付</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">売却日</label>
                <input
                  type="date"
                  value={editFormData.sold_at}
                  onChange={(e) => setEditFormData({ ...editFormData, sold_at: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">実際に売れた日付</p>
              </div>
            </div>
          </div>

        </div>

        {/* 説明・メモ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold border-b pb-4 mb-4">説明・メモ</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">商品説明</label>
              <textarea
                value={editFormData.description || ''}
                onChange={(e) => {
                  console.log('Description changed:', e.target.value);
                  setEditFormData({ ...editFormData, description: e.target.value });
                }}
                rows={16}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="商品の詳細な説明を入力してください"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">備考</label>
              <textarea
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                rows={16}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="内部用の備考・メモ"
              />
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default ProductEdit;