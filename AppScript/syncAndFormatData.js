function syncAndFormatData() {
  var SOURCE_SPREADSHEET_ID = "你的來源試算表 ID"; // ⚠️ 請填入來源試算表 ID
  var SOURCE_SHEET_NAME = "原始資料"; // ⚠️ 來源工作表名稱
  var TARGET_SHEET_NAME = "整理後資料"; // ⚠️ 目標工作表名稱

  // 取得來源試算表與來源工作表
  var sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
  var sourceSheet = sourceSpreadsheet.getSheetByName(SOURCE_SHEET_NAME);
  var targetSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TARGET_SHEET_NAME);

  if (!sourceSheet || !targetSheet) {
    Logger.log("❌ 找不到工作表，請確認名稱是否正確");
    return;
  }

  var data = sourceSheet.getDataRange().getValues();
  if (data.length < 2) {
    Logger.log("❌ 資料不足，無法繼續執行");
    return;
  }

  // **步驟 1: 記錄 row 1 原始內容**
  Logger.log("🔍 原始 row 1: " + JSON.stringify(data[0]));

  // **步驟 2: 移除 row 1 的 `SUBMIT_TIME` 和 `POST_HASH`**
  var headersRow1 = data[0];
  var removeIndexes = [];

  headersRow1.forEach((header, index) => {
    if (header === "SUBMIT_TIME" || header === "POST_HASH") {
      removeIndexes.push(index);
    }
  });

  // **刪除 `row 1` 指定欄位**
  data.forEach((row) => {
    removeIndexes
      .sort((a, b) => b - a)
      .forEach((index) => row.splice(index, 1));
  });

  // **刪除 `row 1`**
  data.shift();

  // **步驟 3: 記錄 row 2 作為標題**
  var headers = data.shift();
  Logger.log("📌 新標題 (Row 2): " + JSON.stringify(headers));

  // **步驟 4: 先刪除 `參與日期` & `報名者`**
  var finalRemoveIndexes = [];

  headers.forEach((header, index) => {
    if (header === "參與日期" || header === "報名者") {
      finalRemoveIndexes.push(index);
    }
  });

  // **刪除 `參與日期` 和 `報名者`**
  finalRemoveIndexes
    .sort((a, b) => b - a)
    .forEach((index) => {
      headers.splice(index, 1);
      data.forEach((row) => row.splice(index, 1));
    });

  Logger.log(
    "📌 刪除 `參與日期` & `報名者` 後的標題: " + JSON.stringify(headers)
  );

  // **步驟 5: 重新計算 `身份` & `慈濟志工身份別` 的索引**
  var identityIndex = headers.indexOf("身份");
  var volunteerIdentityIndex = headers.indexOf("慈濟志工身份別");

  Logger.log(
    "👤 身份索引: " +
      identityIndex +
      " / 慈濟志工身份別索引: " +
      volunteerIdentityIndex
  );

  // **步驟 6: 合併 `身份` 資料**
  data.forEach((row) => {
    if (row[identityIndex] === "慈濟志工" && row[volunteerIdentityIndex]) {
      row[identityIndex] = row[volunteerIdentityIndex]; // 替換為慈濟志工身份別
    }
  });

  // **步驟 7: 刪除 `慈濟志工身份別` 欄位**
  headers.splice(volunteerIdentityIndex, 1);
  data.forEach((row) => row.splice(volunteerIdentityIndex, 1));

  Logger.log("📌 刪除 `慈濟志工身份別` 後的標題: " + JSON.stringify(headers));

  // **步驟 8: 修正 `交通方式` 欄位名稱**
  headers = headers.map((header) => {
    const match = header.match(/^(\d{1,2})\/(\d{1,2})\S*交通方式/);
    if (match) {
      const month = String(match[1]).padStart(2, "0"); // 補零確保兩位數
      const day = String(match[2]).padStart(2, "0"); // 補零確保兩位數
      return month + day;
    }
    return header;
  });
  Logger.log("📌 修正 `交通方式` 標題後: " + JSON.stringify(headers));

  var phoneIndex = headers.indexOf("聯絡電話");
  Logger.log("📞 聯絡電話索引: " + phoneIndex);

  // **步驟 9: 處理 `聯絡電話`**
  data = data.map((row) => {
    return row.map((cell, index) => {
      // **處理電話格式**
      if (index === phoneIndex) {
        if (typeof cell === "number") {
          cell = cell.toString(); // 轉換成字串
        }
        if (typeof cell === "string") {
          cell = cell.trim();
          if (/^9\d{8}$/.test(cell)) {
            // 9 開頭 + 9 碼
            cell = `0${cell.slice(0, 4)}-${cell.slice(4)}`;
          } else {
            cell = "電話錯誤";
          }
        } else {
          cell = "電話錯誤";
        }
      }

      // **處理 `交通方式`**
      if (typeof cell === "string") {
        cell = cell.replace(/^\d{1,2}\/\d{2}\S+／/, "").trim();
        if (cell === "自行前往曾文青年活動中心") {
          cell = "自行前往";
        }
      }
      return cell;
    });
  });

  Logger.log("✅ 處理後的新數據前 5 行: " + JSON.stringify(data.slice(0, 5)));

  // **步驟 10: 確保標題的長度與數據對齊**
  Logger.log(
    "⚡ 新標題長度: " + headers.length + " / 新數據欄位數: " + data[0].length
  );

  // **步驟 11: 清空目標表單，寫入新標題和整理後的資料**
  targetSheet.clear();
  targetSheet.getRange(1, 1, 1, headers.length).setValues([headers]); // 設定標題
  targetSheet.getRange(2, 1, data.length, headers.length).setValues(data); // 設定資料

  Logger.log("🚀 整理完成，資料已同步至目標表單");
}
