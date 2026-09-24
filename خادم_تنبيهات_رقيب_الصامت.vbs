' ===================================================================
'               رَقِيب | خادم التنبيهات والأذكار الصامت لويندوز
'               Raqeeb Silent Windows Daemon (10-Min Reminder)
' ===================================================================
On Error Resume Next

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

Dim reminders(8)
reminders(0) = "قال رسول الله ﷺ: «أَحَبُّ الْكَلَامِ إِلَى اللَّهِ أَرْبَعٌ: سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ»"
reminders(1) = "«أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ اللَّطِيفُ الْخَبِيرُ» .. استحضر مراقبة الله في خلوتك وتصفحك."
reminders(2) = "«اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا» .. رطّب لسانك الآن بالاستغفار."
reminders(3) = "«مَا يَلْفِظُ مِن قَوْلٍ إِلَّا لَدَيْهِ رَقِيبٌ عَتِيدٌ» .. اجعل دقائقك حجة لك لا عليك."
reminders(4) = "«وَالصُّبْحِ إِذَا تَنَفَّسَ» .. هل صليت صلواتك في أوقاتها؟"
reminders(5) = "اللهم صلِّ وسلّم وبارك على نبينا محمد ﷺ."
reminders(6) = "«فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ» .. سبّح واحمد الله تعالى."
reminders(7) = "«إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ» .. جدد نيتك في عملك وتصفحك لوجه الله تعالى."
reminders(8) = "«لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ» .. كنز من كنوز الجنة."

Dim index
index = 0
Dim lastMorningDate, lastEveningDate
lastMorningDate = ""
lastEveningDate = ""

' تنبيه تأكيد بدء العمل
WshShell.Popup "تم تفعيل درع رَقِيب للتذكير والمراقبة الواعية بنجاح." & vbCrLf & "سيعمل في الخلفية لتذكيرك بأذكار الصباح والمساء وكل 10 دقائق بالأذكار ومراقبة الوقت.", 6, "رَقِيب | الرفيق الرقمي الواعي", 64

Dim minuteCounter
minuteCounter = 0

' حلقة التنبيهات الدورية في الخلفية (فحص كل دقيقة)
Do
    WScript.Sleep 60000 ' فحص كل 60 ثانية
    minuteCounter = minuteCounter + 1

    Dim currentHour, currentMinute, currentTimeStr, currentDateStr
    currentHour = Right("0" & Hour(Now), 2)
    currentMinute = Right("0" & Minute(Now), 2)
    currentTimeStr = currentHour & ":" & currentMinute
    currentDateStr = Year(Now) & "-" & Right("0" & Month(Now), 2) & "-" & Right("0" & Day(Now), 2)

    ' 1. فحص أذكار الصباح (06:30)
    If currentTimeStr = "06:30" And lastMorningDate <> currentDateStr Then
        lastMorningDate = currentDateStr
        WshShell.Popup "☀️ حان وقت أذكار الصباح المباركة" & vbCrLf & "«أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ..»" & vbCrLf & "حصّن يومك ونفسك الآن بذكر الله.", 15, "رَقِيب | أذكار الصباح", 64
    End If

    ' 2. فحص أذكار المساء (17:30)
    If currentTimeStr = "17:30" And lastEveningDate <> currentDateStr Then
        lastEveningDate = currentDateStr
        WshShell.Popup "🌙 حان وقت أذكار المساء المباركة" & vbCrLf & "«أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ..»" & vbCrLf & "حصّن ليلتك واختم نهارك بذكر الله.", 15, "رَقِيب | أذكار المساء", 64
    End If

    ' 3. التذكير الدوري كل 10 دقائق
    If minuteCounter >= 10 Then
        minuteCounter = 0
        WshShell.Popup reminders(index), 12, "رَقِيب | تذكير الـ 10 دقائق ومراقبة الوقت", 64
        index = (index + 1) Mod 9
    End If
Loop
