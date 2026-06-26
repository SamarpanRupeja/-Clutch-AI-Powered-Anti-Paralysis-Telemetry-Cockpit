/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { useFirebase } from "./firebaseHooks";
import {
  Terminal,
  Zap,
  ArrowRight,
  Loader2,
  Plus,
  ChevronRight,
  LayoutDashboard,
  Calendar,
  FileText,
  CheckCircle2,
  Mic,
  Smartphone,
  Code,
  Boxes,
  X,
  Trash2,
} from "lucide-react";
import { Task, TaskStatus } from "./types/database.types";
import { ActiveTaskCard } from "./components/clutch/active-task-card";
import { HabitTelemetry } from "./components/HabitTelemetry";
import { OnboardingWizard } from "./components/OnboardingWizard";

// Generates UUID
const generateUUID = () =>
  Math.random().toString(36).substring(2, 11) +
  "-" +
  Math.random().toString(36).substring(2, 6);

const getTodayDateString = () => new Date().toISOString().split("T")[0];

export const SYSTEM_CALENDAR_ENCLAVE = [
  {
    id: "cal-1",
    title: "Operating Systems Lab",
    start: `${getTodayDateString()}T09:00:00`,
    end: `${getTodayDateString()}T11:00:00`,
    isCalendarBlock: true,
  },
  {
    id: "cal-2",
    title: "Full-Stack Engineering Lecture",
    start: `${getTodayDateString()}T14:00:00`,
    end: `${getTodayDateString()}T15:30:00`,
    isCalendarBlock: true,
  },
];

export const ALL_SCENARIOS = [
  {
    label: "💻 Exam at 9AM",
    text: "I have a massive Biology final at 9 AM tomorrow, I haven't started reviewing chapter 4 through 8, and I need a study guide fast.",
    type: "urgent",
  },
  {
    label: "🚨 Server Crash",
    text: "Production DB is showing 100% CPU lock right now. API requests are failing with 500s. I need to triage immediately.",
    type: "technical",
  },
  {
    label: "📊 Investor Pitch",
    text: "Investor pitch is in exactly 2 hours. My financial projections slide is broken and I'm missing the appendix data.",
    type: "urgent",
  },
  {
    label: "🔌 Memory Leak",
    text: "Container memory keeps spiking to 100% and OOM killer is taking it down every 10 minutes. I need a plan to hotfix.",
    type: "technical",
  },
  {
    label: "📊 Data Sci Prep",
    text: "I have a machine learning practical assessment tomorrow morning. I haven't reviewed random forests yet.",
    type: "urgent",
  },
  {
    label: "💳 Pay Utility",
    text: "If I don't pay the electricity bill by 5:00 PM today they will shut off service. I also need to find my account number.",
    type: "structural",
  },
  {
    label: "✈️ Missed Flight",
    text: "My flight is boarding in 45 minutes and I am still stuck in gridlock traffic 20 miles from the airport.",
    type: "urgent",
  },
  {
    label: "🏢 Rent Late",
    text: "I just realized rent is due today and my transfer hasn't cleared. I need to contact my landlord immediately.",
    type: "structural",
  },
  {
    label: "📦 Product Launch",
    text: "We go live on Product Hunt in 3 hours but the landing page hero image is totally broken on mobile viewports.",
    type: "technical",
  },
  {
    label: "🎤 Conference Talk",
    text: "My keynote presentation is tomorrow at noon and I haven't written the speaker notes for the final 10 slides.",
    type: "urgent",
  },
];

type AppStage =
  | "landing"
  | "onboarding_a"
  | "onboarding_b"
  | "onboarding_c"
  | "dashboard";

