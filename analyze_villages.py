import argparse
import pandas as pd
from collections import Counter
import os

def analyze_village_data(csv_file):
    """
    分析CSV檔案中的村里、鄰分布與門牌數量
    """
    try:
        # 讀取CSV檔案
        df = pd.read_csv(csv_file, dtype=str)
        
        # 檢查必要欄位是否存在
        required_columns = ['村里', '鄰', '號']
        for col in required_columns:
            if col not in df.columns:
                print(f"錯誤：找不到必要欄位 '{col}' 在檔案 {csv_file}")
                return
        
        # 取得檔案基本資訊
        total_records = len(df)
        
        # 統計村里分布
        village_counts = df['村里'].value_counts()
        unique_villages = len(village_counts)
        
        # 創建村里-鄰的組合欄位
        df['村里鄰'] = df['村里'] + '-' + df['鄰'].astype(str).str.zfill(3)
        
        # 統計鄰分布
        neighborhood_counts = df['村里鄰'].value_counts()
        
        # 統計每個村里的鄰數量
        village_neighborhood_counts = df.groupby('村里')['鄰'].nunique().sort_values(ascending=False)
        
        # 輸出結果
        print(f"檔案：{csv_file}")
        print(f"總記錄數：{total_records}")
        print(f"村里數量：{unique_villages}")
        print(f"總鄰數：{len(neighborhood_counts)}")
        
        print("\n各村里門牌數量統計：")
        print("-" * 50)
        
        for village in village_counts.index:
            village_data = df[df['村里'] == village]
            neighborhoods = village_data['鄰'].nunique()
            addresses = len(village_data)
            
            print(f"{village}: {addresses} 門牌, {neighborhoods} 鄰")
            
            # 顯示每鄰的門牌數量
            neighborhood_detail = village_data.groupby('鄰').size().sort_index()
            for nei, count in neighborhood_detail.items():
                print(f"  └─ {nei}鄰: {count} 門牌")
        
        print("\n統計摘要：")
        print(f"平均每里門牌數：{total_records / unique_villages:.1f}")
        print(f"平均每里鄰數：{len(neighborhood_counts) / unique_villages:.1f}")
        print(f"平均每鄰門牌數：{total_records / len(neighborhood_counts):.1f}")
        print(f"最多門牌的里：{village_counts.index[0]} ({village_counts.iloc[0]} 門牌)")
        print(f"最少門牌的里：{village_counts.index[-1]} ({village_counts.iloc[-1]} 門牌)")
        print(f"最多鄰的里：{village_neighborhood_counts.index[0]} ({village_neighborhood_counts.iloc[0]} 鄰)")
        print(f"最少鄰的里：{village_neighborhood_counts.index[-1]} ({village_neighborhood_counts.iloc[-1]} 鄰)")
        
        return {
            'file': csv_file,
            'total_records': total_records,
            'unique_villages': unique_villages,
            'total_neighborhoods': len(neighborhood_counts),
            'village_counts': village_counts.to_dict(),
            'village_neighborhood_counts': village_neighborhood_counts.to_dict(),
            'neighborhood_detail': df.groupby(['村里', '鄰']).size().reset_index(name='門牌數'),
            'village_summary': df.groupby('村里').agg({
                '鄰': 'nunique',
                '號': 'count'
            }).rename(columns={'鄰': '鄰數', '號': '門牌數'}).reset_index()
        }
        
    except Exception as e:
        print(f"處理檔案 {csv_file} 時發生錯誤：{e}")
        return None

