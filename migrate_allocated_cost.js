import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zzhwuajdtornsgzlppgq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6aHd1YWpkdG9ybnNnemxwcGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTM0NzMsImV4cCI6MjA3MjA4OTQ3M30.xNyhHU5aeETi17bqE4_9HH-HZz3LOXFdM4hQhJpLQHo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 既存商品の allocated_cost を計算して更新
async function migrateAllocatedCost() {
  try {
    // allocated_cost が NULL の商品を取得
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, purchase_cost, store_purchase_id')
      .is('allocated_cost', null)

    if (productError) throw productError

    console.log(`${products.length} 件の商品を更新します...`)

    for (const product of products) {
      try {
        // 店舗購入情報を取得
        const { data: storePurchase, error: storeError } = await supabase
          .from('store_purchases')
          .select('id, product_amount, shipping_cost, commission_fee, item_count, session_id')
          .eq('id', product.store_purchase_id)
          .single()

        if (storeError) throw storeError

        // セッション情報を取得
        const { data: session, error: sessionError } = await supabase
          .from('purchase_sessions')
          .select('id, transportation_cost, transfer_fee, agency_fee')
          .eq('id', storePurchase.session_id)
          .single()

        if (sessionError) throw sessionError

        // セッション全体の共通コスト
        const commonCosts = (session.transportation_cost || 0) + 
                           (session.transfer_fee || 0) + 
                           (session.agency_fee || 0)

        // 現在の店舗のコスト
        const currentStoreAmount = (storePurchase.product_amount || 0) + 
                                  (storePurchase.shipping_cost || 0) + 
                                  (storePurchase.commission_fee || 0)

        // 店舗コスト + セッション共通コストの合計
        const totalCostForStore = currentStoreAmount + commonCosts

        // 店舗の商品数で割って1商品あたりの按分後単価
        const itemCount = storePurchase.item_count || 1
        const allocatedCostPerItem = Math.round(totalCostForStore / itemCount)

        // allocated_cost を更新
        const { error: updateError } = await supabase
          .from('products')
          .update({ allocated_cost: allocatedCostPerItem })
          .eq('id', product.id)

        if (updateError) throw updateError

        console.log(`商品 ${product.id}: allocated_cost = ${allocatedCostPerItem}`)

      } catch (error) {
        console.error(`商品 ${product.id} の更新エラー:`, error)
      }
    }

    console.log('マイグレーション完了!')

  } catch (error) {
    console.error('マイグレーションエラー:', error)
  }
}

// スクリプト実行
migrateAllocatedCost()