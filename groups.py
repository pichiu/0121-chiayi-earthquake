import pandas as pd

def assign_groups(input_file, output_file):
    grouping_rules = {
        1: [39, 39, 39],
        2: [26, 26],
        3: [30, 30],
        4: [24, 24],
        5: [40, 39],
        6: [25, 25],
        7: [23, 22],
        8: [23, 23],
        9: [27, 27],
        10: [31, 30],
        11: [34, 34],
        12: [32],
        13: [24, 24],
        14: [35, 34],
        15: [30, 30],
        16: [33, 33],
        17: [33, 32],
        18: [24, 24]
    }
    

    df = pd.read_csv(input_file)
    df['組別'] = None  # 確保主 DataFrame 有 '組別' 欄位

    result_df = pd.DataFrame()

    group_counter = 1
    
    for nei, groups in grouping_rules.items():
        sub_df = df[df['鄰'] == nei].copy()
        start_idx = 0
        for count in groups:
            end_idx = start_idx + count
            sub_df.loc[sub_df.index[start_idx:end_idx], '組別'] = group_counter
            start_idx = end_idx
            group_counter += 1
        result_df = pd.concat([result_df, sub_df], ignore_index=True)

    result_df.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"分組完成，結果已儲存至 {output_file}")

if __name__ == "__main__":
    input_file = input("請輸入輸入檔案名稱: ")
    output_file = input("請輸入輸出檔案名稱: ")
    assign_groups(input_file, output_file)

