import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントの初期化
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixPhotoUrls() {
  try {
    // すべての商品を取得
    const { data: products, error } = await supabase
      .from('products')
      .select('id, photos');

    if (error) throw error;

    console.log(`${products?.length || 0}件の商品を確認中...`);

    // ローカルファイルパスを持つ商品を修正
    for (const product of products || []) {
      if (product.photos && Array.isArray(product.photos)) {
        const hasLocalPath = product.photos.some(url => 
          url && (url.startsWith('file://') || url.startsWith('blob:'))
        );

        if (hasLocalPath) {
          console.log(`商品ID ${product.id} のローカルパスをクリア中...`);
          
          // ローカルパスを除外し、有効なURLのみを保持
          const validPhotos = product.photos.filter(url => 
            url && !url.startsWith('file://') && !url.startsWith('blob:')
          );

          // photosを空の配列に更新（または有効なURLのみを保持）
          const { error: updateError } = await supabase
            .from('products')
            .update({ photos: validPhotos.length > 0 ? validPhotos : [] })
            .eq('id', product.id);

          if (updateError) {
            console.error(`商品ID ${product.id} の更新エラー:`, updateError);
          } else {
            console.log(`商品ID ${product.id} を更新しました`);
          }
        }
      }
    }

    console.log('完了！');
  } catch (error) {
    console.error('エラー:', error);
  }
}

// スクリプトを実行
fixPhotoUrls();