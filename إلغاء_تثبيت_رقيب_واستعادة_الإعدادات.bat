@echo off
chcp 65001 >nul
title إلغاء تثبيت رَقِيب واستعادة كافة إعدادات النظام الأصلية
color 0C

echo ======================================================
echo           مشروع رَقِيب - الرفيق الرقمي الواعي
echo     إلغاء التثبيت واستعادة إعدادات الجهاز الأصلية
echo ======================================================
echo.

:: التحقق من صلاحيات المدير Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] جاري طلب صلاحيات مسؤول النظام (Administrator)...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb runAs"
    exit /b
)

echo [*] جاري استعادة ملف hosts الأصلي...
if exist "%windir%\System32\drivers\etc\hosts.raqeeb_backup" (
    copy /y "%windir%\System32\drivers\etc\hosts.raqeeb_backup" "%windir%\System32\drivers\etc\hosts" >nul
    echo [+] تم استرجاع ملف hosts الأصلي بنجاح.
) else (
    echo [*] لم يتم العثور على نسخة احتياطية لـ hosts.
)

echo [*] إعادة إعدادات DNS لكافة كروت الشبكة إلى التلقائي (DHCP)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetAdapter | Set-DnsClientServerAddress -ResetServerAddresses" >nul 2>&1
echo [+] تم تفريغ كاش الـ DNS واستعادة الإعداد التلقائي.

echo [*] إزالة سياسات الحظر المفروضة على متصفحات Edge و Chrome...
reg delete "HKLM\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist" /f >nul 2>&1
reg delete "HKLM\SOFTWARE\Policies\Google\Chrome\URLBlocklist" /f >nul 2>&1
reg delete "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v DnsOverHttpsTemplates /f >nul 2>&1
reg delete "HKLM\SOFTWARE\Policies\Google\Chrome" /v DnsOverHttpsTemplates /f >nul 2>&1
reg delete "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v ForceGoogleSafeSearch /f >nul 2>&1
reg delete "HKLM\SOFTWARE\Policies\Google\Chrome" /v ForceGoogleSafeSearch /f >nul 2>&1
reg delete "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v ForceYouTubeRestrict /f >nul 2>&1
reg delete "HKLM\SOFTWARE\Policies\Google\Chrome" /v ForceYouTubeRestrict /f >nul 2>&1

ipconfig /flushdns >nul

echo [*] إيقاف وحذف خدمة التذكير الصامت في الخلفية...
del /f /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\RaqeebLauncher.vbs" >nul 2>&1
del /f /q "%USERPROFILE%\Desktop\إلغاء_تثبيت_رقيب.bat" >nul 2>&1

echo.
echo ======================================================
echo [+] تم حذف درع رَقِيب بالكامل واستعادة كافة إعدادات جهازك.
echo ======================================================
echo.
pause
