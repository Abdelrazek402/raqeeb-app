@echo off
chcp 65001 >nul
title مثبت رَقِيب - درع الحماية ومزامنة الأجهزة v1.2
color 0A

echo ======================================================
echo           مشروع رَقِيب - الرفيق الرقمي الواعي
echo     تثبيت درع الحماية ومزامنة الكمبيوتر مع الهاتف
echo ======================================================
echo.

:: 1. التحقق من صلاحيات المدير Administrator والترقية التلقائية
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] جاري طلب صلاحيات مسؤول النظام (Administrator)...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb runAs"
    exit /b
)

echo [+] تم التحقق من صلاحيات المدير بنجاح.
echo.

:: 2. إنشاء مجلد البرنامج
set "INSTALL_DIR=%LOCALAPPDATA%\Raqeeb"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: 3. حفظ بيانات الاقتران والرمز التعريفي
echo {"token":"rq_live_sec_789412","pairingCode":"RQ-894215","installedAt":"%DATE% %TIME%","version":"1.2.4"} > "%INSTALL_DIR%\raqeeb-config.json"
echo [+] تم حفظ إعدادات الاقتران بالرمز: RQ-894215

:: 4. النسخ الاحتياطي لملف hosts
set "HOSTS_FILE=%windir%\System32\drivers\etc\hosts"
if not exist "%HOSTS_FILE%.raqeeb_backup" (
    copy /y "%HOSTS_FILE%" "%HOSTS_FILE%.raqeeb_backup" >nul
    echo [+] تم إنشاء نسخة احتياطية آمنة لملف hosts
)

:: 5. حقن قائمة الحجب الفوري للمواقع الإباحية في ملف hosts
findstr /C:"# === RAQEEB_SHIELD ===" "%HOSTS_FILE%" >nul 2>&1
if %errorLevel% neq 0 (
    echo. >> "%HOSTS_FILE%"
    echo # === RAQEEB_SHIELD === >> "%HOSTS_FILE%"
    echo 0.0.0.0 pornhub.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 www.pornhub.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 xvideos.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 www.xvideos.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 xnxx.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 www.xnxx.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 stripchat.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 chaturbate.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 redtube.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 youporn.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 onlyfans.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 omegle.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 cam4.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 bongacams.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 livejasmin.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 spankbang.com >> "%HOSTS_FILE%"
    echo 0.0.0.0 eporner.com >> "%HOSTS_FILE%"
    echo # === RAQEEB_SHIELD_END === >> "%HOSTS_FILE%"
    echo [+] تم تفعيل حجب النطاقات المشبوهة في ملف hosts المحلي.
)

:: 6. ضبط DNS العائلي النظيف (Cloudflare Family 1.1.1.3 + CleanBrowsing) عبر PowerShell
echo [*] جاري تفعيل فلتر الـ DNS النظيف لكافة كروت الشبكة والوايفاي...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Get-NetAdapter | Where-Object { $_.Status -eq 'Up' -or $_.OperationalStatus -eq 'Up' } | ForEach-Object { Set-DnsClientServerAddress -InterfaceIndex $_.ifIndex -ServerAddresses @('1.1.1.3','1.0.0.3','185.228.168.168'); Write-Host ('[+] DNS applied to adapter: ' + $_.Name) } } catch { Write-Host '[!] Error setting DNS via PowerShell' }"

:: 7. فرض سياسة الحجب على متصفحات Microsoft Edge و Google Chrome (URLBlocklist + SafeSearch)
echo [*] جاري تفعيل حظر المتصفحات الفوري (Edge & Chrome URLBlocklist)...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v ForceGoogleSafeSearch /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v ForceYouTubeRestrict /t REG_DWORD /d 2 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v DnsOverHttpsMode /t REG_SZ /d "secure" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v DnsOverHttpsTemplates /t REG_SZ /d "https://family.cloudflare-dns.com/dns-query" /f >nul 2>&1

reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist" /v 1 /t REG_SZ /d "*://*pornhub.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist" /v 2 /t REG_SZ /d "*://*xvideos.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist" /v 3 /t REG_SZ /d "*://*xnxx.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist" /v 4 /t REG_SZ /d "*://*stripchat.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist" /v 5 /t REG_SZ /d "*://*chaturbate.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist" /v 6 /t REG_SZ /d "*://*redtube.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist" /v 7 /t REG_SZ /d "*://*youporn.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist" /v 8 /t REG_SZ /d "*://*onlyfans.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist" /v 9 /t REG_SZ /d "*://*omegle.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist" /v 10 /t REG_SZ /d "*://*spankbang.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist" /v 11 /t REG_SZ /d "*://*eporner.com/*" /f >nul 2>&1

reg add "HKLM\SOFTWARE\Policies\Google\Chrome" /v ForceGoogleSafeSearch /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Google\Chrome" /v ForceYouTubeRestrict /t REG_DWORD /d 2 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Google\Chrome" /v DnsOverHttpsMode /t REG_SZ /d "secure" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Google\Chrome" /v DnsOverHttpsTemplates /t REG_SZ /d "https://family.cloudflare-dns.com/dns-query" /f >nul 2>&1

