import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const CreateBucket: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const createBucket = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 1. 既存のバケット一覧を取得
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('バケット一覧取得エラー:', listError);
      } else {
        console.log('既存のバケット:', buckets);
      }

      // 2. product-photosバケットが存在するか確認
      const bucketExists = buckets?.some(bucket => bucket.name === 'product-photos');
      
      if (bucketExists) {
        setResult({
          success: true,
          message: 'product-photosバケットは既に存在します',
          buckets
        });
        return;
      }

      // 3. バケットを作成
      const { data, error: createError } = await supabase.storage.createBucket('product-photos', {
        public: true, // 公開バケットとして作成
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) {
        // エラーが発生した場合の詳細情報
        console.error('バケット作成エラー:', createError);
        setError(`バケット作成エラー: ${createError.message}`);
        
        // 権限の問題の可能性があるので、追加情報を表示
        setResult({
          success: false,
          message: 'バケットの作成に失敗しました',
          error: createError,
          note: 'Supabaseダッシュボードから手動でバケットを作成してください'
        });
      } else {
        console.log('バケット作成成功:', data);
        setResult({
          success: true,
          message: 'product-photosバケットを作成しました',
          data
        });
      }

    } catch (err) {
      console.error('エラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">Storageバケット作成</h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Database className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm text-blue-800 mb-2">
                商品画像を保存するための「product-photos」バケットを作成します。
              </p>
              <p className="text-sm text-blue-800">
                このバケットは公開設定で、JPEG/PNG画像のアップロードを許可します。
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={createBucket}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <Loader className="animate-spin mr-2" size={20} />
              作成中...
            </>
          ) : (
            <>
              <Database className="mr-2" size={20} />
              バケットを作成
            </>
          )}
        </button>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="text-red-600 mr-2 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start">
              {result.success ? (
                <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-0.5" size={20} />
              ) : (
                <AlertCircle className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5" size={20} />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {result.message}
                </p>
                {result.note && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-sm font-medium mb-2">手動作成の手順：</p>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Supabaseダッシュボードにログイン</li>
                      <li>左メニューから「Storage」を選択</li>
                      <li>「New bucket」ボタンをクリック</li>
                      <li>Name: <code className="bg-gray-100 px-1">product-photos</code></li>
                      <li>Public bucket: ON（チェック）</li>
                      <li>「Save」をクリック</li>
                    </ol>
                  </div>
                )}
                {result.buckets && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-1">既存のバケット:</p>
                    <ul className="text-sm text-gray-600">
                      {result.buckets.map((bucket: any) => (
                        <li key={bucket.id}>
                          - {bucket.name} {bucket.public ? '(公開)' : '(非公開)'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateBucket;