Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get project directory
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
dashboardDir = scriptDir & "\dashboard"

' Check if port 3000 is open
Set objExec = WshShell.Exec("netstat -ano")
strOutput = objExec.StdOut.ReadAll

If InStr(strOutput, ":3000") = 0 Then
    ' Start server silently in background with no black terminal window (window style 0)
    WshShell.Run "cmd /c cd /d """ & dashboardDir & """ && npm run dev", 0, False
    WScript.Sleep 4000
End If

' Open browser
WshShell.Run "http://localhost:3000/leads"
