function backupSheetWithFormat() {
    var sourceSpreadsheetId = "來源試算表 ID"; // 請更換為你的來源試算表 ID
    var targetSpreadsheetId = "目標試算表 ID"; // 請更換為你的目標試算表 ID
    var sourceSheetName = "來源工作表名稱"; // 請更換為你的來源工作表名稱

    Logger.log("開始備份：" + sourceSheetName);
    
    // 取得來源試算表與工作表
    var sourceSpreadsheet = SpreadsheetApp.openById(sourceSpreadsheetId);
    var sourceSheet = sourceSpreadsheet.getSheetByName(sourceSheetName);
    if (!sourceSheet) {
        Logger.log("❌ 錯誤：來源工作表不存在！");
        return;
    }
    Logger.log("✅ 已找到來源工作表：" + sourceSheetName);

    // 取得目標試算表
    var targetSpreadsheet = SpreadsheetApp.openById(targetSpreadsheetId);
    Logger.log("✅ 目標試算表已打開");

    // 產生當前時間戳記（YYYYMMDD_HHmm）
    var now = new Date();
    var timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyyMMdd_HHmm");
    var newSheetName = sourceSheetName + "_" + timestamp; // 例如 "數據_20250212_1430"
    
    Logger.log("📌 新分頁名稱：" + newSheetName);

    // 檢查目標試算表內是否已有相同名稱的分頁（避免重複）
    var existingSheet = targetSpreadsheet.getSheetByName(newSheetName);
    if (existingSheet) {
        targetSpreadsheet.deleteSheet(existingSheet);
        Logger.log("🗑️ 已刪除舊的相同名稱分頁：" + newSheetName);
    }

    // 在目標試算表內建立新的分頁
    var newSheet = targetSpreadsheet.insertSheet(newSheetName);
    if (!newSheet) {
        Logger.log("❌ 錯誤：無法新增新分頁！");
        return;
    }
    Logger.log("✅ 已建立新分頁：" + newSheetName);

    // 取得數據範圍
    var dataRange = sourceSheet.getDataRange();
    var dataValues = dataRange.getValues(); // 取得純數值（去掉公式）
    var formats = dataRange.getFontColors(); // 取得字體顏色
    var backgrounds = dataRange.getBackgrounds(); // 取得背景顏色
    var columnWidths = []; // 儲存欄寬
    var rowHeights = []; // 儲存列高

    Logger.log("📋 讀取來源數據完成，共 " + dataValues.length + " 行，" + dataValues[0].length + " 列");

    // 複製數據（純值）
    newSheet.getRange(1, 1, dataValues.length, dataValues[0].length).setValues(dataValues);
    Logger.log("✅ 數據已複製（不含公式）");

    // 複製格式
    newSheet.getRange(1, 1, dataValues.length, dataValues[0].length).setFontColors(formats);
    newSheet.getRange(1, 1, dataValues.length, dataValues[0].length).setBackgrounds(backgrounds);
    Logger.log("🎨 已應用字體顏色與背景顏色");

    // 複製列寬
    for (var col = 1; col <= sourceSheet.getMaxColumns(); col++) {
        columnWidths.push(sourceSheet.getColumnWidth(col));
        newSheet.setColumnWidth(col, columnWidths[col - 1]);
    }
    Logger.log("📏 已複製欄寬，共 " + columnWidths.length + " 欄");

    // 複製行高
    for (var row = 1; row <= sourceSheet.getMaxRows(); row++) {
        rowHeights.push(sourceSheet.getRowHeight(row));
        newSheet.setRowHeight(row, rowHeights[row - 1]);
    }
    Logger.log("📐 已複製列高，共 " + rowHeights.length + " 行");

    Logger.log("🎉 備份完成！新分頁：" + newSheetName);
}
