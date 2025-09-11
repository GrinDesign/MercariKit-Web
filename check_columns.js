import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zzhwuajdtornsgzlppgq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6aHd1YWpkdG9ybnNnemxwcGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTM0NzMsImV4cCI6MjA3MjA4OTQ3M30.xNyhHU5aeETi17bqE4_9HH-HZz3LOXFdM4hQhJpLQHo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// テーブル構造を確認
async function checkTableStructure() {
  try {
    console.log('=== store_purchases テーブルの構造確認 ===')
    
    // 1件のデータを取得してカラムを確認
    const { data, error } = await supabase
      .from('store_purchases')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Error:', error)
      return
    }

    if (data && data.length > 0) {
      console.log('利用可能なカラム:', Object.keys(data[0]))
      console.log('サンプルデータ:', data[0])
    } else {
      console.log('データが存在しません')
    }

    console.log('\n=== purchase_sessions テーブルの構造確認 ===')
    
    const { data: sessionData, error: sessionError } = await supabase
      .from('purchase_sessions')
      .select('*')
      .limit(1)

    if (sessionError) {
      console.error('Error:', sessionError)
      return
    }

    if (sessionData && sessionData.length > 0) {
      console.log('利用可能なカラム:', Object.keys(sessionData[0]))
      console.log('サンプルデータ:', sessionData[0])
    } else {
      console.log('データが存在しません')
    }

  } catch (error) {
    console.error('エラー:', error)
  }
}

checkTableStructure()