$WshShell = New-Object -ComObject WScript.Shell
$TargetDir = $pwd.Path
$ShortcutPath = Join-Path "$env:APPDATA" "Microsoft\Windows\Start Menu\Programs\Startup\OmniSight_Server.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = Join-Path $TargetDir "run_server_hidden.vbs"
$Shortcut.WorkingDirectory = $TargetDir
$Shortcut.Save()
Write-Host "Shortcut created successfully at $ShortcutPath"
