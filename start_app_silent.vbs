Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Check if server is responding
intReturn = WshShell.Run("powershell -NoProfile -Command ""try { $res = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/api/model/status' -TimeoutSec 1 -UseBasicParsing; exit 0 } catch { exit 1 }""", 0, True)

If intReturn <> 0 Then
    ' Start server.py hidden in background
    WshShell.Run """" & strDir & "\.venv\Scripts\python.exe"" """ & strDir & "\server.py""", 0, False
    WScript.Sleep 2000
End If

' Open default browser
WshShell.Run "http://localhost:8080"
