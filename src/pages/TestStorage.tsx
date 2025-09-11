import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

const TestStorage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setUploadResult(null);
      setImageUrl('');
    }
  };

  const testUpload = async () => {
    if (!selectedFile) {
      setError('ファイルを選択してください');
      return;
    }

    try {
      // 1. バケット一覧を取得
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      console.log('利用可能なバケット:', buckets);
      
      if (bucketsError) {
        console.error('バケット取得エラー:', bucketsError);
      }

      // 2. ファイルをアップロード
      const fileName = `test_${Date.now()}.jpg`;
      const filePath = `products/${fileName}`;
      
      console.log('アップロード先:', filePath);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-photos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        setError(`アップロードエラー: ${uploadError.message}`);
        console.error('詳細エラー:', uploadError);
        return;
      }

      console.log('アップロード成功:', uploadData);

      // 3. 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('product-photos')
        .getPublicUrl(filePath);

      console.log('公開URL:', publicUrl);
      setImageUrl(publicUrl);

      // 4. URLが実際にアクセス可能か確認
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        console.log('URLアクセステスト:', response.status, response.statusText);
        
        setUploadResult({
          success: true,
          uploadData,
          publicUrl,
          accessible: response.ok,
          status: response.status
        });
      } catch (fetchError) {
        console.error('URLアクセスエラー:', fetchError);
        setUploadResult({
          success: true,
          uploadData,
          publicUrl,
          accessible: false,
          error: fetchError
        });
      }

    } catch (err) {
      console.error('エラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラー');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">Supabase Storage テスト</h1>

        <div className="space-y-6">
          {/* ファイル選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              テスト画像を選択
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {selectedFile && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                選択ファイル: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            </div>
          )}

          {/* アップロードボタン */}
          <button
            onClick={testUpload}
            disabled={!selectedFile}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            <Upload className="mr-2" size={20} />
            テストアップロード
          </button>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="text-red-600 mr-2 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* 結果表示 */}
          {uploadResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start mb-4">
                <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-green-800 font-medium">アップロード成功</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">パス:</span> {uploadResult.uploadData?.path}
                </div>
                <div>
                  <span className="font-medium">URL:</span> 
                  <a href={uploadResult.publicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">
                    {uploadResult.publicUrl}
                  </a>
                </div>
                <div>
                  <span className="font-medium">アクセス可能:</span> 
                  <span className={uploadResult.accessible ? 'text-green-600' : 'text-red-600'}>
                    {uploadResult.accessible ? '✓ はい' : '✗ いいえ'} (Status: {uploadResult.status})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 画像プレビュー */}
          {imageUrl && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">画像プレビュー:</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img 
                  src={imageUrl} 
                  alt="アップロードテスト" 
                  className="max-w-full h-auto rounded"
                  onError={(e) => {
                    console.error('画像読み込みエラー');
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjIwMCIgeT0iMTUwIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjE5cHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+5Zu+44GU44GM6Kqt44G/6L6844KB44G+44Gb44KT</HRleHQ+PC9zdmc+';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestStorage;