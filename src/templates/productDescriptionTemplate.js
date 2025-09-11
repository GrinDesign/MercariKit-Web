// 商品説明のテンプレート
export const getProductDescriptionTemplate = (product) => {
  // 採寸情報の日本語ラベルと順番定義
  const measurementLabels = {
    shoulder: '肩幅',
    chest: '身幅',
    length: '着丈',
    sleeve: '袖丈',
    waist: 'ウエスト',
    hip: 'ヒップ',
    inseam: '股下',
    rise: '股上',
    thigh: 'もも周り',
    hem: '裾幅',
    height: '高さ',
    width: '横幅',
    depth: '奥行き'
  };

  // カテゴリー別の表示順序定義
  const measurementOrder = {
    tops: ['shoulder', 'chest', 'length', 'sleeve'],
    outerwear: ['shoulder', 'chest', 'length', 'sleeve'],
    bottoms: ['waist', 'hip', 'inseam', 'rise', 'thigh', 'hem'],
    dresses: ['shoulder', 'chest', 'length', 'sleeve', 'waist'],
    shoes: ['length', 'width', 'height'],
    bags: ['width', 'height', 'depth'],
    accessories: ['width', 'height'],
    other: ['width', 'height', 'depth']
  };

  // 採寸情報の取得と整形
  let measurementInfo = '';
  if (product.measurements) {
    try {
      const measurements = typeof product.measurements === 'string'
        ? JSON.parse(product.measurements)
        : product.measurements;

      // カテゴリーに基づいて順序を決定
      const order = measurementOrder[product.category] || measurementOrder['other'];

      const measurementEntries = order
        .filter(key => measurements[key] !== undefined && measurements[key] !== null)
        .map(key => {
          const label = measurementLabels[key] || key;
          return `${label}: ${measurements[key]}cm`;
        })
        .join('\n');

      measurementInfo = measurementEntries;
    } catch (e) {
      // JSON解析エラーの場合は空文字
      measurementInfo = '';
    }
  }

  return `ご覧頂きありがとうございます。
いいね、プロフィールをご確認のうえご購入ください。

【寸法】（平置き・約）
${measurementInfo || '採寸情報なし'}

【コンディション】
・ 全体的に目立ったダメージはなく、まだまだ着用いただけます。
・ 古着特有の使用感・小さな汚れはございますのでご了承ください。

【特徴】
・ 特徴1
・ 特徴2
・ 特徴3

【補足】
・ 古着のため微細な使用感はご容赦ください
・ 照明/端末により色味が異なる場合があります

【発送】
・ 24〜48時間以内の発送を予定
・ 即購入歓迎／お値下げは常識の範囲でご相談ください`;
};