reg add "HKLM\SOFTWARE\Policies\Google\Chrome\URLBlocklist" /v 1 /t REG_SZ /d "*://*pornhub.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Google\Chrome\URLBlocklist" /v 2 /t REG_SZ /d "*://*xvideos.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Google\Chrome\URLBlocklist" /v 3 /t REG_SZ /d "*://*xnxx.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Google\Chrome\URLBlocklist" /v 4 /t REG_SZ /d "*://*stripchat.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Google\Chrome\URLBlocklist" /v 5 /t REG_SZ /d "*://*chaturbate.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Google\Chrome\URLBlocklist" /v 6 /t REG_SZ /d "*://*redtube.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Google\Chrome\URLBlocklist" /v 7 /t REG_SZ /d "*://*youporn.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Google\Chrome\URLBlocklist" /v 8 /t REG_SZ /d "*://*onlyfans.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Google\Chrome\URLBlocklist" /v 9 /t REG_SZ /d "*://*omegle.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Google\Chrome\URLBlocklist" /v 10 /t REG_SZ /d "*://*spankbang.com/*" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Google\Chrome\URLBlocklist" /v 11 /t REG_SZ /d "*://*eporner.com/*" /f >nul 2>&1

ipconfig /flushdns >nul
echo [+] تم تفعيل درع الحجب الشامل لمتصفحات Edge و Chrome وكروت الشبكة.

:: 7. توليد سكريبت التذكير والمراقبة الصامت لويندوز
(
echo $configPath = "$env:LOCALAPPDATA\Raqeeb\raqeeb-config.json"
echo $lastAlert = [DateTime]::Now
echo while ($true) {
echo     try {
echo         $diff = ([DateTime]::Now - $lastAlert).TotalMinutes
echo         if ($diff -ge 10) {
echo             $wshell = New-Object -ComObject Wscript.Shell
echo             $res = $wshell.Popup("مضت 10 دقائق من استخدام الجهاز.`nقال تعالى: {ألا يعلم من خلق وهو اللطيف الخبير}`n`nجدد نيتك واذكر الله: أستغفر الله العظيم وأتوب إليه.", 15, "رَقِيب | تذكير واعي", 64)
echo             $lastAlert = [DateTime]::Now
echo         }
echo         Start-Sleep -Seconds 30
echo     } catch {
echo         Start-Sleep -Seconds 60
echo     }
echo }
) > "%INSTALL_DIR%\raqeeb-daemon.ps1"

:: 8. إنشاء مشغل غير مرئي في بدء التشغيل (Startup VBScript)
set "STARTUP_VBS=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\RaqeebLauncher.vbs"
(
echo Set WshShell = CreateObject("WScript.Shell"^)
echo WshShell.Run "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""%INSTALL_DIR%\raqeeb-daemon.ps1""", 0, False
) > "%STARTUP_VBS%"
echo [+] تم جدولة التشغيل التلقائي الصامت في الخلفية مع إقلاع الويندوز.

:: تشغيل خادم التذكيرات فوراً الآن بدون انتظار إعادة تشغيل الجهاز
start "" wscript.exe "%STARTUP_VBS%"
echo [+] تم إطلاق المراقب الصامت الآن في الخلفية بنجاح.

:: 9. توليد ملف إلغاء التثبيت النظيف
(
echo @echo off
echo chcp 65001 ^>nul
echo title إلغاء تثبيت رَقِيب
echo net session ^>nul 2^>^&1 ^|^| (powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb runAs" ^& exit /b^)
echo [*] استرجاع ملف hosts الأصلي...
echo if exist "%windir%\System32\drivers\etc\hosts.raqeeb_backup" copy /y "%windir%\System32\drivers\etc\hosts.raqeeb_backup" "%windir%\System32\drivers\etc\hosts" ^>nul
echo [*] إعادة ضبط الـ DNS إلى تلقائي (DHCP)...
echo powershell -Command "Get-NetAdapter | Set-DnsClientServerAddress -ResetServerAddresses" ^>nul 2^>^&1
echo [*] إزالة سياسات الحظر من المتصفحات...
echo reg delete "HKLM\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist" /f ^>nul 2^>^&1
echo reg delete "HKLM\SOFTWARE\Policies\Google\Chrome\URLBlocklist" /f ^>nul 2^>^&1
echo reg delete "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v DnsOverHttpsTemplates /f ^>nul 2^>^&1
echo reg delete "HKLM\SOFTWARE\Policies\Google\Chrome" /v DnsOverHttpsTemplates /f ^>nul 2^>^&1
echo ipconfig /flushdns ^>nul
echo del /f /q "%STARTUP_VBS%" ^>nul 2^>^&1
echo echo [+] تم إلغاء تثبيت رَقِيب واستعادة كافة إعدادات جهازك الأصلية.
echo pause
) > "%INSTALL_DIR%\uninstall-raqeeb-windows.bat"

copy /y "%INSTALL_DIR%\uninstall-raqeeb-windows.bat" "%~dp0uninstall_raqeeb.bat" >nul 2>&1
copy /y "%INSTALL_DIR%\uninstall-raqeeb-windows.bat" "%USERPROFILE%\Desktop\إلغاء_تثبيت_رقيب.bat" >nul 2>&1

echo.
echo ======================================================
echo  تهانينا! اكتمل تثبيت رَقِيب بنجاح على هذا الكمبيوتر
echo  - كود المزامنة الخاص بجهازك: RQ-894215
echo  - الحماية تعمل الآن في الخلفية دون أي بطء أو تعطيل.
echo  - تم وضع نسخة من ملف إلغاء التثبيت على سطح المكتب.
echo ======================================================
echo.
pause
