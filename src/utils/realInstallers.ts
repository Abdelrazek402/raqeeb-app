/**
 * Real System Installers and Automated Setup Scripts for Raqeeb
 * Generates actual executable batch (.bat) and powershell (.ps1) files for Windows
 * and Android setup instructions & APK build manifests
 */

import { generateDynamicPairingCode, generateCryptographicToken } from './deviceIdentity';
import { DEFAULT_BLOCKED_DOMAINS } from './blocklist';

export function generateWindowsDesktopInstallerScript(appUrl: string): string {
  let finalUrl = appUrl.replace(/"/g, '');
  
  if (!finalUrl.includes('pairing_code=')) {
    const dynamicCode = generateDynamicPairingCode();
    const dynamicToken = generateCryptographicToken();
    const sep = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${sep}pairing_code=${dynamicCode}&token=${dynamicToken}&installed=batch`;
  }

  return `@echo off
chcp 65001 >nul
:: ============================================================================
:: مُثبّت تطبيق رَقِيب (Raqeeb) لسطح المكتب ونظام ويندوز
:: يقوم بإنشاء اختصار ديسكتوب حقيقي كتطبيق مستقل (Standalone App Window)
:: وتفعيل حماية CleanBrowsing DNS العائلية لحجب المواقع الإباحية على الجهاز
:: ============================================================================

echo.
echo ========================================================
echo       جاري تثبيت تطبيق «رَقِيب» على جهاز الويندوز...
echo ========================================================
echo.

set "APP_URL=${finalUrl}"
set "APP_NAME=رَقِيب - الرفيق الرقمي الواعي"
set "DESKTOP_DIR=%USERPROFILE%\\Desktop"
set "START_MENU_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs"

echo [1/3] البحث عن المتصفح المتاح لتشغيل وضع التطبيق المستقل (App Mode)...

set "BROWSER_EXE="
set "APP_ARG="

if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set "BROWSER_EXE=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
    set "APP_ARG=--app=%APP_URL%"
    echo تم العثور على Microsoft Edge.
) else if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set "BROWSER_EXE=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"
    set "APP_ARG=--app=%APP_URL%"
    echo تم العثور على Microsoft Edge.
) else if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    set "BROWSER_EXE=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
    set "APP_ARG=--app=%APP_URL%"
    echo تم العثور على Google Chrome.
) else if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    set "BROWSER_EXE=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
    set "APP_ARG=--app=%APP_URL%"
    echo تم العثور على Google Chrome.
) else (
    echo سيتم استخدام المتصفح الافتراضي.
)

echo.
echo [2/3] إنشاء اختصار سطح المكتب وقائمة ابدأ (Desktop & Start Menu Shortcut)...

powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$sDesktop = $ws.CreateShortcut('%DESKTOP_DIR%\\%APP_NAME%.lnk'); " ^
  "if ('%BROWSER_EXE%' -ne '') { " ^
  "  $sDesktop.TargetPath = '%BROWSER_EXE%'; " ^
  "  $sDesktop.Arguments = '%APP_ARG%'; " ^
  "} else { " ^
  "  $sDesktop.TargetPath = '%APP_URL%'; " ^
  "} " ^
  "$sDesktop.Description = 'تطبيق رقيب لحفظ الوقت وغض البصر ومواقيت الصلاة'; " ^
  "$sDesktop.Save(); " ^
  "$sStart = $ws.CreateShortcut('%START_MENU_DIR%\\%APP_NAME%.lnk'); " ^
  "if ('%BROWSER_EXE%' -ne '') { " ^
  "  $sStart.TargetPath = '%BROWSER_EXE%'; " ^
  "  $sStart.Arguments = '%APP_ARG%'; " ^
  "} else { " ^
  "  $sStart.TargetPath = '%APP_URL%'; " ^
  "} " ^
  "$sStart.Save();"

echo تم إنشاء أيقونة واختصار التطبيق بنجاح على سطح المكتب وقائمة ابدأ!
echo.
echo ========================================================
echo هل ترغب في تفعيل حجب المواقع غير اللائقة على مستوى الويندوز بالكامل عبر CleanBrowsing DNS؟
echo (نوصي باختيار Y لحماية متصفحات وتطبيقات الويندوز كلها)
echo ========================================================
set /p ENABLE_DNS="اضغط (Y) للتفعيل أو (N) للتخطي ثم اضغط Enter: "

