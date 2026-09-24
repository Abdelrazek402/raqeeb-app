@echo off
chcp 65001 >nul
title تجربة تنبيه رَقِيب الفوري
color 0A

echo ======================================================
echo           تجربة تنبيه رَقِيب الصوتي والمنبثق فوراً
echo ======================================================
echo.
echo سيظهر لك الآن تنبيه رقيب المنبثق على شاشتك للتجربة...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "[reflection.assembly]::loadwithpartialname('System.Windows.Forms') | Out-Null; [System.Windows.Forms.MessageBox]::Show('«أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ اللَّطِيفُ الْخَبِيرُ»`n`nتذكير رَقِيب: مرت 10 دقائق من وقتك، استغفر الله وصلِّ على النبي ﷺ.', 'رَقِيب | تذكير الـ 10 دقائق ومراقبة الوقت', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)"

echo [+] تم اختبار ظهور التنبيه بنجاح.
echo.
pause
