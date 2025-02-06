Sub CleanColumn()
    Dim ws As Worksheet
    Dim rng As Range
    Dim cell As Range
    Dim pattern As String
    Dim regex As Object
    
    ' 設定目標工作表與範圍
    Set ws = ActiveSheet
    Set rng = ws.Range("G2:G352") ' 修改範圍
    
    ' 建立正則表達式
    Set regex = CreateObject("VBScript.RegExp")
    regex.pattern = "^楠西里(\d{1,2}鄰)?" ' 匹配「楠西里」或「楠西里數字鄰」
    regex.Global = True
    
    ' 逐個清理
    For Each cell In rng
        If Not IsEmpty(cell.Value) Then
            cell.Value = Trim(regex.Replace(cell.Value, ""))
        End If
    Next cell
    
    MsgBox "清理完成！"
End Sub
