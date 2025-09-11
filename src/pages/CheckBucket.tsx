import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const CheckBucket: React.FC = () => {
  const [buckets, setBuckets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);

  const checkBuckets = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 1. バケット一覧を取得
      const { data: bucketList, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('バケット一覧取得エラー:', listError);
        setError(`エラー: ${listError.message}`);
      } else {
        console.log('取得したバケット:', bucketList);
        setBuckets(bucketList || []);
      }

      // 2. product-photosバケットの存在確認
      const hasProductPhotos = bucketList?.some(b => b.name === 'product-photos');
      
      if (!hasProductPhotos) {
        setError('product-photosバケットが見つかりません');
      }
      
    } catch (err) {
      console.error('エラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  };

  const testUpload = async () => {
    setTestResult(null);
    
    try {
      // テスト用の小さなファイルを作成
      const testContent = new Blob(['test'], { type: 'text/plain' });
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
      
      // 1. product-photosバケットにアップロードを試みる
      const fileName = `test_${Date.now()}.txt`;
      
      console.log('テストアップロード開始:', fileName);
      
      const { data, error } = await supabase.storage
        .from('product-photos')
        .upload(fileName, testFile);
      
      if (error) {
        console.error('アップロードエラー:', error);
        setTestResult({
          success: false,
          message: `アップロード失敗: ${error.message}`,
          error
        });
      } else {
        console.log('アップロード成功:', data);
        
        // アップロード成功したら削除
        await supabase.storage
          .from('product-photos')
          .remove([fileName]);
        
        setTestResult({
          success: true,
          message: 'バケットは正常に動作しています',
          data
        });
      }
    } catch (err) {
      console.error('テストエラー:', err);
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : '不明なエラー'
      });
    }
  };

  const createBucketManually = async () => {
    setLoading(true);
    setError('');
    
    try {
      // バケットを作成（異なる設定で試す）
      const { data, error } = await supabase.storage.createBucket('product-photos', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: undefined // すべてのファイルタイプを許可
      });
      
      if (error) {
        if (error.message.includes('already exists')) {
          setError('バケットは既に存在しますが、アクセスできない可能性があります');
        } else {
          setError(`作成エラー: ${error.message}`);
        }
      } else {
        setError('');
        await checkBuckets(); // 再度チェック
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBuckets();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">Storageバケット診断</h1>

        <div className="space-y-6">
          {/* バケット一覧 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">バケット一覧</h2>
              <button
                onClick={checkBuckets}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 flex items-center"
              >
                <RefreshCw className={`mr-1 ${loading ? 'animate-spin' : ''}`} size={16} />
                更新
              </button>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            {buckets.length === 0 ? (
              <p className="text-gray-500">バケットが見つかりません</p>
            ) : (
              <ul className="space-y-2">
                {buckets.map((bucket) => (
                  <li key={bucket.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <Database className="mr-2 text-gray-600" size={16} />
                      <span className="font-medium">{bucket.name}</span>
                      {bucket.public && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">公開</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">ID: {bucket.id}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* product-photosバケットのステータス */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">product-photos バケット</h2>
            {buckets.some(b => b.name === 'product-photos') ? (
              <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                <div className="flex items-center">
                  <CheckCircle className="text-green-600 mr-2" size={20} />
                  <span className="text-green-800">バケットが存在します</span>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="text-red-600 mr-2" size={20} />
                  <span className="text-red-800">バケットが見つかりません</span>
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={testUpload}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                アップロードテスト
              </button>
              
              {!buckets.some(b => b.name === 'product-photos') && (
                <button
                  onClick={createBucketManually}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  バケットを作成
                </button>
              )}
            </div>
            
            {testResult && (
              <div className={`mt-4 p-3 rounded ${
                testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                  {testResult.message}
                </p>
                {testResult.error && (
                  <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
                    {JSON.stringify(testResult.error, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* 手動作成の手順 */}
          <div className="border rounded-lg p-4 bg-yellow-50">
            <h3 className="font-semibold mb-3">⚠️ それでも動作しない場合</h3>
            <p className="text-sm text-gray-700 mb-3">
              Supabaseダッシュボードから直接バケットを作成してください：
            </p>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li>
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Supabaseダッシュボード
                </a>
                にアクセス
              </li>
              <li>プロジェクト「mercarikit」を選択</li>
              <li>左メニューの「Storage」をクリック</li>
              <li>既存の「product-photos」があれば削除</li>
              <li>「New bucket」をクリック</li>
              <li>
                以下の設定で作成：
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Name: <code className="bg-white px-1">product-photos</code></li>
                  <li>• Public: <strong>ON</strong></li>
                  <li>• RLS: <strong>OFF</strong></li>
                </ul>
              </li>
              <li>「Create bucket」をクリック</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckBucket;