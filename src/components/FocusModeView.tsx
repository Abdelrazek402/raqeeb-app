import React, { useState, useEffect } from 'react';
import { 
  Target, Play, CheckCircle2, RotateCcw, Pause, Sparkles, Shield, Clock, 
  Plus, Trash2, CheckSquare, Square, ListTodo, Flame, Award, ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FocusSession, FocusTask } from '../types';
import { sounds } from '../utils/audio';

interface FocusModeViewProps {
  activeSession: FocusSession | null;
  onStartSession: (goal: string, durationMinutes: number, tasks?: FocusTask[]) => void;
  onCompleteSession: (reflections?: string) => void;
  onCancelSession: () => void;
}

const DEFAULT_SUGGESTED_TASKS = [
  'إعداد المسودة الأولى وتحديد العناوين',
  'مراجعة وتدقيق الأرقام والحسابات',
  'تلخيص أهم النقاط والنتائج',
  'تنسيق الملف وحفظ النسخة النهائية'
];

export const FocusModeView: React.FC<FocusModeViewProps> = ({
  activeSession,
  onStartSession,
  onCompleteSession,
  onCancelSession
}) => {
  const [goalInput, setGoalInput] = useState('إعداد تقرير Excel ومراجعة الحسابات');
  const [tasks, setTasks] = useState<FocusTask[]>([
    { id: 'task_1', title: 'مراجعة بيانات ومصادر الملف الأساسية', isCompleted: false },
    { id: 'task_2', title: 'إدخال المعادلات وحساب المجاميع', isCompleted: false },
    { id: 'task_3', title: 'التدقيق النهائي وتصدير النسخة المعتمدة', isCompleted: false }
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [activeTasks, setActiveTasks] = useState<FocusTask[]>([]);
  const [quickTaskInput, setQuickTaskInput] = useState('');

  const [selectedDuration, setSelectedDuration] = useState<number>(120);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(120 * 60);
  const [showFinishedDialog, setShowFinishedDialog] = useState(false);
  const [reflections, setReflections] = useState('');

  // Sync state when activeSession changes
  useEffect(() => {
    if (activeSession && activeSession.isActive) {
      setTimeLeft(activeSession.remainingSeconds);
      if (activeSession.tasks && activeSession.tasks.length > 0) {
        setActiveTasks(activeSession.tasks);
      } else if (tasks.length > 0 && activeTasks.length === 0) {
        setActiveTasks(tasks);
      }
    }
  }, [activeSession]);

  // Countdown loop
  useEffect(() => {
    if (!activeSession || !activeSession.isActive || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowFinishedDialog(true);
          sounds.playSuccessTone();
          try {
            confetti({ particleCount: 100, spread: 80 });
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession?.isActive, isPaused]);

  // Handle adding pre-session task
  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = newTaskInput.trim();
    if (!title) return;

    const newTask: FocusTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      isCompleted: false
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskInput('');
    sounds.playSuccessTone();
  };

  // Add suggestion task
  const handleAddSuggestedTask = (text: string) => {
    if (tasks.some(t => t.title === text)) return;
    const newTask: FocusTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: text,
      isCompleted: false
    };
    setTasks(prev => [...prev, newTask]);
    sounds.playSuccessTone();
  };

  // Handle removing pre-session task
  const handleRemoveTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Handle starting session
  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;
    
    // Pass tasks along with goal and duration
    onStartSession(goalInput.trim(), selectedDuration, tasks);
    setActiveTasks(tasks);
    setTimeLeft(selectedDuration * 60);
    setIsPaused(false);
    setShowFinishedDialog(false);
  };

  // Toggle active task completion during session
  const handleToggleActiveTask = (taskId: string) => {
    setActiveTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          const newState = !t.isCompleted;
          if (newState) {
            sounds.playSuccessTone();
          }
          return { ...t, isCompleted: newState };
        }
        return t;
      });

      // Check if all are completed now
      const allDone = updated.length > 0 && updated.every(t => t.isCompleted);
      if (allDone) {
        try {
          confetti({ particleCount: 60, spread: 60 });
        } catch {}
      }

      return updated;
    });
  };

  // Quick add task during active session
  const handleAddActiveTask = (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTaskInput.trim();
    if (!title) return;

    const newTask: FocusTask = {
      id: `task_${Date.now()}`,
      title,
      isCompleted: false
    };

    setActiveTasks(prev => [...prev, newTask]);
    setQuickTaskInput('');
    sounds.playSuccessTone();
  };

  // Remove task during active session
  const handleRemoveActiveTask = (taskId: string) => {
    setActiveTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleFinishEarly = () => {
    setShowFinishedDialog(true);
    sounds.playSuccessTone();
    try {
      confetti({ particleCount: 80, spread: 70 });
    } catch {}
  };

  const handleSaveCompletion = () => {
    onCompleteSession(reflections);
    setShowFinishedDialog(false);
    setReflections('');
  };

  const formatTimer = (secondsTotal: number) => {
    const hours = Math.floor(secondsTotal / 3600);
    const minutes = Math.floor((secondsTotal % 3600) / 60);
    const secs = secondsTotal % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const durationOptions = [
    { label: '25 دقيقة (بومودورو)', value: 25 },
    { label: '45 دقيقة (حصة دراسية)', value: 45 },
    { label: '60 دقيقة (ساعة كاملة)', value: 60 },
    { label: '120 دقيقة (ساعتان - عمل عميق)', value: 120 },
  ];

  const completedActiveCount = activeTasks.filter(t => t.isCompleted).length;
  const activeTaskProgressPct = activeTasks.length > 0 
    ? Math.round((completedActiveCount / activeTasks.length) * 100) 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto pb-12" dir="rtl">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-['Amiri',serif] text-slate-900 flex items-center gap-2">
                وضع التركيز والعمل العميق (Focus Mode)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                حدد هدفك وقائمة مهامك المصغرة، واستمر في الإنجاز بينما يحميك التطبيق من مشتتات السوشيال والتنبيهات.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-teal-50/80 border border-teal-200 px-3 py-1.5 rounded-2xl self-stretch sm:self-auto justify-center">
            <Shield className="w-4 h-4 text-teal-700" />
            <span className="text-xs font-bold text-teal-800">حماية من المشتتات مفعلة</span>
          </div>
        </div>
      </div>

      {/* Main Focus Component */}
      {!activeSession || !activeSession.isActive ? (
        /* Setup session form */
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-8">
          <form onSubmit={handleStart} className="space-y-7">
            
            {/* Main Goal Question: "هتعمل إيه؟" */}
            <div className="space-y-2">
              <label htmlFor="focus-goal-input" className="block text-lg font-bold font-['Amiri',serif] text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                سؤال البداية: هتعمل إيه في جلسة التركيز دي؟
              </label>
              <input
                id="focus-goal-input"
                type="text"
                placeholder="مثال: إعداد تقرير Excel ومراجعة الحسابات..."
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 text-sm md:text-base transition-all shadow-2xs font-medium"
                required
              />
              <p className="text-xs text-slate-500">
                تحديد الهدف العام يربط نيتك بالإنجاز ويوجه طاقتك نحو النتيجة المرجوة.
              </p>
            </div>

            {/* ========================================================================= */}
            {/* MINI TASK LIST BUILDER (قائمة المهام المصغرة قبل بدء الجلسة) */}
            {/* ========================================================================= */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                    <ListTodo className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      قائمة المهام المصغرة للجلسة (Mini Task Checklist)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      قسم هدفك إلى 2-4 مهام سريعة لتظهر أمامك أثناء التركيز وتحفزك على الإنجاز خطوة بخطوة.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-100/70 px-2.5 py-1 rounded-xl border border-teal-200 self-start sm:self-auto">
                  {tasks.length} مهام محددة
                </span>
              </div>

              {/* Add Task Input Row */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="اكتب مهمة مصغرة (مثال: تلخيص الصفحة 1 إلى 5)..."
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTask();
                    }
                  }}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => handleAddTask()}
                  disabled={!newTaskInput.trim()}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  إضافة
                </button>
              </div>

              {/* Task Suggestions Pills */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 block">اقتراحات سريعة للمهام:</span>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_SUGGESTED_TASKS.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddSuggestedTask(sug)}
                      className="text-[11px] font-medium bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-teal-600" />
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Added Tasks List */}
              {tasks.length > 0 ? (
                <div className="space-y-2 pt-2">
                  {tasks.map((task, index) => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs group hover:border-teal-300 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                          {task.title}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveTask(task.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف المهمة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-white/60 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                  لم تُضف أي مهام مصغرة بعد. إضافة المهام تجعل تقدمك ملموساً أثناء تشغيل المؤقت!
                </div>
              )}
            </div>

            {/* Duration Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                مدة جلسة التركيز:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {durationOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    id={`duration-opt-${opt.value}`}
                    onClick={() => setSelectedDuration(opt.value)}
                    className={`py-3.5 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedDuration === opt.value
                        ? 'bg-teal-700 border-teal-700 text-white shadow-sm ring-2 ring-teal-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Protection behavior explanation during Focus */}
            <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-teal-800">
                <Shield className="w-4 h-4 text-teal-600" />
                سلوك الحماية الذكية أثناء التركيز:
              </div>
              <ul className="space-y-1 text-slate-600 pr-4 list-disc text-xs">
                <li>المتصفح يظل شغالاً لأبحاثك وعملك الطبيعي دون أي إعاقة.</li>
                <li>تطبيقات ومواقع السوشيال ميديا مقيدة بالكامل لحماية انتباهك.</li>
                <li>تظهر قائمة مهامك المصغرة أمامك لتعليم كل خطوة فور إنجازها.</li>
              </ul>
            </div>

            {/* Start Button */}
            <button
              id="start-focus-session-btn"
              type="submit"
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-black text-base md:text-lg rounded-2xl shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              ابدأ الآن — 🎯 Focus Mode ({selectedDuration} دقيقة {tasks.length > 0 ? `• ${tasks.length} مهام` : ''})
            </button>
          </form>
        </div>
      ) : (
        /* ========================================================================= */
        /* ACTIVE FOCUS SESSION DISPLAY WITH INTEGRATED MINI TASK CHECKLIST */
        /* ========================================================================= */
        <div className="space-y-6">
          
          {/* Top Hero Active Timer Card */}
          <div className="bg-white border-2 border-teal-600 rounded-3xl p-6 md:p-8 text-center shadow-md relative overflow-hidden">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Goal badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-bold mb-4 shadow-2xs">
              <Target className="w-4 h-4 text-teal-600" />
              <span>الهدف الحالي: <strong className="text-teal-950 font-black">{activeSession.goal}</strong></span>
            </div>

            {/* Giant Countdown Clock */}
            <div className="my-4 sm:my-6">
              <div className="text-5xl sm:text-7xl md:text-8xl font-mono font-black text-slate-900 tracking-wider">
                {formatTimer(timeLeft)}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 flex items-center justify-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-teal-600" />
                {isPaused ? 'الجلسة متوقفة مؤقتاً' : 'جلسة عمل عميق نشطة... استمر في التركيز حتى النهاية'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-5 border-t border-slate-100">
              <button
                id="pause-resume-focus-btn"
                onClick={() => setIsPaused(!isPaused)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isPaused ? <Play className="w-4 h-4 text-teal-600 fill-current" /> : <Pause className="w-4 h-4 text-amber-600" />}
                {isPaused ? 'استئناف' : 'إيقاف مؤقت'}
              </button>

              <button
                id="finish-early-focus-btn"
                onClick={handleFinishEarly}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                أنهيت الجلسة والمهمة بفضل الله
              </button>

              <button
                id="cancel-focus-btn"
                onClick={onCancelSession}
                className="px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                إلغاء
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PROMINENT MINI TASK CHECKLIST DURING ACTIVE FOCUS */}
          {/* ========================================================================= */}
          <div className="bg-white border border-teal-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-black">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-['Amiri',serif] flex items-center gap-2">
                    قائمة مهام الجلسة (Checklist للإنجاز)
                  </h3>
                  <p className="text-xs text-slate-500">
                    اضغط على أي مهمة فور إنهائها لتعليمها والاستمتاع بمتعة الإنجاز!
                  </p>
                </div>
              </div>

              {/* Progress badge & percentage */}
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-700 block">
                    {completedActiveCount} من {activeTasks.length} مكتملة
                  </span>
                  <span className="text-[11px] text-teal-600 font-black">{activeTaskProgressPct}% إنجاز</span>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center relative bg-teal-50">
                  <span className="text-xs font-black text-teal-800">{activeTaskProgressPct}%</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${activeTaskProgressPct}%` }}
              />
            </div>

            {/* Active Task Items List */}
            {activeTasks.length > 0 ? (
              <div className="space-y-2.5">
                {activeTasks.map((task, index) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleActiveTask(task.id)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                      task.isCompleted
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-2xs'
                        : 'bg-slate-50/80 border-slate-200 hover:bg-teal-50/50 hover:border-teal-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                          task.isCompleted 
                            ? 'bg-emerald-600 text-white' 
                            : 'border-2 border-slate-400 bg-white hover:border-teal-600'
                        }`}
                      >
                        {task.isCompleted ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-transparent" />}
                      </button>

                      <div className="min-w-0">
                        <span className={`text-xs sm:text-sm font-bold block transition-all ${
                          task.isCompleted ? 'line-through text-emerald-800/80' : 'text-slate-900'
                        }`}>
                          {task.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.isCompleted ? (
                        <span className="text-[10px] font-black bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-lg border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> تم الإنجاز
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">
                          قيد التنفيذ...
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveActiveTask(task.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        title="حذف المهمة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                لا توجد مهام مصغرة مضافة لهذه الجلسة. يمكنك إضافة مهمة سريعة بالأسفل!
              </div>
            )}

            {/* Quick Add Task input during session */}
            <form onSubmit={handleAddActiveTask} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="+ إضافة مهمة فرعية جديدة للجلسة الحالية..."
                value={quickTaskInput}
                onChange={(e) => setQuickTaskInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                disabled={!quickTaskInput.trim()}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة
              </button>
            </form>

            {/* All Tasks Done Celebration Banner */}
            {activeTasks.length > 0 && completedActiveCount === activeTasks.length && (
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-xs flex items-center justify-between gap-3 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2.5">
                  <Award className="w-6 h-6 text-amber-300 shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-black">ما شاء الله تبارك الله! أنجزت جميع المهام المصغرة 🏆</h4>
                    <p className="text-[11px] text-emerald-100">يمكنك إنهاء الجلسة الآن وتسجيل إنجازك أو مواصلة العمل حتى انتهاء الوقت.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFinishEarly}
                  className="px-3.5 py-2 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-black rounded-xl shadow-xs shrink-0 cursor-pointer"
                >
                  تسجيل الإنهاء 🎉
                </button>
              </div>
            )}

            {/* Spiritual Motivation Quote */}
            <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100 italic">
              «وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ وَرَسُولُهُ وَالْمُؤْمِنُونَ» • خطوة بخطوة يُبنى الصرح العظيم.
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPLETION MODAL: "خلصت التقرير؟ الحمد لله الذي أعانك" */}
      {/* ========================================================================= */}
      {showFinishedDialog && (
        <div 
          id="focus-completion-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in zoom-in-95 duration-200"
        >
          <div className="relative w-full max-w-lg bg-white border-2 border-teal-500 rounded-3xl shadow-xl p-6 md:p-8 text-center text-slate-800">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mb-5 text-teal-600">
              <Sparkles className="w-8 h-8 animate-bounce" />
            </div>

            <h3 className="text-2xl font-bold font-['Amiri',serif] text-slate-900 mb-1">
              خلصت {activeSession?.goal || 'المهمة'}؟
            </h3>

            <p className="text-xl font-bold font-['Amiri',serif] text-teal-700 mb-3">
              «الحمد لله الذي أعانك»
            </p>

            {/* Task summary */}
            {activeTasks.length > 0 && (
              <div className="my-3 p-3 bg-teal-50/80 border border-teal-200 rounded-2xl text-xs font-bold text-teal-900 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>تم إتمام <strong>{completedActiveCount}</strong> من أصل <strong>{activeTasks.length}</strong> مهام مصغرة بنجاح!</span>
              </div>
            )}

            <p className="text-xs text-slate-500 mb-5 max-w-md mx-auto leading-relaxed">
              ما كان من توفيق فمن الله وحده. لقد استثمرت وقتك في النافع وأثمر عملك.
            </p>

            <div className="mb-6 text-right">
              <label htmlFor="session-reflections-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                ملاحظات أو نتائج الجلسة (اختياري):
              </label>
              <input
                id="session-reflections-input"
                type="text"
                placeholder="مثال: تم إنهاء المسودة الأولى بنجاح..."
                value={reflections}
                onChange={(e) => setReflections(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              id="save-focus-complete-btn"
              onClick={handleSaveCompletion}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              تسجيل الإنجاز وإغلاق الجلسة
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
