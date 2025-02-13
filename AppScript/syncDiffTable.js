/**
 * 當工作表有編輯動作時自動觸發
 */
function onEdit(e) {
  // e.range: 編輯到的儲存格範圍
  // e.source: 活動試算表
  // e.value:  新的值（如果是單一儲存格編輯）

  // 1. 取得編輯位置
  var sheet = e.range.getSheet();
  var sheetName = sheet.getName();

  // 2. 設定參數：總表名稱 & 各團隊子表名稱
  var masterSheetName = "總表"; // "總表(A)" 的名稱
  var teamSheets = ["台南團隊", "高雄團隊", "屏東團隊", "中區團隊", "北區團隊"]; // 各團隊工作表名稱

  // 3. 根據編輯的工作表，執行不同邏輯
  if (sheetName === masterSheetName) {
    // 如果是在總表編輯
    syncFromMaster(e);
  } else if (teamSheets.indexOf(sheetName) > -1) {
    // 如果是在團隊其中一個子表編輯
    syncFromTeam(e);
  }
}

function getHeaderIndexMap(sheet) {
  // 讀取工作表第 1 列, 從第 1 欄開始, 直到該工作表的最後一欄
  var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // 建立一個物件，用來儲存「欄位名稱 -> 欄位索引(1-based)」
  var indexMap = {};
  for (var col = 0; col < headerRow.length; col++) {
    var colName = headerRow[col];
    // 假如欄位名稱不為空，儲存進 map
    if (colName) {
      indexMap[colName] = col + 1; // col 是 0-based，col+1 才是試算表的 1-based
    }
  }
  return indexMap;
}

/**
 * 當「總表(A)」資料有編輯/新增時，更新到對應的團隊表
 */
function syncFromMaster(e) {
  var range = e.range;
  var sheet = range.getSheet();
  var startRow = range.getRow();
  var numRows = range.getNumRows();

  var headerIndexMap = getHeaderIndexMap(sheet);
  // 讀取此列的完整資料 (依照標題列的總欄數)
  var lastCol = sheet.getLastColumn();

  for (var row = startRow; row <= startRow + numRows - 1; row++) {
    // 取得此列所有資料
    var rowData = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
    var teamName = rowData[headerIndexMap["負責團隊"] - 1]; // 注意: -1 後才是陣列索引
    var recordId = rowData[headerIndexMap["編號"] - 1];

    // 如果沒有團隊或沒有編號，就不處理
    if (!teamName || !recordId) {
      return;
    }

    var ss = e.source;
    var teamSheet = ss.getSheetByName(teamName);
    if (!teamSheet) {
      // 假如沒有對應的子表，看要不要自動建立，這裡先直接跳過
      return;
    }

    // 在子表裡同樣用 header row 取得各欄位位置
    var targetRowInTeam = 0; // 先預設找不到
    var teamHeaderMap = getHeaderIndexMap(teamSheet);
    var teamLastCol = teamSheet.getLastColumn();
    var teamLastRow = teamSheet.getLastRow();
    if (teamLastRow > 1) {
      var teamSheetData = teamSheet
        .getRange(2, 1, teamLastRow - 1, teamLastCol)
        .getValues();
      // 讀取子表「從第2列開始」的資料 (因第1列是標題)

      // 找出「編號」在子表中的位置, teamHeaderMap["編號"] 即是子表中「編號」欄位的 1-based 索引
      var teamIdColIndex = teamHeaderMap["編號"];
      if (!teamIdColIndex) {
        // 假如子表 header 沒有「編號」欄位，就跳過
        return;
      }

      // 在子表中尋找相同編號的資料
      for (var i = 0; i < teamSheetData.length; i++) {
        if (teamSheetData[i][teamIdColIndex - 1] === recordId) {
          // 因為 teamSheetData 是從第2列開始抓的，所以實際列號要 +2
          targetRowInTeam = i + 2;
          break;
        }
      }
    }

    // 若找不到就插到最後一列之後
    if (targetRowInTeam === 0) {
      targetRowInTeam = teamLastRow + 1;
    }

    var valuesToWrite = [rowData]; // setValues() 需要二維陣列
    teamSheet.getRange(targetRowInTeam, 1, 1, lastCol).setValues(valuesToWrite);
  }
}

/**
 * 當子表資料有編輯時，回寫總表
 */
function syncFromTeam(e) {
  var range = e.range;
  var sheet = range.getSheet();
  var startRow = range.getRow();
  var numRows = range.getNumRows();

  var headerIndexMap = getHeaderIndexMap(sheet);
  // 讀取此列的完整資料 (依照標題列的總欄數)
  var lastCol = sheet.getLastColumn();

  for (var row = startRow; row <= startRow + numRows - 1; row++) {
    // 取得此列所有資料
    var rowData = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
    var teamName = rowData[headerIndexMap["負責團隊"] - 1]; // 注意: -1 後才是陣列索引
    var recordId = rowData[headerIndexMap["編號"] - 1];

    if (!teamName || !recordId) {
      return;
    }

    // 尋找「總表」
    var masterSheetName = "總表";
    var masterSheet = e.source.getSheetByName(masterSheetName);
    if (!masterSheet) return;

    // 在總表 裡面找對應的編號所在列
    var masterHeaderMap = getHeaderIndexMap(masterSheet);
    var masterLastCol = masterSheet.getLastColumn();
    var masterLastRow = masterSheet.getLastRow();
    var masterData = masterSheet
      .getRange(2, 1, masterLastRow - 1, masterLastCol)
      .getValues();

    var targetRow = 0;
    var masterSheetIdCol = masterHeaderMap["編號"];
    for (var i = 0; i < masterData.length; i++) {
      if (masterData[i][masterSheetIdCol - 1] === recordId) {
        // 因為 masterData 是從第2列開始抓的，所以實際列號要 +2
        targetRow = i + 2;
        break;
      }
    }
    if (targetRow === 0) {
      // 總表尚未找到這筆資料 → 看您是否要自動新增？
      return;
    }

    // 整筆寫回總表
    masterSheet.getRange(targetRow, 1, 1, masterLastCol).setValues([rowData]);
  }
}