def export_to_csv(results, output_file):
    """
    將分析結果匯出為CSV格式
    """
    try:
        all_village_data = []
        all_neighborhood_data = []
        
        for result in results:
            if result is None:
                continue
                
            file_name = os.path.basename(result['file']).replace('.csv', '')
            
            # 村里摘要資料
            village_summary = result['village_summary'].copy()
            village_summary.insert(0, '檔案', file_name)
            all_village_data.append(village_summary)
            
            # 鄰詳細資料
            neighborhood_detail = result['neighborhood_detail'].copy()
            neighborhood_detail.insert(0, '檔案', file_name)
            all_neighborhood_data.append(neighborhood_detail)
        
        if all_village_data:
            village_df = pd.concat(all_village_data, ignore_index=True)
            village_output = output_file.replace('.csv', '_村里摘要.csv')
            village_df.to_csv(village_output, index=False, encoding='utf-8-sig')
            print(f"村里摘要已匯出至：{village_output}")
        
        if all_neighborhood_data:
            neighborhood_df = pd.concat(all_neighborhood_data, ignore_index=True)
            neighborhood_output = output_file.replace('.csv', '_鄰詳細.csv')
            neighborhood_df.to_csv(neighborhood_output, index=False, encoding='utf-8-sig')
            print(f"鄰詳細資料已匯出至：{neighborhood_output}")
            
    except Exception as e:
        print(f"匯出CSV時發生錯誤：{e}")

def export_to_excel(results, output_file):
    """
    將分析結果匯出為Excel格式，包含多個工作表
    """
    try:
        with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
            all_village_data = []
            
            for result in results:
                if result is None:
                    continue
                    
                file_name = os.path.basename(result['file']).replace('.csv', '')
                
                # 每個檔案的村里摘要
                village_summary = result['village_summary'].copy()
                village_summary.to_excel(writer, sheet_name=f'{file_name}_村里摘要', index=False)
                
                # 每個檔案的鄰詳細資料
                neighborhood_detail = result['neighborhood_detail'].copy()
                neighborhood_detail.to_excel(writer, sheet_name=f'{file_name}_鄰詳細', index=False)
                
                # 收集所有村里資料用於總摘要
                village_summary_with_file = village_summary.copy()
                village_summary_with_file.insert(0, '檔案', file_name)
                all_village_data.append(village_summary_with_file)
            
            # 建立總摘要工作表
            if all_village_data:
                total_summary = pd.concat(all_village_data, ignore_index=True)
                total_summary.to_excel(writer, sheet_name='總摘要', index=False)
                
                # 建立統計摘要
                file_stats = []
                for result in results:
                    if result is None:
                        continue
                    file_stats.append({
                        '檔案': os.path.basename(result['file']).replace('.csv', ''),
                        '村里數': result['unique_villages'],
                        '鄰數': result['total_neighborhoods'],
                        '門牌數': result['total_records'],
                        '平均每里鄰數': round(result['total_neighborhoods'] / result['unique_villages'], 1),
                        '平均每鄰門牌數': round(result['total_records'] / result['total_neighborhoods'], 1)
                    })
                
                stats_df = pd.DataFrame(file_stats)
                stats_df.to_excel(writer, sheet_name='統計摘要', index=False)
        
        print(f"Excel檔案已匯出至：{output_file}")
        
    except Exception as e:
        print(f"匯出Excel時發生錯誤：{e}")

def main():
    parser = argparse.ArgumentParser(description='分析CSV檔案中的村里與門牌數量')
    parser.add_argument('csv_files', nargs='+', help='要分析的CSV檔案路徑')
    parser.add_argument('--export-csv', help='匯出CSV檔案路徑')
    parser.add_argument('--export-excel', help='匯出Excel檔案路徑')
    
    args = parser.parse_args()
    
    results = []
    
    for csv_file in args.csv_files:
        print("=" * 50)
        result = analyze_village_data(csv_file)
        if result:
            results.append(result)
        print()
    
    # 如果有多個檔案，顯示比較摘要
    if len(results) > 1:
        print("=" * 50)
        print("比較摘要：")
        print("-" * 20)
        for result in results:
            print(f"{result['file']}: {result['unique_villages']} 村里, {result['total_neighborhoods']} 鄰, {result['total_records']} 門牌")
    
    # 匯出功能
    if args.export_csv:
        export_to_csv(results, args.export_csv)
    
    if args.export_excel:
        export_to_excel(results, args.export_excel)

if __name__ == '__main__':
    main()