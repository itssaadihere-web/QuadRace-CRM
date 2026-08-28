@echo off
set "SCRIPT=%TEMP%\%RANDOM%-%RANDOM%.vbs"
set "TARGET=%~dp0Launch-CRM-Silent.vbs"
set "SHORTCUT=%USERPROFILE%\Desktop\Quadrace CRM.lnk"

echo Set oWS = WScript.CreateObject("WScript.Shell") >> "%SCRIPT%"
echo sLinkFile = "%SHORTCUT%" >> "%SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SCRIPT%"
echo oLink.TargetPath = "wscript.exe" >> "%SCRIPT%"
echo oLink.Arguments = """%TARGET%""" >> "%SCRIPT%"
echo oLink.Description = "Quadrace CRM & Solomon AI Portal" >> "%SCRIPT%"
echo oLink.WorkingDirectory = "%~dp0" >> "%SCRIPT%"
echo oLink.Save >> "%SCRIPT%"

cscript /nologo "%SCRIPT%"
del "%SCRIPT%"

echo Desktop shortcut 'Quadrace CRM' created successfully!
pause
