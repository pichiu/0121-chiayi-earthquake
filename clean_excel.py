import argparse
import pandas as pd
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


def clean_sheet_data(df, sheet_name):
    # 檢查是否已經有 "鄰" 這個 column
    if "鄰" not in df.columns:
        # 根據 sheet name 取得鄰的值
        neighbor = int(sheet_name.replace("鄰", ""))
        
        # 增加一個新的 column，並填入鄰的值
        df["鄰"] = neighbor
    
    # 檢查是否已經有 "複評申請" 這個 column
    if "複評申請" in df.columns:
        # 過濾掉值為 "V" 的 row
        df = df[df["複評申請"] != "V"]

    return df


def merge_sheets(file, sheets, header):
    dfs = []
    for sheet in sheets:
        df = pd.read_excel(file, sheet_name=sheet, header=header)
        df = clean_sheet_data(df, sheet)
        dfs.append(df)
    return pd.concat(dfs, ignore_index=True)


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
    # 合併所有工作表
    df = merge_sheets(params["file"], params["sheets"], params["header"])

    # 清理 "通報地址(必填)" 欄位
    df["通報地址(必填)"] = df.apply(lambda row: clean_address(row["通報地址(必填)"], row), axis=1)

    # 清理 "電話" 欄位
    df["電話"] = df["電話"].apply(clean_phone)

    # 加上prefix東勢里到流水編號
    df["流水編號"] = "東勢里" + df["流水編號"].astype(str)

    # 按照鄰排序
    df = df.sort_values(by="鄰")

    # 重設欄位順序
    columns = [
        "編號", "負責團隊", "行政區", "里", "鄰", "通報地址 (必填)", "聯絡人", "電話", "毀損情形",
        "修繕項目", "社福條件", "會勘日期", "會勘進度", "通報日期", "修繕評估", "同意書簽署",
        "施工進度", "開始施工", "竣工日期", "備註", "房屋形式", "產權狀況", "是否需慈濟協助",
        "婉謝原因", "家庭概況", "後續關懷需求", "後續需求情形說明", "通報單位", "流水編號"
    ]

    # 檢查 column 是否存在，若不存在則添加
    for column in columns:
        if column not in df.columns:
            if column in ["會勘進度", "同意書簽署", "通報單位"]:
                if column == "會勘進度":
                    df[column] = '待勘'
                elif column == "同意書簽署":
                    df[column] = '否'
                elif column == "通報單位":
                    df[column] = '楠西區公所'
            else:
                df[column] = ''  # 如果 column 不存在，則添加一個空的 column

    # 調整欄位順序
    df = df[columns]

    # 印出清理後的資料
    df.to_excel(params["output"], index=False, engine='openpyxl')

    logging.info("清理完成")


if __name__ == '__main__':
    # 定義命令列引數
    parser = argparse.ArgumentParser(description='清理Excel檔案')
    parser.add_argument('-f', '--file', required=True, help='檔案名稱')
    parser.add_argument('-s', '--sheets', nargs='+', required=True, help='工作表名稱，多個工作表請用空格分隔')
    parser.add_argument('-r', '--header', type=int, default=0, help='標題列')
    parser.add_argument('-o', '--output', required=True, help='輸出檔案名稱')
    args = parser.parse_args()

    main(vars(args))