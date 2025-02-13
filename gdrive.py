import argparse
from google.oauth2 import service_account
from googleapiclient.discovery import build
import pandas as pd
import os

def main(kwargs):
    # 設定 Google Drive API 權限
    SCOPES = ['https://www.googleapis.com/auth/drive']
    creds = service_account.Credentials.from_service_account_file(
        kwargs['service_account_file'], scopes=SCOPES)
    drive_service = build('drive', 'v3', credentials=creds)

    # 下載檔案
    request = drive_service.files().get_media(fileId=kwargs['file_id'])
    with open(kwargs['excel_file_name'], 'wb') as f:
        f.write(request.execute())

    print(f"Excel 下載完成：{kwargs['excel_file_name']}")

    # 讀取 Excel 並轉換為 CSV
    xls = pd.ExcelFile(kwargs['excel_file_name'], engine="openpyxl")

    # 遍歷所有工作表，將它們轉換成 CSV
    for sheet_name in xls.sheet_names:
        df = xls.parse(sheet_name)
        csv_filename = f"{kwargs['csv_file_name']}_{sheet_name}.csv"  # 以工作表名稱命名 CSV 檔
        csv_path = os.path.join(kwargs['output_folder'], csv_filename)
        df.to_csv(csv_path, index=False, encoding="utf-8-sig")
        print(f"已轉換：{csv_path}")

    print("所有工作表轉換完成！")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='下載 Google Drive 上的 Excel 檔案並轉換為 CSV')
    parser.add_argument('--service_account_file', type=str, required=True, help='服務帳戶憑證檔案')
    parser.add_argument('--file_id', type=str, required=True, help='Google Drive 上的 Excel 檔案 ID')
    parser.add_argument('--excel_file_name', type=str, required=True, help='下載的 Excel 檔案名稱')
    parser.add_argument('--csv_file_name', type=str, required=True, help='轉換後的 CSV 檔案名稱')
    parser.add_argument('--output_folder', type=str, required=True, help='輸出的 CSV 檔案資料夾')
    args = parser.parse_args()
    main(vars(args))
