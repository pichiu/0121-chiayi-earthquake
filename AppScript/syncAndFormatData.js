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
    if (header === "SUBMIT_TIME" || header === "POST_HASH" || header === 112) {
      removeIndexes.push(index);
    }
  });
  // 刪除 row 1 指定欄位
  data.forEach((row) => {
    removeIndexes
      .sort((a, b) => b - a)
      .forEach((index) => row.splice(index, 1));
  });
  // **刪除 row 1**
  data.shift();

  // **步驟 3: 記錄 row 2 作為標題**
  var headers = data.shift();
  Logger.log("📌 新標題 (Row 2): " + JSON.stringify(headers));

  // **步驟 4: 刪除 `參與日期` & `報名者` 欄位**
  var finalRemoveIndexes = [];
  headers.forEach((header, index) => {
    if (header === "參與日期" || header === "報名者") {
      finalRemoveIndexes.push(index);
    }
  });
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
      const month = match[1].padStart(2, "0");
      const day = match[2].padStart(2, "0");
      return `${month}${day}`;
    }
    return header;
  });
  Logger.log("📌 修正 `交通方式` 標題後: " + JSON.stringify(headers));

  var phoneIndex = headers.indexOf("聯絡電話");
  Logger.log("📞 聯絡電話索引: " + phoneIndex);

  // **步驟 9: 處理 `聯絡電話` 與 `交通方式` 欄位內容**
  data = data.map((row) => {
    return row.map((cell, index) => {
      // 處理電話格式
      if (index === phoneIndex) {
        if (typeof cell === "number") {
          cell = cell.toString();
        }
        if (typeof cell === "string") {
          cell = cell.trim();
          if (/^9\d{8}$/.test(cell)) {
            // 9 開頭 + 9 碼
            cell = `0${cell.slice(0, 3)}-${cell.slice(3)}`;
          } else {
            cell = "電話錯誤";
          }
        } else {
          cell = "電話錯誤";
        }
      }
      // 處理交通方式：移除前面日期等描述，僅保留方式
      if (typeof cell === "string") {
        cell = cell.replace(/^\d{1,2}\/\d{2}\S+／/, "").trim();
        if (cell === "自行前往曾文青年活動中心") {
          cell = "自行前往";
        }
      }
      return cell;
    });
  });

  // 修改欄位名稱
  headers = headers.map(header => {
    if (header === "是否有修繕相關專業") return "修繕專業";
    if (header === "您如何得知此活動訊息") return "訊息來源";
    return header;
  });

  Logger.log("✅ 處理後的新數據前 5 行: " + JSON.stringify(data.slice(0, 5)));
  Logger.log(
    "⚡ 新標題長度: " + headers.length + " / 新數據欄位數: " + data[0].length
  );

  // **步驟 10: 清空目標表單，寫入新標題和整理後的資料 (同步工作表)**
  targetSheet.clear();
  targetSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  targetSheet.getRange(2, 1, data.length, headers.length).setValues(data);
  Logger.log("🚀 同步工作表資料整理完成");

  // ************** 以下為新增功能 **************
  // 產生「青年志工名單」工作表 (包含志工的各欄位及ID)
  // ※ 依據聯絡電話作唯一比對
  var phoneToID = generateUniqueUserSheet(headers, data);

  // 產生「交通方式」工作表 (長格式：每筆報名資料依日期拆解，並加入青年志工ID)
  generateTransportSheet(headers, data, phoneToID);

  // 產生「住宿」工作表
  generateAccommodationSheet(headers, data, phoneToID);
}

// 產生唯一志工名單 (包含欄位：姓名、性別、聯絡電話、聯絡 E-mail、年齡、身份、區別) 及自動增量 ID
function generateUniqueUserSheet(headers, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "青年志工名單";
  var userSheet = ss.getSheetByName(sheetName);
  if (!userSheet) {
    userSheet = ss.insertSheet(sheetName);
  } else {
    userSheet.clear();
  }

  // 定義志工名單需包含的欄位（不含 0213~0216 交通方式欄位）
  var volunteerFields = [
    "姓名",
    "性別",
    "聯絡電話",
    "聯絡 E-mail",
    "年齡",
    "身份",
    "區別",
    "修繕專業",
    "訊息來源",
  ];

  // 取得各欄位在 headers 中的索引
  var indices = {};
  volunteerFields.forEach(function (field) {
    indices[field] = headers.indexOf(field);
  });

  // 以姓名+聯絡電話作為唯一 key
  var nameIndex = indices["姓名"];
  var phoneIndex = indices["聯絡電話"];
  var uniqueUsers = {}; // name+phone -> ID
  var userList = [];
  var idCounter = 1;

  data.forEach(function (row) {
    var name = row[nameIndex];
    var phone = row[phoneIndex];
    var key = name + phone; // 使用姓名+電話作為唯一key
    if (!uniqueUsers.hasOwnProperty(key)) {
      uniqueUsers[key] = idCounter;
      var volunteerRow = [idCounter]; // 第一欄放 ID
      // 加入 volunteerFields 各欄位的資料
      volunteerFields.forEach(function (field) {
        volunteerRow.push(row[indices[field]]);
      });
      userList.push(volunteerRow);
      idCounter++;
    }
  });

  // 設定志工名單的標題：ID 加上志工Fields
  var userHeaders = ["ID"].concat(volunteerFields);
  userList.unshift(userHeaders);

  userSheet
    .getRange(1, 1, userList.length, userHeaders.length)
    .setValues(userList);
  Logger.log("✅ 志工名單產生完成");

  // 回傳以姓名+聯絡電話為 key 的 ID 對應表 (用於交通方式表建立 ref)
  return uniqueUsers;
}