if /i "%ENABLE_DNS%"=="Y" (
    echo.
    echo جاري ضبط خوادم DNS العائلية لحجب المحتوى غير اللائق...
    powershell -NoProfile -Command "Start-Process powershell -Verb runAs -ArgumentList '-NoProfile -Command Get-NetAdapter | Where-Object { $_.Status -eq \\\"Up\\\" } | Set-DnsClientServerAddress -ServerAddresses (\\\"185.228.168.168\\\",\\\"185.228.169.168\\\"); Write-Host \\\"تم تفعيل حماية DNS بنجاح على جميع بطاقات الشبكة!\\\" -ForegroundColor Green; Start-Sleep -Seconds 3'"
)

echo.
echo [3/3] تشغيل تطبيق «رَقِيب» الآن...
if defined BROWSER_EXE (
    start "" "%BROWSER_EXE%" %APP_ARG%
) else (
    start "" "%APP_URL%"
)

echo.
echo تم التثبيت بنجاح! يمكنك الآن تشغيل تطبيق رقيب دائماً من سطح المكتب.
pause
`;
}

export function generateWindowsDnsProtectionScript(): string {
  const domainEntries = DEFAULT_BLOCKED_DOMAINS.map(d => `127.0.0.1 ${d}\r\n127.0.0.1 www.${d}`).join('\r\n');
  const safeEntries = domainEntries.replace(/"/g, '');
  return `@echo off
chcp 65001 >nul
:: سكريبت تفعيل درع الحماية العائلي وتحديث ملف hosts بحظر 480+ نطاق إباحي
echo جاري طلب صلاحيات المسؤول لضبط نظام الـ DNS وحجب النطاقات بملف hosts...
powershell -Command "Start-Process powershell -Verb runAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command Write-Host \\\"جاري تفعيل درع CleanBrowsing وحظر 480+ نطاق محجوب على مستوى كارت الشبكة وملف hosts...\\\" -ForegroundColor Cyan; Add-Content -Path $env:windir\\System32\\drivers\\etc\\hosts -Value \\\"# Raqeeb Master Blocklist\r\n${safeEntries}\\\"; Get-NetAdapter | Where-Object { $_.Status -eq \\\"Up\\\" } | Set-DnsClientServerAddress -ServerAddresses (\\\"185.228.168.168\\\",\\\"185.228.169.168\\\"); ipconfig /flushdns; Write-Host \\\"======================================================\\\" -ForegroundColor Green; Write-Host \\\"تم بنجاح تفعيل درع الحماية وحجب أكثر من 480 نطاق إباحي!\\\" -ForegroundColor Green; Write-Host \\\"======================================================\\\" -ForegroundColor Green; Start-Sleep -Seconds 4'"
`;
}

export function generateAndroidWebApkManifest(appUrl: string): string {
  return JSON.stringify({
    package_name: "org.raqeeb.app",
    app_name: "رَقِيب",
    short_name: "رَقِيب",
    start_url: appUrl,
    theme_color: "#0d9488",
    background_color: "#f8fafc",
    display: "standalone",
    orientation: "portrait",
    version_name: "1.0.0",
    version_code: 1,
    icon_url: (appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl) + '/pwa-512x512.png',
    features: [
      "Real-time Prayer Alerts & Azan Audio",
      "Spiritual Daily Wird Tracker",
      "Adult Content DNS Protection (adult-filter-dns.cleanbrowsing.org)",
      "Daily Habit & Reminder System",
      "Cross-Device Cloud Synchronization"
    ],
    instructions: {
      step1: "افتح الرابط في متصفح Chrome على هاتفك الأندرويد",
      step2: "اضغط على القائمة (⋮) أعلى يسار أو يمين المتصفح",
      step3: "اختر 'تثبيت التطبيق' (Install App) أو 'إضافة إلى الشاشة الرئيسية'",
      step4: "سيتم تحميل أيقونة التطبيق والعمل في وضع الشاشة الكاملة مثل أي تطبيق أندرويد حقيقي."
    }
  }, null, 2);
}
