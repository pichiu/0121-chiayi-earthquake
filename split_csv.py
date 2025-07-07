import argparse
import pandas as pd

def filter_address_data(file_path, district_code, village_name, output_path):
    # 讀取CSV檔案
    df = pd.read_csv(file_path, dtype=str)
    
    # 依據區代碼篩選資料
    filtered_df = df[df['鄉鎮市區代碼'] == district_code]
    
    # 如果有指定村里，進一步篩選
    if village_name:
        filtered_df = filtered_df[filtered_df['村里'] == village_name]
    
    if filtered_df.empty:
        print("無符合條件的資料")
        return
    
    # 將篩選後的資料存成新的CSV
    filtered_df.to_csv(output_path, index=False, encoding='utf-8-sig')
    print(f"篩選後的資料已儲存至 {output_path}")


def main():
    parser = argparse.ArgumentParser(description='Split CSV file')
    parser.add_argument('-i', '--input_file', required=True, help='輸入CSV檔案路徑')
    parser.add_argument('-d', '--district_code', required=True, help='鄉鎮市區代碼')
    parser.add_argument('-v', '--village_name', help='村里名稱 (可選)')
    parser.add_argument('-o', '--output_file', required=True, help='輸出CSV檔案路徑')
    args = parser.parse_args()

    input_file = args.input_file
    district_code = args.district_code
    village_name = args.village_name
    output_file = args.output_file

    filter_address_data(input_file, district_code, village_name, output_file)


if __name__ == '__main__':
    main()