// 產生長格式「交通方式」工作表 (每筆資料依日期拆解，並加入對應的志工ID)
// 調整後：每個志工ID每天只保留一筆交通方式(多筆以最後一筆為主)
function generateTransportSheet(headers, data, phoneToID) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "交通方式";
  var transportSheet = ss.getSheetByName(sheetName);
  if (!transportSheet) {
    transportSheet = ss.insertSheet(sheetName);
  } else {
    transportSheet.clear();
  }

  // 假設交通方式欄位名稱已修正為 "0213", "0214", "0215", "0216"
  var dateCols = [
    "0213",
    "0214",
    "0215",
    "0216",
    "0218",
    "0219",
    "0220",
    "0221",
    "0222",
    "0223",
  ];
  var dateIndexes = dateCols.map(function (date) {
    return headers.indexOf(date);
  });

  // 取得「姓名」及「聯絡電話」欄位索引 (用以取得志工ID)
  var nameIndex = headers.indexOf("姓名");
  var phoneIndex = headers.indexOf("聯絡電話");

  // 使用物件儲存每個志工每天最後一筆的交通方式
  // key 格式為 "志工ID_日期"
  var transportMap = {};

  data.forEach(function (row) {
    var name = row[nameIndex];
    var phone = row[phoneIndex];
    var volunteerID = phoneToID[name + phone] || "";
    if (!volunteerID) return; // 若無對應ID則跳過
    dateIndexes.forEach(function (idx, i) {
      var date = dateCols[i];
      var transport = row[idx];
      if (transport && transport !== "") {
        var key = volunteerID + "_" + date;
        // 覆蓋同一志工同一天的資料，最後一筆有效
        transportMap[key] = [volunteerID, name, date, transport];
      }
    });
  });

  // 整理 transportMap 成為陣列
  var transportData = [];
  var transportHeaders = ["青年志工ID", "姓名", "日期", "交通方式"];
  transportData.push(transportHeaders);
  for (var key in transportMap) {
    transportData.push(transportMap[key]);
  }

  transportSheet
    .getRange(1, 1, transportData.length, transportHeaders.length)
    .setValues(transportData);
  Logger.log("✅ 交通方式工作表產生完成");
}

function generateAccommodationSheet(headers, data, phoneToID) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "住宿";
  var accommodationSheet = ss.getSheetByName(sheetName);
  if (!accommodationSheet) {
    accommodationSheet = ss.insertSheet(sheetName);
  } else {
    accommodationSheet.clear();
  }

  // 取得「姓名」及「聯絡電話」欄位索引 (用以取得志工ID)
  var nameIndex = headers.indexOf("姓名");
  var phoneIndex = headers.indexOf("聯絡電話");
  var accommodationIndex = headers.indexOf("住宿日期");

  // 使用物件儲存每個志工的住宿資料
  var accommodationMap = {};

  data.forEach(function (row) {
    var name = row[nameIndex];
    var phone = row[phoneIndex];
    var volunteerID = phoneToID[name + phone] || "";
    if (!volunteerID) return; // 若無對應ID則跳過
    var accommodationDates = row[accommodationIndex];
    if (accommodationDates) {
      var dates = accommodationDates.split(",");
      var dateList = dates.map(function (date) {
        return extractDate(date.trim());
      });
      var checkInDate = dateList[0];
      var checkOutDate = addOneDay(dateList[dateList.length - 1]);

      var key = volunteerID;
      accommodationMap[key] = [volunteerID, name, checkInDate, checkOutDate];
    }
  });

  // 整理 accommodationMap 成為陣列
  var accommodationData = [];
  var accommodationHeaders = ["青年志工ID", "姓名", "入住日期", "退房日期"];
  accommodationData.push(accommodationHeaders);
  for (var key in accommodationMap) {
    accommodationData.push(accommodationMap[key]);
  }

  accommodationSheet
    .getRange(1, 1, accommodationData.length, accommodationHeaders.length)
    .setValues(accommodationData);
  Logger.log("✅ 住宿工作表產生完成");
}

function extractDate(dateString) {
  var match = dateString.match(/(\d+)\/(\d+)\(.+\)/);
  if (match) {
    var month = parseInt(match[1]);
    var day = parseInt(match[2]);
    var dateObject = new Date(2025, month - 1, day);
    return Utilities.formatDate(dateObject, "GMT+8", "MMdd");
  } else {
    return "";
  }
}

function addOneDay(dateString) {
  var dateObject = new Date(
    "2025-" + dateString.substring(0, 2) + "-" + dateString.substring(2, 4)
  );
  dateObject.setDate(dateObject.getDate() + 1);
  return Utilities.formatDate(dateObject, "GMT+8", "MMdd");
}
