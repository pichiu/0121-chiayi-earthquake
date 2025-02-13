import argparse
import pandas as pd
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def clean_address(address, row):
    address = str(address)
    if address.startswith("臺南市楠西區東勢里"):
        parts = address.split("鄰")
        if len(parts) > 1:
            neighborhood = parts[0].split("里")[1].strip()
            if str(row['鄰']) != neighborhood:
                logging.info(f"流水編號: {row['流水編號']}, 鄰: {row['鄰']}, 地址: {address}")
            address = parts[1].strip()
    return address

def clean_phone(phone):
    phone = str(phone)
    if phone.startswith("09") and len(phone) == 10:
        return phone[:4] + "-" + phone[4:]
    elif phone.startswith("06") and len(phone) == 9:
        return phone[:2] + "-" + phone[2:]
    else:
        return phone

def main(params):
    # 讀取Excel檔案中的特定工作表
    df = pd.read_excel(params["file"], sheet_name=params["sheet"], header=params["header"])

    # 清理 "通報地址(必填)" 欄位
    df["通報地址(必填)"] = df.apply(lambda row: clean_address(row["通報地址(必填)"], row), axis=1)

    # 清理 "電話" 欄位
    df["電話"] = df["電話"].apply(clean_phone)

    # 加上prefix東勢里到流水編號
    df["流水編號"] = "東勢里" + df["流水編號"].astype(str)

    # 按照鄰排序
    df = df.sort_values(by="鄰")

    # 印出清理後的資料
    df.to_excel(params["output"], index=False, engine='openpyxl')

if __name__ == '__main__':
    # 定義命令列引數
    parser = argparse.ArgumentParser(description='清理Excel檔案')
    parser.add_argument('-f', '--file', required=True, help='檔案名稱')
    parser.add_argument('-s', '--sheet', required=True, help='特定工作表名稱')
    parser.add_argument('-r', '--header', type=int, default=0, help='標題列')
    parser.add_argument('-o', '--output', required=True, help='輸出檔案名稱')
    args = parser.parse_args()

    main(vars(args))