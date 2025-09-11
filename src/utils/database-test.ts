import { supabase } from '../lib/supabase';

// データベースのテーブル構造を確認する関数
export const testDatabaseStructure = async () => {
  try {
    console.log('=== データベース構造テスト開始 ===');
    
    // purchase_sessionsテーブルの構造確認
    console.log('1. purchase_sessionsテーブルをテスト中...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('purchase_sessions')
      .select('*')
      .limit(1);
    
    if (sessionsError) {
      console.error('purchase_sessions エラー:', sessionsError);
    } else {
      console.log('purchase_sessions データ:', sessions);
      if (sessions && sessions.length > 0) {
        console.log('purchase_sessions カラム名:', Object.keys(sessions[0]));
      }
    }

    // storesテーブルの構造確認
    console.log('2. storesテーブルをテスト中...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .limit(1);
    
    if (storesError) {
      console.error('stores エラー:', storesError);
    } else {
      console.log('stores データ:', stores);
      if (stores && stores.length > 0) {
        console.log('stores カラム名:', Object.keys(stores[0]));
      }
    }

    // store_purchasesテーブルの構造確認
    console.log('3. store_purchasesテーブルをテスト中...');
    const { data: storePurchases, error: storePurchasesError } = await supabase
      .from('store_purchases')
      .select('*')
      .limit(1);
    
    if (storePurchasesError) {
      console.error('store_purchases エラー:', storePurchasesError);
    } else {
      console.log('store_purchases データ:', storePurchases);
      if (storePurchases && storePurchases.length > 0) {
        console.log('store_purchases カラム名:', Object.keys(storePurchases[0]));
      }
    }

    // productsテーブルの構造確認
    console.log('4. productsテーブルをテスト中...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (productsError) {
      console.error('products エラー:', productsError);
    } else {
      console.log('products データ:', products);
      if (products && products.length > 0) {
        console.log('products カラム名:', Object.keys(products[0]));
      }
    }

    console.log('=== データベース構造テスト完了 ===');
    
  } catch (error) {
    console.error('データベーステストエラー:', error);
  }
};