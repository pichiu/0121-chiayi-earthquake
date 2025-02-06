import pandas as pd

# 讓使用者輸入檔案名稱
input_file = input("請輸入要處理的 CSV 檔案名稱（含副檔名，例如 input.csv）：")
output_file = input("請輸入輸出 CSV 檔案名稱（含副檔名，例如 output.csv）：")

# 讀取 CSV，確保適當的編碼
try:
    df = pd.read_csv(input_file, encoding='utf-8')
except FileNotFoundError:
    print("檔案未找到，請確認檔名是否正確！")
    exit()
except Exception as e:
    print(f"讀取檔案時發生錯誤: {e}")
    exit()

# 指定要合併的欄位
columns_to_concat = ['街、路段', '地區', '巷', '弄']

# 確保合併的欄位存在於 CSV
for col in columns_to_concat:
    if col not in df.columns:
        df[col] = ''

# 合併欄位，移除空值，並用空格分隔
df['街路巷弄'] = df[columns_to_concat].astype(str).apply(lambda x: ''.join(x.dropna().replace('nan', '').tolist()).strip(), axis=1)

# 移除原始的合併欄位（如果不需要保留）
df.drop(columns=columns_to_concat, inplace=True)

# 以 utf-8-sig 編碼輸出 CSV 檔案
df.to_csv(output_file, encoding='utf-8-sig', index=False)

print(f'轉換完成，輸出檔案為: {output_file}')

