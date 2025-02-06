import argparse
import folium
import pandas as pd
import pyproj


def twd97_to_wgs84(x, y):
    # TWD97
    twd97 = pyproj.CRS('EPSG:3826')
    # WGS84
    wgs84 = pyproj.CRS('EPSG:4326')
    # 座標轉換
    transformer = pyproj.Transformer.from_crs(twd97, wgs84, always_xy=True)
    lon, lat = transformer.transform(x, y)
    return lat, lon


def draw_map(input_file, output_file):
    # 讀取CSV文件
    data = pd.read_csv(input_file)

    # # 計算中心點
    # center_lat = data['縱座標'].mean()
    # center_lon = data['橫座標'].mean()

    # # 創建地圖
    # m = folium.Map(location=[center_lat, center_lon], zoom_start=15)

    # # 添加點
    # for _, row in data.iterrows():
    #     folium.Marker([row['縱座標'], row['橫座標']], popup=f"{row['街路巷弄']}{row['號']}").add_to(m)

    # 計算中心點
    center_x = data['橫座標'].mean()
    center_y = data['縱座標'].mean()
    center_lat, center_lon = twd97_to_wgs84(center_x, center_y)

    # 創建地圖
    m = folium.Map(location=[center_lat, center_lon], zoom_start=15)

    # 添加點
    for _, row in data.iterrows():
        lat, lon = twd97_to_wgs84(row['橫座標'], row['縱座標'])
        folium.Marker([lat, lon], popup=f"{row['街路巷弄']}{row['號']}").add_to(m)

    # 保存地圖
    m.save(output_file)


def main(params):
    input_file = params['input_file']
    output_file = params['output_file']
    draw_map(input_file, output_file)



if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Split CSV file')
    parser.add_argument('-i', '--input_file', required=True, help='輸入CSV檔案路徑')
    parser.add_argument('-o', '--output_file', required=True, help='輸出html檔案路徑')
    args = parser.parse_args()
    
    main(args.__dict__)
