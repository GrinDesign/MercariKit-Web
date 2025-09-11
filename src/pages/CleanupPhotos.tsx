import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

const CleanupPhotos: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string[];
  } | null>(null);

  const cleanupLocalPaths = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // すべての商品を取得
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, photos');

      if (error) throw error;

      const details: string[] = [];
      let cleanedCount = 0;

      // ローカルファイルパスを持つ商品を修正
      for (const product of products || []) {
        if (product.photos && Array.isArray(product.photos)) {
          const hasLocalPath = product.photos.some(url => 
            url && (url.startsWith('file://') || url.startsWith('blob:'))
          );

          if (hasLocalPath) {
            details.push(`商品「${product.name}」のローカルパスをクリア`);
            
            // ローカルパスを除外し、有効なURLのみを保持
            const validPhotos = product.photos.filter(url => 
              url && !url.startsWith('file://') && !url.startsWith('blob:') && url !== null
            );

            // photosを空の配列に更新
            const { error: updateError } = await supabase
              .from('products')
              .update({ photos: validPhotos.length > 0 ? validPhotos : [] })
              .eq('id', product.id);

            if (updateError) {
              details.push(`  ⚠️ エラー: ${updateError.message}`);
            } else {
              cleanedCount++;
            }
          }
        }
      }

      if (cleanedCount > 0) {
        setResult({
          success: true,
          message: `${cleanedCount}件の商品のローカルパスをクリアしました`,
          details
        });
      } else {
        setResult({
          success: true,
          message: 'クリアが必要なローカルパスは見つかりませんでした',
          details: []
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        details: []
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-4">画像パスのクリーンアップ</h1>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm text-yellow-800 mb-2">
                このツールは、React Nativeアプリから保存されたローカルファイルパス（file://）を
                データベースからクリアします。
              </p>
              <p className="text-sm text-yellow-800">
                Web版では表示できないこれらのパスを削除し、新しい画像をアップロードできるようにします。
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={cleanupLocalPaths}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <Loader className="animate-spin mr-2" size={20} />
              処理中...
            </>
          ) : (
            'クリーンアップを実行'
          )}
        </button>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start">
              {result.success ? (
                <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-0.5" size={20} />
              ) : (
                <AlertCircle className="text-red-600 mr-2 flex-shrink-0 mt-0.5" size={20} />
              )}
              <div className="flex-1">
                <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>
                {result.details && result.details.length > 0 && (
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    {result.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CleanupPhotos;