export default function App() {
  const [stage, setStage] = useState<AppStage>("landing");
  const [rawInput, setRawInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedTask, setParsedTask] = useState<Task | null>(null);

  const { user, authReady, isSigningIn, signIn, signOut, tasks, calendarEnclave, userProfile, saveTask, deleteTask, saveCalendarEvent, deleteCalendarEvent, saveUserProfile } = useFirebase();

  // Sandbox state
  const [sandboxInput, setSandboxInput] = useState("");
  const [isSandboxParsing, setIsSandboxParsing] = useState(false);
  const [sandboxOutput, setSandboxOutput] = useState<{
    priority: number;
    title: string;
    tasks: string[];
  } | null>(null);

  // Mission Modal State
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);

  // Dynamic Scenarios & Calendar Built State
  const [activeScenarios, setActiveScenarios] = useState<
    { label: string; text: string; type?: string }[]
  >([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chaosHistory, setChaosHistory] = useState<{
    id: string;
    timestamp: string;
    rawStream: string;
    parsedTask: string;
    score: number;
  }[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStart, setNewEventStart] = useState("");
  const [newEventEnd, setNewEventEnd] = useState("");

  // For visual simulation of parsing in Stage B
  const [loadingText, setLoadingText] = useState("Initializing Core...");

  // Dashboard state
  const [mounted, setMounted] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<
    "ALL" | "ACTIVE" | "COMPLETED" | "CRITICAL" | "HABIT_MATRIX"
  >("ALL");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [acknowledgedIntervention, setAcknowledgedIntervention] = useState(false);

  // Web Speech API states
  const [isListening, setIsListening] = useState(false);
  const [isSandboxListening, setIsSandboxListening] = useState(false);
  const [speechErrorMsg, setSpeechErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const toggleListening = (target: "sandbox" | "main", currentVal: string) => {
    setSpeechErrorMsg(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechErrorMsg(
        "Voice capture is not supported in this browser. Please use Chrome or Edge.",
      );
      return;
    }

    if (
      (target === "sandbox" && isSandboxListening) ||
      (target === "main" && isListening)
    ) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (target === "sandbox") setIsSandboxListening(false);
      else setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      if (target === "sandbox") setIsSandboxListening(true);
      else setIsListening(true);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setSpeechErrorMsg(
          "Microphone access denied. Please grant permissions.",
        );
      } else if (event.error === "network") {
        setSpeechErrorMsg(
          "Voice service network error. Please use keyboard input.",
        );
      }
      if (target === "sandbox") setIsSandboxListening(false);
      else setIsListening(false);
    };

    recognition.onend = () => {
      if (target === "sandbox") setIsSandboxListening(false);
      else setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let speechToTextResult = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          speechToTextResult += event.results[i][0].transcript;
        }
      }
      if (speechToTextResult) {
        if (target === "sandbox") {
          setSandboxInput((prev) =>
            prev ? `${prev} ${speechToTextResult}` : speechToTextResult,
          );
        } else {
          setRawInput((prev) =>
            prev ? `${prev} ${speechToTextResult}` : speechToTextResult,
          );
        }
      }
    };

    try {
      recognition.start();
    } catch (e) {
      if (target === "sandbox") setIsSandboxListening(false);
      else setIsListening(false);
    }
  };

  const shuffleScenarios = () => {
    setActiveScenarios(
      [...ALL_SCENARIOS].sort(() => 0.5 - Math.random()).slice(0, 3),
    );
  };

  useEffect(() => {
    setMounted(true);
    shuffleScenarios();
  }, []);

  const handleSandboxSimulate = (scenario: { label: string; text: string }) => {
    setRawInput(scenario.text);
    setStage("onboarding_a");
  };

  const handleProcessPanicStream = async (isAppendMode = false) => {
    if (!rawInput.trim()) return;

    if (!isAppendMode) {
      setStage("onboarding_b");
    }
    setIsParsing(true);

    setLoadingText("Gemini Triage Active...");

    try {
      const referenceTime = new Date().toISOString();
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawInput,
          referenceTime,
          calendarConstraints: calendarEnclave.map((c) => ({
            title: c.title,
            start: c.start,
            end: c.end,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API failed: ${errorData.details || response.statusText}`);
      }

      const data = await response.json();

      const newTask: Task = {
        id: generateUUID(),
        user_id: "user-alpha",
        title: data.title?.toUpperCase() || "CRITICAL OBJECTIVE",
        raw_input: rawInput,
        deadline:
          data.deadline ||
          new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: "pending",
        priority_score: Number(data.priority_score) || 94,
        ...(data.collision_warning ? { collision_warning: data.collision_warning } : {}),
        shadow_artifacts: {
          context_summary:
            data.context_summary || "Synthesized from chaos stream.",
          checklist: (data.checklist || []).map((text: string, i: number) => ({
            id: `chk-item-${Date.now()}-${i}`,
            text,
            completed: false,
          })),
          planning_strategy: data.planning_strategy || [
            "Draft outline",
            "Review",
            "Deploy",
          ],
          starter_code: data.starter_code || "// Provide starter material...",
        },
      };

      if (newTask.priority_score >= 85) {
        setLoadingText("PENDING...");
        try {
          await fetch("/api/alerts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskTitle: newTask.title,
              urgencyScore: newTask.priority_score,
              phoneNumber: userProfile?.phoneNumber || "",
              emailAddress: userProfile?.email || "",
              checklist: newTask.shadow_artifacts?.checklist?.map(c => c.text) || []
            }),
          });
          setLoadingText("SENT via [SMS & EMAIL GATEWAYS]");
          const newLog = {
            id: crypto.randomUUID(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            rawStream: rawInput,
            parsedTask: newTask.title,
            score: newTask.priority_score
          };
          setChaosHistory(prev => [newLog, ...prev]);
        } catch (alertErr) {
          console.error("Alert dispatch failed:", alertErr);
        }
      }

      if (isAppendMode) {
        saveTask(newTask);
        setIsParsing(false);
        setIsMissionModalOpen(false);
        setRawInput("");
      } else {
        setParsedTask(newTask);
        setLoadingText("Workspace Synthesized.");
        setTimeout(() => {
          setIsParsing(false);
          setStage("onboarding_c");
        }, 1000);
      }
    } catch (err: any) {
      alert(`Error during Gemini Parse: ${err.message}`);
      setIsParsing(false);
      setLoadingText("Failed.");
      if (!isAppendMode) {
         setStage("onboarding_a");
      }
    }
  };

  const handleEnterDashboard = () => {
    if (parsedTask) {
      if (!tasks.some((t) => t.id === parsedTask.id)) {
        saveTask(parsedTask);
      }
      setParsedTask(null);
    }
    setStage("dashboard");
  };

  const handleToggleStatus = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      saveTask({
        ...task,
        status: (task.status === "completed" ? "pending" : "completed") as TaskStatus
      });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleDeleteCalendarEvent = (eventId: string) => {
    deleteCalendarEvent(eventId);
  };

  const handleToggleChecklist = (taskId: string, checkId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.shadow_artifacts?.checklist) {
      saveTask({
        ...task,
        shadow_artifacts: {
          ...task.shadow_artifacts,
          checklist: task.shadow_artifacts.checklist.map((c) =>
            c.id === checkId ? { ...c, completed: !c.completed } : c,
          ),
        },
      });
    }

    if (parsedTask?.id === taskId && parsedTask.shadow_artifacts?.checklist) {
      setParsedTask({
        ...parsedTask,
        shadow_artifacts: {
          ...parsedTask.shadow_artifacts,
          checklist: parsedTask.shadow_artifacts.checklist.map((c) =>
            c.id === checkId ? { ...c, completed: !c.completed } : c,
          ),
        },
      });
    }
  };

  const openWorkspace = (task: Task) => {
    setParsedTask(task);
    setStage("onboarding_c");
  };

  const handleAddEvent = () => {
    if (!newEventTitle || !newEventStart || !newEventEnd) return;
    const startStr = `${getTodayDateString()}T${newEventStart}:00`;
    const endStr = `${getTodayDateString()}T${newEventEnd}:00`;

    const newCalendarEvent = {
      id: `cal-custom-${Date.now()}`,
      title: newEventTitle,
      start: startStr,
      end: endStr,
      isCalendarBlock: true,
    };

    saveCalendarEvent(newCalendarEvent);
    setNewEventTitle("");
    setNewEventStart("");
    setNewEventEnd("");
    setShowAddEvent(false);
  };

  const handleReset = () => {
    setParsedTask(null);
    shuffleScenarios();
    setStage("landing");
  };

  const handleFlushSystem = () => {
    tasks.forEach(task => deleteTask(task.id));
    setParsedTask(null);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-[100dvh] bg-[var(--color-cyber-black)] text-fg-primary font-sans overflow-x-hidden selection:bg-warning-amber selection:text-cyber-black flex flex-col">
      <AnimatePresence>
        {speechErrorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4"
          >
            <div className="bg-glitch-red/10 border border-glitch-red/50 backdrop-blur-md text-glitch-red px-4 py-3 rounded-lg flex items-start gap-3 shadow-2xl">
              <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-glitch-red animate-pulse flex-shrink-0" />
              <div className="font-mono text-sm leading-snug flex-1">
                {speechErrorMsg}
              </div>
              <button
                onClick={() => setSpeechErrorMsg(null)}
                className="text-glitch-red/50 hover:text-glitch-red transition-colors"
                aria-label="Close error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* STAGE 1: PREMIUM LANDING */}
        {stage === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="flex-1 flex flex-col relative w-full overflow-y-auto"
          >
            {/* Telemetry Ticker Top Bar */}
            <div className="w-full border-b border-panel-border/50 bg-terminal-zinc/80 backdrop-blur-md px-4 py-2 flex justify-between items-center text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-500 sticky top-0 z-50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tactical-emerald animate-ping" />
                SYSTEM STATUS: 100% OPERATIONAL // LATENCY: 14ms
              </div>
              <div className="hidden sm:flex items-center text-zinc-600 gap-4">
                <span>[ COGNITIVE ENGINES: LOCK ]</span>
                <span>[ ACTIVE AGENT LOOPS: ONLINE ]</span>
                {tasks.length > 0 && (
                  <button
                    onClick={() => setStage("dashboard")}
                    className="ml-4 bg-zinc-900 border border-panel-border hover:border-warning-amber/50 hover:text-white px-3 py-1 rounded text-[10px] uppercase font-mono transition-all cursor-pointer"
                  >
                    Open Dashboard
                  </button>
                )}
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-slate-900 to-indigo-950/40 pointer-events-none fixed" />
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none fixed mix-blend-screen" />
            <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-amber-600/10 blur-[120px] rounded-full pointer-events-none fixed mix-blend-screen" />

            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 z-10 flex flex-col items-center">
              {/* Atmos Hero */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center max-w-3xl mx-auto mb-16"
              >
                <div className="inline-flex items-center justify-center p-3 mb-8 rounded-2xl bg-zinc-950 border border-panel-border shadow-[0_0_30px_rgba(255,159,10,0.1)]">
                  <Zap className="h-8 w-8 text-warning-amber drop-shadow-[0_0_10px_rgba(255,159,10,0.8)]" />
                </div>
                <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-wider mb-6 text-[#ffffff] uppercase leading-none">
                  CLUTCH
                </h1>
                <p className="text-base sm:text-xl text-fg-secondary font-mono leading-relaxed mb-10 max-w-2xl mx-auto">
                  Traditional productivity tools tell you that you're failing.
                  Clutch actively intervenes, builds your workspace, and
                  finishes the work before deadlines miss you.
                </p>

                <div className="flex flex-col items-center">
                  {!authReady ? (
                    <span className="text-zinc-500 font-mono">Checking connection...</span>
                  ) : !user ? (
                    <button
                      onClick={signIn}
                      disabled={isSigningIn}
                      className="group relative inline-flex items-center gap-3 bg-[#f4f4f5] text-[#030303] px-10 py-5 rounded-xl font-mono font-bold text-sm tracking-widest uppercase hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {isSigningIn ? "[ Authenticating... ]" : "[ Authenticate Access ]"}
                        {!isSigningIn && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                      </span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setStage("onboarding_a")}
                        className="group relative inline-flex items-center gap-3 bg-[#f4f4f5] text-[#030303] px-10 py-5 rounded-xl font-mono font-bold text-sm tracking-widest uppercase hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_30px_rgba(255,159,10,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]"
                      >
                        <span className="absolute -inset-0.5 bg-gradient-to-r from-warning-amber/0 via-warning-amber/50 to-warning-amber/0 opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse rounded-xl blur-md" />
                        <span className="relative z-10 flex items-center gap-2">
                          [ Initialize Clutch Engine ]
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </button>
                      <span className="mt-3 text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
                        Press ↵ to Boot
                      </span>
                    </>
                  )}

                  {/* Badges */}
                  <div className="flex items-center justify-center gap-4 mt-8 opacity-60">
                    <span className="px-3 py-1 text-[10px] font-mono border border-zinc-800 rounded bg-zinc-900/50">
                      Google Calendar
                    </span>
                    <span className="px-3 py-1 text-[10px] font-mono border border-zinc-800 rounded bg-zinc-900/50">
                      GitHub
                    </span>
                    <span className="px-3 py-1 text-[10px] font-mono border border-zinc-800 rounded bg-zinc-900/50">
                      Twilio
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Sandbox POC */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="w-full max-w-4xl mx-auto mb-32"
              >
                <div className="bg-[#050505] border border-panel-border rounded-2xl overflow-hidden shadow-2xl relative">
                  <div className="bg-terminal-zinc border-b border-panel-border px-4 py-3 flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-zinc-700" />
                      <div className="w-3 h-3 rounded-full bg-zinc-700" />
                      <div className="w-3 h-3 rounded-full bg-zinc-700" />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase ml-2">
                      Live Proof of Concept
                    </span>
                  </div>

                  <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Sandbox */}
                    <div className="flex flex-col">
                      <div className="text-xs font-mono uppercase text-warning-amber font-bold mb-4 flex items-center gap-2">
                        <Terminal className="w-4 h-4" /> Quick Panic Injection
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {activeScenarios.map((scenario, idx) => {
                          let colorClass = "border-panel-border text-zinc-400 bg-zinc-900 hover:bg-zinc-800 hover:text-white";
                          if (scenario.type === "technical") colorClass = "border-cyan-500/30 text-cyan-400 bg-cyan-950/10 hover:bg-cyan-900/40 hover:text-cyan-300";
                          else if (scenario.type === "urgent") colorClass = "border-orange-500/30 text-orange-400 bg-orange-950/10 hover:bg-orange-900/40 hover:text-orange-300";
                          else if (scenario.type === "structural") colorClass = "border-purple-500/30 text-purple-400 bg-purple-950/10 hover:bg-purple-900/40 hover:text-purple-300";
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => handleSandboxSimulate(scenario)}
                              className={`text-[10px] font-mono border px-3 py-1.5 rounded transition-colors cursor-pointer ${colorClass}`}
                            >
                              [ {scenario.label} ]
                            </button>
                          );
                        })}
                      </div>
                      <div className="relative mb-4 group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition duration-500 pointer-events-none" />
                        <textarea
                          value={sandboxInput}
                          onChange={(e) => setSandboxInput(e.target.value)}
                          placeholder="Select a tag above or use voice capture..."
                          className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-300 resize-none h-32 focus:outline-none relative z-10 focus:border-transparent"
                        />
                        <div
                          onClick={() =>
                            toggleListening("sandbox", sandboxInput)
                          }
                          className={`absolute bottom-3 right-3 p-2 rounded-full border cursor-pointer transition-colors z-20 ${
                            isSandboxListening
                              ? "bg-warning-amber/20 border-warning-amber text-warning-amber animate-pulse shadow-[0_0_15px_rgba(255,159,10,0.4)]"
                              : "bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:bg-zinc-800 hover:text-warning-amber"
                          }`}
                        >
                          <Mic className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      {isSandboxParsing && (
                        <div className="flex items-center gap-2 text-warning-amber font-mono text-xs uppercase animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin" /> Engine
                          Parsing...
                        </div>
                      )}
                    </div>

                    {/* Right Sandbox Output */}
                    <div className="flex flex-col border border-zinc-800 rounded-xl bg-[#09090b] p-6 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-glitch-red/0 via-glitch-red/50 to-glitch-red/0 opacity-50" />

                      {!sandboxOutput && !isSandboxParsing && (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-3 opacity-50">
                          <LayoutDashboard className="w-8 h-8" />
                          <span className="text-xs font-mono uppercase tracking-widest text-center">
                            Output Structural Preview
                            <br />
                            Awaiting Input
                          </span>
                        </div>
                      )}

                      {isSandboxParsing && !sandboxOutput && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                          <div className="w-16 h-16 rounded-full border-2 border-dashed border-warning-amber/50 animate-[spin_3s_linear_infinite]" />
                        </div>
                      )}

                      {sandboxOutput && !isSandboxParsing && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex-1 flex flex-col"
                        >
                          <div className="flex justify-between items-start mb-4 border-b border-zinc-800 pb-3">
                            <span className="text-xs font-mono font-bold text-glitch-red bg-glitch-red/10 px-2 py-1 rounded">
                              TRIAGE {sandboxOutput.priority}%
                            </span>
                            <span className="text-xs font-mono text-tactical-emerald">
                              ACTIVE
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-4 uppercase">
                            {sandboxOutput.title}
                          </h4>
                          <div className="space-y-2">
                            {sandboxOutput.tasks.map((t, i) => (
                              <div
                                key={i}
                                className="text-xs font-mono text-zinc-400 flex gap-2"
                              >
                                <span className="text-zinc-600">0{i + 1}.</span>{" "}
                                {t}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Bento Box Feature Matrix */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-24"
              >
                {/* Card A: Cognitive Capture */}
                <div className="col-span-1 md:col-span-1 border border-panel-border rounded-2xl bg-terminal-zinc/50 overflow-hidden group flex flex-col">
                  <div className="h-48 relative overflow-hidden bg-cyber-black p-6 flex flex-col justify-between border-b border-panel-border/50">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80')] bg-cover bg-center grayscale mix-blend-luminosity group-hover:scale-105 transition-transform duration-700" />
                    <div className="relative z-10 flex justify-between">
                      <Mic className="text-white w-5 h-5 opacity-70" />
                      <span className="text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-700 px-2 py-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />{" "}
                        REC
                      </span>
                    </div>
                    {/* Simulated Waveform */}
                    <div className="relative z-10 flex gap-1 h-12 items-end justify-center opacity-80">
                      {[40, 70, 30, 90, 50, 100, 60, 40, 80, 20].map((h, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 bg-white rounded-t"
                          animate={{
                            height: [
                              `${Math.random() * 100}%`,
                              `${Math.random() * 100}%`,
                              `${Math.random() * 100}%`,
                            ],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1 + Math.random(),
                            ease: "linear",
                          }}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-6 flex-1 bg-terminal-zinc/80">
                    <h3 className="text-lg font-bold text-white mb-2">
                      Cognitive Capture
                    </h3>
                    <p className="text-sm font-mono text-zinc-400 leading-relaxed">
                      Instantly process messy voice notes or chaotic thoughts
                      into structured, executable mission parameters.
                    </p>
                  </div>
                </div>

                {/* Card B: Escalation Loop */}
                <div className="col-span-1 md:col-span-1 border border-panel-border rounded-2xl bg-terminal-zinc/50 overflow-hidden group flex flex-col">
                  <div className="h-48 bg-[#0a0a0c] p-6 relative overflow-hidden border-b border-panel-border/50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#101014] to-cyber-black" />
                    <Smartphone className="absolute top-4 right-4 text-zinc-600 w-5 h-5" />

                    {/* Notification UI */}
                    <div className="w-full max-w-[200px] border border-zinc-800 bg-zinc-950 rounded-xl p-3 shadow-2xl relative z-10 translate-y-4 group-hover:-translate-y-2 transition-transform duration-500">
                      <div className="flex gap-2 items-center mb-2">
                        <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          SMS
                        </span>
                      </div>
                      <div className="text-xs text-white font-bold">
                        Priority Escalation
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-tight">
                        Clutch Bot: You missed your 2PM deep work block.
                        Escalating to automated phone call via Twilio now.
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex-1 bg-terminal-zinc/80">
                    <h3 className="text-lg font-bold text-white mb-2">
                      The Escalation Loop
                    </h3>
                    <p className="text-sm font-mono text-zinc-400 leading-relaxed">
                      Anti-ignorance framework. If you ignore notifications,
                      Clutch escalates to loud SMS and automated phone calls.
                    </p>
                  </div>
                </div>

                {/* Card C: Shadow Workspace */}
                <div className="col-span-1 md:col-span-1 border border-panel-border rounded-2xl bg-terminal-zinc/50 overflow-hidden group flex flex-col">
                  <div className="h-48 bg-cyber-black flex border-b border-panel-border/50 overflow-hidden relative">
                    {/* Fake Editor */}
                    <div className="w-1/3 border-r border-zinc-800 bg-[#060608] p-4 flex flex-col gap-2">
                      <div className="w-full h-2 bg-zinc-800 rounded" />
                      <div className="w-3/4 h-2 bg-zinc-800 rounded" />
                      <div className="w-5/6 h-2 bg-zinc-800 rounded" />
                      <div className="w-full h-2 bg-zinc-800 rounded mt-4" />
                      <div className="w-1/2 h-2 bg-zinc-800 rounded" />
                    </div>
                    <div className="flex-1 bg-[#09090b] p-4 font-mono text-[8px] sm:text-[10px] text-zinc-500 leading-tight">
                      <div className="text-zinc-600 mb-2">
                        // GenAI preparing draft
                      </div>
                      <div className="text-zinc-400">
                        export const handler = async () ={">"} {"{"}
                      </div>
                      <div className="pl-2">const auth = execute();</div>
                      <div className="pl-2">return triage();</div>
                      <div className="text-zinc-400">{"}"}</div>
                      <motion.div
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="w-1.5 h-3 bg-warning-amber mt-1"
                      />
                    </div>
                  </div>
                  <div className="p-6 flex-1 bg-terminal-zinc/80">
                    <h3 className="text-lg font-bold text-white mb-2">
                      Shadow Workspace
                    </h3>
                    <p className="text-sm font-mono text-zinc-400 leading-relaxed">
                      Eliminates cold-starts. Clutch opens an embedded IDE and
                      pre-writes the first 20% of the code or document.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* STAGE 2A: CHAOS INPUT */}
        {stage === "onboarding_a" && (
          <motion.div
            key="onboarding_a"
            initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex items-center justify-center p-4 sm:p-6"
          >
            <div className="w-full max-w-xl mx-auto rounded-2xl border border-panel-border bg-terminal-zinc/80 backdrop-blur-xl p-6 sm:p-10 shadow-2xl">
              <div className="mb-8 border-b border-panel-border/50 pb-5">
                <h2 className="text-sm font-mono font-bold text-warning-amber uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  INITIATE CHAOS STREAM
                </h2>
                <p className="text-xs sm:text-sm text-fg-secondary font-mono mt-3 leading-relaxed">
                  Dump your raw, unedited panic here. What is the deadline? What
                  needs to happen? Who is waiting?
                </p>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {activeScenarios.map((scenario, idx) => {
                    let colorClass = "border-panel-border text-zinc-400 bg-zinc-900 hover:bg-zinc-800 hover:text-white";
                    if (scenario.type === "technical") colorClass = "border-cyan-500/30 text-cyan-400 bg-cyan-950/10 hover:bg-cyan-900/40 hover:text-cyan-300";
                    else if (scenario.type === "urgent") colorClass = "border-orange-500/30 text-orange-400 bg-orange-950/10 hover:bg-orange-900/40 hover:text-orange-300";
                    else if (scenario.type === "structural") colorClass = "border-purple-500/30 text-purple-400 bg-purple-950/10 hover:bg-purple-900/40 hover:text-purple-300";
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setRawInput(scenario.text)}
                        className={`text-[10px] font-mono border px-3 py-1.5 rounded transition-colors cursor-pointer ${colorClass}`}
                      >
                        [ {scenario.label} ]
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative mb-8 group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500 rounded-xl blur opacity-0 group-focus-within:opacity-50 transition duration-500 pointer-events-none" />
                <textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="e.g. Executive design review is in 3 hours. I don't have the slide deck ready and the mockups are completely broken..."
                  className="relative z-10 w-full h-48 bg-cyber-black border border-panel-border rounded-xl p-5 font-mono text-sm sm:text-base text-fg-primary placeholder:text-zinc-700/80 focus:border-transparent outline-none resize-none transition-colors leading-relaxed"
                  autoFocus
                />
                <button
                  onClick={() => toggleListening("main", rawInput)}
                  className={`absolute bottom-4 right-4 p-3 rounded-full border transition-colors cursor-pointer z-20 ${
                    isListening
                      ? "bg-warning-amber/20 border-warning-amber text-warning-amber animate-pulse shadow-[0_0_15px_rgba(255,159,10,0.4)]"
                      : "bg-zinc-900 border-panel-border text-zinc-400 hover:text-warning-amber"
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  disabled={!rawInput.trim() || isParsing}
                  onClick={() => handleProcessPanicStream(false)}
                  className="w-full bg-warning-amber text-[#030303] font-bold font-mono uppercase tracking-widest py-4 rounded-xl hover:bg-[#ffaa22] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,159,10,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]"
                >
                  {isParsing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Process Panic Stream"
                  )}
                  {!isParsing && <ChevronRight className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setStage("dashboard")}
                  className="w-full bg-transparent text-zinc-500 font-mono uppercase tracking-widest py-3 rounded-xl hover:text-zinc-300 transition-colors cursor-pointer text-xs"
                >
                  [ Skip to Dashboard ]
                </button>
              </div>

              {/* Landing Page Telemetry HUD */}
              <div className="mt-8 flex flex-col flex-1 min-h-[200px] max-h-[300px] overflow-hidden bg-zinc-900/40 rounded-xl border border-zinc-800">
                <div className="p-3 border-b border-zinc-800 bg-black/40 shrink-0">
                  <h3 className="text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-2">
                    <span className="text-warning-amber">🛰️</span> Critical Intervention Telemetry
                  </h3>
                </div>
                <div className="p-3 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden space-y-3">
                  {chaosHistory.length === 0 ? (
                    <div className="text-center py-6 px-2">
                      <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">
                        SYSTEM COGNITIVE LOAD: STABLE //<br/>NO INTERVENTIONS RECORDED
                      </p>
                    </div>
                  ) : (
                    chaosHistory.map((log) => (
                      <div key={log.id} className="p-3 rounded-lg bg-black/60 border border-zinc-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-zinc-500">{log.timestamp}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${log.score >= 90 ? 'bg-glitch-red/20 text-glitch-red' : log.score >= 85 ? 'bg-warning-amber/20 text-warning-amber' : 'bg-zinc-800 text-zinc-400'}`}>
                            LVL {log.score}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 font-medium truncate" title={log.parsedTask}>
                          {log.parsedTask}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STAGE 2B: GEMINI TRIAGE LOADING */}
        {stage === "onboarding_b" && (
          <motion.div
            key="onboarding_b"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6"
          >
            <Loader2 className="h-12 w-12 text-warning-amber animate-spin mb-8 drop-shadow-[0_0_10px_rgba(255,159,10,0.5)]" />
            <div className="text-sm font-mono tracking-widest uppercase text-warning-amber animate-pulse">
              {loadingText}
            </div>

            {!isParsing && parsedTask && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="mt-12 p-8 rounded-2xl border border-glitch-red/40 bg-glitch-red/5 max-w-sm w-full text-center relative overflow-hidden backdrop-blur-md"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-glitch-red/5 to-transparent pointer-events-none" />
                <div className="text-7xl font-mono font-black text-glitch-red mb-3 drop-shadow-[0_0_15px_rgba(255,59,48,0.4)]">
                  {parsedTask.priority_score}
                  <span className="text-3xl text-glitch-red/50">/100</span>
                </div>
                <div className="text-[10px] sm:text-xs font-mono uppercase text-[#f4f4f5] tracking-widest mb-8 border-b border-glitch-red/20 pb-6">
                  Calculated Triage Priority
                </div>

                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-mono">
                  Time Remaining
                </div>
                <div className="text-xl font-mono text-warning-amber font-bold flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4" /> DEADLINE LOCKED
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* STAGE 2C: THE SHADOW WORKSPACE */}
        {stage === "onboarding_c" && parsedTask && (
          <motion.div
            key="onboarding_c"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="flex-1 p-4 sm:p-6 flex flex-col max-w-7xl mx-auto w-full"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-5 border-b border-panel-border gap-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00ffd2] shadow-[0_0_10px_rgba(0,255,210,0.8)] animate-pulse" />
                <h2 className="text-sm sm:text-base font-mono font-black uppercase text-[#f4f4f5] tracking-widest">
                  SHADOW WORKSPACE PREPARED
                </h2>
              </div>
              <button
                onClick={handleEnterDashboard}
                className="bg-[#ffffff] text-cyber-black text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-zinc-200 transition-colors cursor-pointer shadow-md"
              >
                {tasks.some((t) => t.id === parsedTask.id)
                  ? "Return to Dashboard"
                  : "Deploy Dashboard"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Split View */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
              {/* Left: Deconstructed Steps */}
              <div className="bg-terminal-zinc/80 backdrop-blur-md border border-panel-border rounded-xl p-6 sm:p-8 flex flex-col h-full overflow-hidden shadow-xl">
                <div className="uppercase text-[10px] font-mono tracking-widest text-warning-amber mb-5 flex items-center gap-2 font-bold">
                  <LayoutDashboard className="h-4 w-4" />
                  Tactical Breakdown
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-[#f4f4f5] leading-tight w-full break-words">
                  {parsedTask.title}
                </h3>
                <p className="text-sm font-mono text-fg-secondary mb-8 pb-6 border-b border-panel-border/50 leading-relaxed">
                  {parsedTask.shadow_artifacts?.context_summary}
                </p>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 [&::-webkit-scrollbar]:hidden">
                  {parsedTask.shadow_artifacts?.checklist?.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        handleToggleChecklist(parsedTask.id, item.id)
                      }
                      className={`p-4 border rounded-xl flex gap-4 items-start shadow-inner cursor-pointer transition-all hover:scale-[1.01] ${
                        item.completed
                          ? "bg-tactical-emerald/5 border-tactical-emerald/30"
                          : "bg-cyber-black border-panel-border hover:border-zinc-700"
                      }`}
                    >
                      <button
                        className={`mt-0.5 shrink-0 ${item.completed ? "text-tactical-emerald border-tactical-emerald shadow-[0_0_10px_rgba(0,255,100,0.2)]" : "text-zinc-600 hover:text-zinc-400"}`}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                      <div
                        className={`text-sm font-mono leading-relaxed transition-all ${item.completed ? "text-zinc-500 line-through" : "text-[#e4e4e7]"}`}
                      >
                        {item.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: AI Starter Work (Code/Draft) */}
              <div className="bg-[#020202] border border-panel-border rounded-xl flex flex-col h-full overflow-hidden shadow-2xl">
                <div className="bg-zinc-900 border-b border-panel-border px-5 py-3.5 flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-zinc-500" />
                  <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                    Clutch Draft Buffer
                  </span>
                </div>
                <div className="flex-1 p-6 overflow-auto font-mono text-xs sm:text-sm leading-relaxed text-[#a1a1aa] whitespace-pre-wrap">
                  <span className="text-warning-amber/90 font-bold">
                    {"// AI INITIATED DRAFT FRAMEWORK\n"}
                  </span>
                  <span className="text-zinc-600">
                    {
                      "// Extracted from chaos stream input to bypass cold-start hesitation.\n\n"
                    }
                  </span>
                  {parsedTask?.shadow_artifacts?.starter_code?.replace(/\\n/g, '\n').replace(/\\t/g, '\t') ||
                    "INITIATING DRAFT STREAM..."}
                  {"\n"}
                  <span className="animate-pulse text-[#00ffd2]">_</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STAGE 3: DASHBOARD */}
        {stage === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex-1 w-full bg-cyber-black p-4 sm:p-6 lg:p-12 overflow-y-auto transition-all duration-300 ${tasks.some((t) => t.status !== "completed" && t.priority_score >= 85) && !acknowledgedIntervention ? "pt-32 sm:pt-36 lg:pt-32" : ""}`}
          >
            <AnimatePresence>
              {tasks.some((t) => t.status !== "completed" && t.priority_score >= 85) && !acknowledgedIntervention && (
                <motion.div
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -100, opacity: 0 }}
                  className="fixed top-0 left-0 right-0 z-50 bg-glitch-red border-b border-glitch-red shadow-[0_0_20px_rgba(255,59,48,0.3)] backdrop-blur-md overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                  <div className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-4 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4 text-white">
                      <div className="shrink-0 p-2 bg-white/20 rounded-full animate-pulse">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      </div>
                      <div className="font-mono text-xs sm:text-sm tracking-widest leading-relaxed">
                        <p className="font-bold mb-1 uppercase text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                          [ 🚨 CRITICAL INTERVENTION ACTIVE ]: User has ignored the active mission threshold.
                        </p>
                        <p className="text-white/80">
                          Anti-paralysis matrix engaged. Dispatched automated warning text and voice bypass call to verified device loop.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAcknowledgedIntervention(true);
                        setDashboardTab("CRITICAL");
                        // Delay slightly to let React render the CRITICAL tab
                        setTimeout(() => {
                          const highestTask = tasks
                            .filter(t => t.status !== "completed" && t.priority_score >= 85)
                            .sort((a, b) => b.priority_score - a.priority_score)[0];
                          if (highestTask) {
                            const element = document.getElementById(`task-${highestTask.id}`);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              element.classList.add('animate-pulse', 'ring-2', 'ring-glitch-red', 'ring-offset-4', 'ring-offset-cyber-black');
                              setTimeout(() => {
                                element.classList.remove('animate-pulse', 'ring-2', 'ring-glitch-red', 'ring-offset-4', 'ring-offset-cyber-black');
                              }, 3000);
                            }
                          }
                        }, 100);
                      }}
                      className="shrink-0 bg-white text-glitch-red hover:bg-zinc-100 px-6 py-3 rounded-lg font-mono font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      [ ACKNOWLEDGE INTERVENTION ]
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="max-w-screen-2xl mx-auto w-full flex flex-col lg:flex-row gap-4 sm:gap-6">
              {/* Sidebar Toggle (Mobile / Floating) */}
              <div className="lg:hidden flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 bg-terminal-zinc border border-panel-border rounded-lg text-fg-primary hover:bg-zinc-800 transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                  </button>
                  <h1 className="text-2xl font-black uppercase tracking-widest text-[#f4f4f5] flex items-center gap-2">
                    CLUTCH
                    <span className="h-2 w-2 rounded-full bg-tactical-emerald animate-pulse" />
                  </h1>
                </div>
                <button
                  onClick={() => {
                    setRawInput("");
                    setIsMissionModalOpen(true);
                  }}
                  className="bg-terminal-zinc/80 backdrop-blur-md border border-panel-border text-fg-primary text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:border-warning-amber/50 hover:bg-zinc-900 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 shadow-sm hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]"
                >
                  <Plus className="h-4 w-4 text-warning-amber" /> Mission
                </button>
              </div>

              {/* Sidebar */}
              <AnimatePresence initial={false}>
                {isSidebarOpen && (
                  <motion.aside
                    initial={{ width: 0, opacity: 0, scale: 0.95 }}
                    animate={{ width: "auto", opacity: 1, scale: 1 }}
                    exit={{ width: 0, opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="w-full lg:w-72 shrink-0 flex flex-col gap-2 bg-terminal-zinc/50 border border-panel-border rounded-2xl p-4 sm:p-6 overflow-hidden"
                  >
                    <div className="mb-8 hidden lg:flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-black uppercase tracking-widest text-[#f4f4f5] flex items-center gap-3">
                          CLUTCH
                          <span className="h-2 w-2 rounded-full bg-tactical-emerald animate-pulse" />
                        </h1>
                        <p className="text-[10px] sm:text-xs font-mono text-zinc-500 tracking-widest uppercase mt-1">
                          Mission Control
                        </p>
                      </div>
                      <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setRawInput("");
                        setIsMissionModalOpen(true);
                      }}
                      className="hidden lg:flex w-full bg-cyber-black border border-panel-border text-fg-primary text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest px-5 py-3 rounded-xl hover:border-warning-amber/50 hover:bg-zinc-900 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer items-center justify-center gap-2 shadow-sm mb-6 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]"
                    >
                      <Plus className="h-4 w-4 text-warning-amber" /> Insert New
                      Mission
                    </button>

                    <nav className="flex lg:flex-col gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest w-full overflow-x-auto pb-2 lg:pb-0 [&::-webkit-scrollbar]:hidden">
                  <button
                    onClick={() => setDashboardTab("ALL")}
                    className={`shrink-0 text-left px-4 py-3 rounded-lg border cursor-pointer transition-colors ${dashboardTab === "ALL" ? "bg-zinc-800 border-zinc-700 text-[#f4f4f5]" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"}`}
                  >
                    All Missions
                  </button>
                  <button
                    onClick={() => setDashboardTab("ACTIVE")}
                    className={`shrink-0 text-left px-4 py-3 rounded-lg border cursor-pointer transition-colors ${dashboardTab === "ACTIVE" ? "bg-warning-amber/10 border-warning-amber/50 text-warning-amber" : "border-transparent text-zinc-500 hover:text-warning-amber hover:bg-zinc-900/50"}`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setDashboardTab("CRITICAL")}
                    className={`shrink-0 text-left px-4 py-3 rounded-lg border cursor-pointer transition-colors ${dashboardTab === "CRITICAL" ? "bg-glitch-red/10 border-glitch-red/50 text-glitch-red" : "border-transparent text-zinc-500 hover:text-glitch-red hover:bg-zinc-900/50"}`}
                  >
                    Critical
                  </button>
                  <button
                    onClick={() => setDashboardTab("COMPLETED")}
                    className={`shrink-0 text-left px-4 py-3 rounded-lg border cursor-pointer transition-colors ${dashboardTab === "COMPLETED" ? "bg-tactical-emerald/10 border-tactical-emerald/50 text-tactical-emerald" : "border-transparent text-zinc-500 hover:text-tactical-emerald hover:bg-zinc-900/50"}`}
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => setDashboardTab("HABIT_MATRIX")}
                    className={`shrink-0 text-left px-4 py-3 rounded-lg border cursor-pointer transition-colors ${dashboardTab === "HABIT_MATRIX" ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "border-transparent text-zinc-500 hover:text-emerald-400 hover:bg-zinc-900/50"}`}
                  >
                    Habit Matrix
                  </button>
                  {user && (
                    <>
                      <button
                        onClick={() => setShowSettings(true)}
                        className="shrink-0 lg:hidden text-left px-4 py-3 rounded-lg border border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900/50 transition-colors cursor-pointer"
                      >
                        Alert Settings
                      </button>
                      <button
                        onClick={() => setStage("landing")}
                        className="shrink-0 lg:hidden text-left px-4 py-3 rounded-lg border border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900/50 transition-colors cursor-pointer"
                      >
                        Home
                      </button>
                      <button
                        onClick={async () => {
                          await signOut();
                          handleReset();
                        }}
                        className="shrink-0 lg:hidden text-left px-4 py-3 rounded-lg border border-transparent text-zinc-500 hover:text-glitch-red hover:bg-zinc-900/50 transition-colors cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </>
                  )}
                </nav>

                {user && (
                  <div className="mt-8 hidden lg:block space-y-2">
                    <button
                      onClick={() => setShowSettings(true)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900/50 transition-colors font-mono text-[10px] sm:text-xs tracking-widest uppercase cursor-pointer"
                    >
                      Alert Settings
                    </button>
                    <button
                      onClick={() => setStage("landing")}
                      className="w-full text-left px-4 py-3 rounded-lg border border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900/50 transition-colors font-mono text-[10px] sm:text-xs tracking-widest uppercase cursor-pointer"
                    >
                      Home
                    </button>
                    <button
                      onClick={async () => {
                        await signOut();
                        handleReset();
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg border border-transparent text-zinc-500 hover:text-glitch-red hover:bg-zinc-900/50 transition-colors font-mono text-[10px] sm:text-xs tracking-widest uppercase cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
                
                {/* 🛰️ CRITICAL INTERVENTION TELEMETRY */}
                <div className="mt-8 hidden lg:flex flex-col flex-1 min-h-0 overflow-hidden bg-zinc-900/40 rounded-xl border border-zinc-800">
                  <div className="p-3 border-b border-zinc-800 bg-black/40 shrink-0">
                    <h3 className="text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-2">
                      <span className="text-warning-amber">🛰️</span> Critical Intervention Telemetry
                    </h3>
                  </div>
                  <div className="p-3 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden space-y-3">
                    {chaosHistory.length === 0 ? (
                      <div className="text-center py-6 px-2">
                        <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">
                          SYSTEM COGNITIVE LOAD: STABLE //<br/>NO INTERVENTIONS RECORDED
                        </p>
                      </div>
                    ) : (
                      chaosHistory.map((log) => (
                        <div key={log.id} className="p-3 rounded-lg bg-black/60 border border-zinc-800 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-zinc-500">{log.timestamp}</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${log.score >= 90 ? 'bg-glitch-red/20 text-glitch-red' : log.score >= 85 ? 'bg-warning-amber/20 text-warning-amber' : 'bg-zinc-800 text-zinc-400'}`}>
                              LVL {log.score}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 font-medium truncate" title={log.parsedTask}>
                            {log.parsedTask}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.aside>
                )}
              </AnimatePresence>

              {/* Main Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-6">
                {dashboardTab === "HABIT_MATRIX" ? (
                  <HabitTelemetry userProfile={userProfile} saveUserProfile={saveUserProfile} />
                ) : (
                  <>
                    {/* Desktop Toggle Button when sidebar is closed */}
                    <AnimatePresence>
                      {!isSidebarOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="hidden lg:flex mb-6"
                        >
                          <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-3 bg-terminal-zinc border border-panel-border rounded-xl text-fg-primary hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-center shadow-sm"
                            title="Open Mission Control"
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                {(() => {
                  const filteredTasks = tasks.filter((task) => {
                    if (dashboardTab === "ALL") return true;
                    if (dashboardTab === "ACTIVE")
                      return task.status !== "completed";
                    if (dashboardTab === "CRITICAL")
                      return (
                        task.status !== "completed" && task.priority_score >= 80
                      );
                    if (dashboardTab === "COMPLETED")
                      return task.status === "completed";
                    return true;
                  });

                  // Sort logic
                  const sortedTasks = [...filteredTasks].sort((a, b) => {
                    if (dashboardTab === "COMPLETED") {
                      return (
                        new Date(b.deadline).getTime() -
                        new Date(a.deadline).getTime()
                      );
                    }
                    return b.priority_score - a.priority_score;
                  });

                  if (sortedTasks.length === 0) {
                    return (
                      <div className="relative border border-panel-border/30 rounded-2xl p-16 text-center bg-zinc-900/40 mt-4 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-tactical-emerald/5 to-transparent pointer-events-none" />
                        
                        <div className="relative z-10 flex flex-col items-center justify-center">
                          <div className="relative mb-8">
                            <div className="absolute inset-0 bg-tactical-emerald/20 blur-xl rounded-full" />
                            <div className="w-20 h-20 rounded-full border border-tactical-emerald/30 flex items-center justify-center relative shadow-[0_0_30px_rgba(52,211,153,0.15)]">
                              <div className="absolute inset-0 rounded-full border-t-2 border-tactical-emerald/50 animate-[spin_3s_linear_infinite]" />
                              <div className="absolute inset-2 rounded-full border-b-2 border-tactical-emerald/30 animate-[spin_4s_linear_infinite_reverse]" />
                              <div className="w-8 h-8 rounded-full bg-tactical-emerald/20 flex items-center justify-center backdrop-blur-sm animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-tactical-emerald shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-tactical-emerald/10 border border-tactical-emerald/20 text-tactical-emerald font-mono text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                            [ 🟢 ALL COGNITIVE MATRICES CLEAR // STANDBY FOR PANIC INGESTION ]
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const hasHero =
                    dashboardTab !== "COMPLETED" && sortedTasks.length > 0;
                  const heroTask = hasHero ? sortedTasks[0] : null;
                  let regularTasks = hasHero
                    ? sortedTasks.slice(1)
                    : sortedTasks;

                  // Dynamic Timeline Injection
                  let timelineItems: Array<
                    | { type: "task"; data: Task; time: number }
                    | { type: "calendar"; data: any; time: number }
                  > = [];

                  if (dashboardTab !== "COMPLETED") {
                    const taskItems = regularTasks.map((t) => ({
                      type: "task" as const,
                      data: t,
                      time: new Date(t.deadline).getTime(),
                    }));
                    const calItems = calendarEnclave.map((c) => ({
                      type: "calendar" as const,
                      data: c,
                      time: new Date(c.start).getTime(),
                    }));
                    timelineItems = [...taskItems, ...calItems].sort(
                      (a, b) => a.time - b.time,
                    );
                  } else {
                    timelineItems = regularTasks.map((t) => ({
                      type: "task" as const,
                      data: t,
                      time: new Date(t.deadline).getTime(),
                    }));
                  }

                  return (
                    <>
                      {/* Glowing Hero Mission */}
                      {hasHero && heroTask && (
                        <section className="mb-10 lg:mb-16 mt-2">
                          <div className="flex items-center gap-2 mb-5 font-mono text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest font-bold">
                            <Zap className="h-4 w-4 text-warning-amber" /> Prime
                            directive
                          </div>
                          <div id={`task-${heroTask.id}`} className="transition-all duration-500 rounded-[2.5rem]">
                            <ActiveTaskCard
                              task={heroTask}
                              isHero={true}
                              onToggleStatus={handleToggleStatus}
                              onOpenWorkspace={() => openWorkspace(heroTask)}
                              onDeleteTask={handleDeleteTask}
                            />
                          </div>
                        </section>
                      )}

                      {/* Vertical Chronological Stack */}
                      <section className="pb-10 mt-2">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest font-bold">
                            <Calendar className="h-4 w-4 text-zinc-400" />{" "}
                            {dashboardTab === "COMPLETED"
                              ? "Completed Log"
                              : "Tactical Queue"}
                          </div>
                          {dashboardTab !== "COMPLETED" && (
                            <button
                              onClick={() => setShowAddEvent(!showAddEvent)}
                              className="text-[10px] font-mono border border-zinc-700 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer text-zinc-300"
                            >
                              [ + Add Custom Schedule Lockout ]
                            </button>
                          )}
                        </div>

                        {showAddEvent && dashboardTab !== "COMPLETED" && (
                          <div className="mb-6 p-4 border border-zinc-800 bg-zinc-900/50 rounded-xl flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1 w-full flex flex-col gap-1">
                              <label className="text-[10px] font-mono text-zinc-500 uppercase">
                                Event Title
                              </label>
                              <input
                                type="text"
                                value={newEventTitle}
                                onChange={(e) =>
                                  setNewEventTitle(e.target.value)
                                }
                                placeholder="e.g. Math Exam"
                                className="w-full bg-black/50 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1 w-full sm:w-auto">
                              <label className="text-[10px] font-mono text-zinc-500 uppercase">
                                Start Time
                              </label>
                              <input
                                type="time"
                                value={newEventStart}
                                onChange={(e) =>
                                  setNewEventStart(e.target.value)
                                }
                                className="bg-black/50 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 [color-scheme:dark]"
                              />
                            </div>
                            <div className="flex flex-col gap-1 w-full sm:w-auto">
                              <label className="text-[10px] font-mono text-zinc-500 uppercase">
                                End Time
                              </label>
                              <input
                                type="time"
                                value={newEventEnd}
                                onChange={(e) => setNewEventEnd(e.target.value)}
                                className="bg-black/50 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 [color-scheme:dark]"
                              />
                            </div>
                            <button
                              onClick={handleAddEvent}
                              disabled={
                                !newEventTitle || !newEventStart || !newEventEnd
                              }
                              className="w-full sm:w-auto px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium text-sm rounded transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        )}

                        {timelineItems.length > 0 && (
                          <div className="space-y-5">
                            {timelineItems.map((item) => (
                              <React.Fragment
                                key={
                                  item.type === "task"
                                    ? item.data.id
                                    : item.data.id
                                }
                              >
                                {item.type === "calendar" ? (
                                  <div className="flex items-center justify-between gap-3 border border-indigo-500/20 bg-indigo-500/5 rounded-xl px-4 py-3 shadow-sm group">
                                    <div className="flex items-center gap-3">
                                      <Calendar className="w-4 h-4 text-indigo-400" />
                                      <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold">
                                          SYSTEM CALENDAR ENCLAVE
                                        </span>
                                        <span className="text-xs text-zinc-300 font-medium">
                                          {item.data.title} (
                                          {new Date(
                                            item.data.start,
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}{" "}
                                          -{" "}
                                          {new Date(
                                            item.data.end,
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                          )
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteCalendarEvent(item.data.id)}
                                      className="p-2 text-zinc-500 hover:text-glitch-red hover:bg-glitch-red/10 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                      title="Delete Calendar Event"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div id={`task-${item.data.id}`} className="transition-all duration-500 rounded-2xl">
                                    <ActiveTaskCard
                                      task={item.data}
                                      onToggleStatus={handleToggleStatus}
                                      onOpenWorkspace={() =>
                                        openWorkspace(item.data)
                                      }
                                      onDeleteTask={handleDeleteTask}
                                    />
                                  </div>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </section>
                    </>
                  );
                })()}
                  </>
                )}
              </div>
            </div>

            {/* Demo State Controller Reset */}
            <div className="fixed bottom-4 right-4 z-50">
              <button
                onClick={handleFlushSystem}
                className="text-[10px] text-zinc-600 hover:text-glitch-red transition-colors font-mono uppercase tracking-widest cursor-pointer"
              >
                [ Flush System Cloud Cache ]
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMissionModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-cyber-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-[#030303] border border-warning-amber/40 shadow-[0_0_40px_rgba(255,159,10,0.15)] rounded-2xl overflow-hidden p-6 relative"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-warning-amber/5 via-transparent to-transparent pointer-events-none" />

              <div className="flex justify-between items-center mb-6 relative z-10">
                <h2 className="text-sm font-mono font-bold text-warning-amber uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="h-4 w-4" /> AWAITING NEW CRISIS STREAM...
                </h2>
                <button
                  onClick={() => setIsMissionModalOpen(false)}
                  className="text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {activeScenarios.map((scenario, idx) => {
                    let colorClass = "border-panel-border text-zinc-400 bg-zinc-900 hover:bg-zinc-800 hover:text-white";
                    if (scenario.type === "technical") colorClass = "border-cyan-500/30 text-cyan-400 bg-cyan-950/10 hover:bg-cyan-900/40 hover:text-cyan-300";
                    else if (scenario.type === "urgent") colorClass = "border-orange-500/30 text-orange-400 bg-orange-950/10 hover:bg-orange-900/40 hover:text-orange-300";
                    else if (scenario.type === "structural") colorClass = "border-purple-500/30 text-purple-400 bg-purple-950/10 hover:bg-purple-900/40 hover:text-purple-300";
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setRawInput(scenario.text)}
                        className={`text-[10px] font-mono border px-3 py-1.5 rounded transition-colors cursor-pointer ${colorClass}`}
                      >
                        [ {scenario.label} ]
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative mb-6 z-10 group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500 rounded-xl blur opacity-0 group-focus-within:opacity-50 transition duration-500 pointer-events-none" />
                <textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="e.g. The investor deck is missing and my flight boards in 2 hours..."
                  className="relative z-10 w-full h-40 bg-zinc-950/50 border border-warning-amber/30 rounded-xl p-5 font-mono text-sm sm:text-base text-fg-primary placeholder:text-zinc-700/80 focus:border-transparent outline-none resize-none transition-colors leading-relaxed shadow-inner"
                  autoFocus
                />
                <button
                  onClick={() => toggleListening("main", rawInput)}
                  className={`absolute bottom-4 right-4 p-3 rounded-full border transition-colors cursor-pointer shadow-lg backdrop-blur-md z-20 ${
                    isListening
                      ? "bg-warning-amber/20 border-warning-amber text-warning-amber animate-pulse shadow-[0_0_15px_rgba(255,159,10,0.4)]"
                      : "bg-zinc-900 border-warning-amber/20 text-zinc-400 hover:text-warning-amber"
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              <button
                disabled={!rawInput.trim() || isParsing}
                onClick={() => {
                  handleProcessPanicStream(true);
                }}
                className="relative z-10 w-full bg-warning-amber text-[#030303] font-bold font-mono uppercase tracking-widest py-3.5 rounded-xl hover:bg-[#ffaa22] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,159,10,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]"
              >
                {isParsing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Process Panic Stream"
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {userProfile && (userProfile.hasCompletedOnboarding === false || showSettings) && (
          <OnboardingWizard
            onComplete={(data) => {
              saveUserProfile({ 
                ...userProfile, 
                hasCompletedOnboarding: true,
                phoneNumber: data?.phoneNumber || userProfile.phoneNumber || "",
                email: data?.email || userProfile.email || "",
                isNewUser: false
              });
              setShowSettings(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
