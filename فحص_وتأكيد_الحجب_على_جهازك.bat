@echo off
chcp 65001 >nul
title أداة فحص درع الحماية - رَقِيب
color 0B

echo ======================================================
echo           فحص وتأكيد درع الحجب على جهازك
echo ======================================================
echo.

:: فحص صلاحية الآدمن
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] يرجى تشغيل هذه الأداة كمسؤول (Run as administrator) لفحص كامل الإعدادات.
    echo.
)

:: 1. فحص ملف hosts
set "HOSTS_FILE=%windir%\System32\drivers\etc\hosts"
echo [*] 1. فحص ملف hosts المحلي:
findstr /C:"# === RAQEEB_SHIELD ===" "%HOSTS_FILE%" >nul 2>&1
if %errorLevel% equ 0 (
    echo    [+] [ناجح] درع ملف hosts مفعل ويحجب المواقع المشبوهة محلياً.
) else (
    echo    [-] [غير مفعل] ملف hosts لم يتم تعديله بعد. قم بتشغيل install_raqeeb_windows.bat كمسؤول.
)
echo.

:: 2. فحص سياسة حظر المتصفحات Edge و Chrome
echo [*] 2. فحص سياسات الحظر في متصفحات Edge و Chrome (URLBlocklist):
reg query "HKLM\SOFTWARE\Policies\Microsoft\Edge\URLBlocklist" >nul 2>&1
if %errorLevel% equ 0 (
    echo    [+] [ناجح] متصفح Microsoft Edge محمي بالكامل وممنوع من فتح المواقع المشبوهة.
) else (
    echo    [-] [غير مفعل] سياسة Edge لم تُثبت بعد.
)

reg query "HKLM\SOFTWARE\Policies\Google\Chrome\URLBlocklist" >nul 2>&1
if %errorLevel% equ 0 (
    echo    [+] [ناجح] متصفح Google Chrome محمي بالكامل وممنوع من فتح المواقع المشبوهة.
) else (
    echo    [-] [غير مفعل] سياسة Chrome لم تُثبت بعد.
)
echo.

:: 3. فحص الـ DNS
echo [*] 3. فحص خوادم DNS النشطة:
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object { $_.ServerAddresses.Count -gt 0 } | Select-Object -ExpandProperty ServerAddresses"
echo.

echo ======================================================
echo تنبيه هام بعد التثبيت:
echo إذا كنت قد فتحت أي موقع سابقاً، قد يكون المتصفح مخزناً للصفحة مؤقتاً (Cache).
echo أغلق متصفح Edge أو Chrome تماماً ثم أعد فتحه لتطبيق الحظر فوراً.
echo ======================================================
echo.
pause
