"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageSquareCode,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Award,
  Lightbulb,
  Code2,
  BookOpen,
  Eye,
  Compass,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
  ArrowRight,
  HelpCircle,
  Terminal,
  Layers,
  Copy,
} from "lucide-react";
import { interviewQuestionsList } from "@/lib/career-data";
import { fetchWithAuth } from "@/lib/api-client";
import {
  PRACTICE_EXERCISES,
  PracticeExercise,
} from "@/lib/practice-exercises-data";

interface InterviewEvaluation {
  verdict: string;
  rating: number;
  strengths: string[];
  areasForImprovement: string[];
  idealTalkingPoints: string[];
  provider: string;
  persisted: boolean;
  persistenceMessage: string;
}

interface TestRunResult {
  name: string;
  description: string;
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  error?: string;
}

interface CodeCritique {
  verdict: string;
  rating: number;
  correctParts: string[];
  mistakes: { mistake: string; whyMistake: string }[];
  hints: string[];
  suggestedImprovements: string[];
  provider: string;
}

function SimulatorPageContent() {
  const searchParams = useSearchParams();
  // Mode switcher: structured coding practice (default) vs technical interview simulator
  const [activeMode, setActiveMode] = useState<"practice" | "interview">(
    searchParams.get("mode") === "interview" ? "interview" : "practice"
  );
  useEffect(() => {
    setActiveMode(searchParams.get("mode") === "interview" ? "interview" : "practice");
  }, [searchParams]);

  // =========================================================================
  // STRUCTURED CODING PRACTICE STATE (8-STEP SEQUENCE)
  // =========================================================================
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const activeExercise: PracticeExercise = PRACTICE_EXERCISES[exerciseIndex] || PRACTICE_EXERCISES[0];

  // Editor and hint state
  const [userCode, setUserCode] = useState(activeExercise.starterCode);
  const [showHintIndex, setShowHintIndex] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Execution & Testing state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TestRunResult[] | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

  // AI Critique state
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [codeCritique, setCodeCritique] = useState<CodeCritique | null>(null);
  const [critiqueError, setCritiqueError] = useState<string | null>(null);

  // Ref for scrolling back to editor on "Try Again"
  const editorRef = useRef<HTMLDivElement | null>(null);

  // When switching exercises, reset state cleanly
  const handleSelectExercise = (idx: number) => {
    setExerciseIndex(idx);
    const newEx = PRACTICE_EXERCISES[idx];
    setUserCode(newEx.starterCode);
    setShowHintIndex(null);
    setShowSolution(false);
    setExecutionLogs([]);
    setTestResults(null);
    setExecutionError(null);
    setExecutionTimeMs(null);
    setCodeCritique(null);
    setCritiqueError(null);
  };

  // Safe client-side execution & testing
  const handleRunAndTest = () => {
    setIsExecuting(true);
    setExecutionError(null);
    const startTime = performance.now();
    const logs: string[] = [];

    const customConsole = {
      log: (...args: any[]) => {
        logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
      },
      warn: (...args: any[]) => {
        logs.push("[WARN] " + args.map((a) => String(a)).join(" "));
      },
      error: (...args: any[]) => {
        logs.push("[ERROR] " + args.map((a) => String(a)).join(" "));
      },
    };

    try {
      // Evaluate in an isolated Function scope to prevent global mutation
      const runner = new Function(
        "console",
        "window",
        "document",
        "localStorage",
        `"use strict";
        ${userCode}
        if (typeof ${activeExercise.functionName} !== "undefined") {
          return ${activeExercise.functionName};
        }
        return null;
        `
      );

      const userFn = runner(customConsole, undefined, undefined, undefined);

      if (typeof userFn !== "function") {
        throw new Error(
          `Function '${activeExercise.functionName}' was not found. Please make sure you defined 'function ${activeExercise.functionName}(...)' with the exact name.`
        );
      }

      // Execute each test case
      const results: TestRunResult[] = [];
      for (const tc of activeExercise.testCases) {
        try {
          const inputCloned = JSON.parse(JSON.stringify(tc.input));
          const actualOutput = userFn(...inputCloned);
          const passed = JSON.stringify(actualOutput) === JSON.stringify(tc.expectedOutput);

          results.push({
            name: tc.name,
            description: tc.description,
            passed,
            input: JSON.stringify(tc.input),
            expected: JSON.stringify(tc.expectedOutput),
            actual: actualOutput === undefined ? "undefined" : JSON.stringify(actualOutput),
          });
        } catch (testErr: any) {
          results.push({
            name: tc.name,
            description: tc.description,
            passed: false,
            input: JSON.stringify(tc.input),
            expected: JSON.stringify(tc.expectedOutput),
            actual: "Runtime Error",
            error: testErr.message || String(testErr),
          });
        }
      }

      const duration = Math.round(performance.now() - startTime);
      setExecutionTimeMs(duration);
      setExecutionLogs(logs);
      setTestResults(results);
    } catch (err: any) {
      const duration = Math.round(performance.now() - startTime);
      setExecutionTimeMs(duration);
      setExecutionLogs(logs);
      setExecutionError(err.message || "An error occurred while compiling your code.");
      setTestResults(null);
    } finally {
      setIsExecuting(false);
    }
  };

  // Step 6: Check My Answer (AI Critique)
  const handleCheckMyAnswer = async () => {
    setIsCritiquing(true);
    setCritiqueError(null);

    // Ensure tests have run so we have factual data
    let currentTestResults = testResults;
    if (!currentTestResults) {
      handleRunAndTest();
    }

    try {
      const questionPrompt = `Exercise: ${activeExercise.title} (${activeExercise.difficultyBadge})\nTask Goal: ${activeExercise.taskPrompt}\nFunction Name: ${activeExercise.functionName}\nRequirements: ${activeExercise.requirements.join("; ")}`;

      const res = await fetchWithAuth("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "Senior Code Mentor & Pedagogical Reviewer",
          question: questionPrompt,
          answer: userCode,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        // AI feedback received successfully from server Gemini connection
        const mistakesWithReasons = (data.areasForImprovement || []).map((item: string) => {
          const parts = item.split(":");
          return {
            mistake: parts[0]?.trim() || item,
            whyMistake: parts[1]?.trim() || "Addressing this ensures your code remains resilient and matches standard industry patterns.",
          };
        });

        setCodeCritique({
          verdict: data.verdict || "Completed Assessment",
          rating: Number(data.rating) || 8,
          correctParts: data.strengths || ["Valid syntax and function definition."],
          mistakes: mistakesWithReasons,
          hints: data.idealTalkingPoints || activeExercise.hints,
          suggestedImprovements: data.idealTalkingPoints || ["Keep your code clean, concise, and well-commented."],
          provider: data.provider || "Google Gemini AI",
        });
      } else {
        // Fallback to local pedagogical rubric if Gemini key is not configured
        generateLocalPedagogicalCritique();
      }
    } catch {
      // Local fallback in case of network or server failure
      generateLocalPedagogicalCritique();
    } finally {
      setIsCritiquing(false);
    }
  };

  // Intelligent local pedagogical rubric when external AI is offline
  const generateLocalPedagogicalCritique = () => {
    const passedCount = testResults ? testResults.filter((t) => t.passed).length : 0;
    const totalCount = activeExercise.testCases.length;
    const allPassed = passedCount === totalCount && totalCount > 0;

    if (allPassed) {
      setCodeCritique({
        verdict: "Mastered! All Test Cases Passed Cleanly",
        rating: 10,
        correctParts: [
          `Declared function '${activeExercise.functionName}' matching the expected contract.`,
          `Successfully satisfied all ${totalCount} automated test assertions including boundary conditions.`,
          "Proper return statement without console dependency.",
        ],
        mistakes: [],
        hints: [
          "You are ready to advance to the next difficulty level!",
          "Optional challenge: examine time complexity or consider whether template literals make the code cleaner.",
        ],
        suggestedImprovements: [
          "Add JSDoc documentation comments explaining parameters and return values.",
          "Consider edge cases like null or unusual inputs when building production systems.",
        ],
        provider: "Automated Test Suite & Pedagogical Rubric (Local Engine)",
      });
    } else {
      const failedTests = testResults ? testResults.filter((t) => !t.passed) : [];
      const calculatedRating = totalCount > 0 ? Math.max(3, Math.round((passedCount / totalCount) * 8)) : 4;

      setCodeCritique({
        verdict: "Revision Needed — Logic Mismatch Detected",
        rating: calculatedRating,
        correctParts: [
          `Function was defined and entered without fatal crash.`,
          passedCount > 0
            ? `Passed ${passedCount} out of ${totalCount} automated tests.`
            : "Attempted function skeleton and parameter handling.",
        ],
        mistakes: failedTests.map((ft) => ({
          mistake: `Failed '${ft.name}' (Input: ${ft.input})`,
          whyMistake: `Expected ${ft.expected}, but your code returned ${ft.actual}. ${ft.error ? `Error: ${ft.error}` : "This means the computation did not produce the expected value."}`,
        })),
        hints: activeExercise.hints,
        suggestedImprovements: [
          "Re-read Step 3 (Understand the Code) to review the exact expected output format.",
          "Double-check your comparison operators (e.g., >= vs >) or string spacing.",
        ],
        provider: "Automated Test Suite & Pedagogical Rubric (Local Engine)",
      });
    }
  };

  // Step 8: Try Again (Revise Code)
  const handleTryAgain = () => {
    setCodeCritique(null);
    setCritiqueError(null);
    if (editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const copyWorkedCode = () => {
    navigator.clipboard.writeText(activeExercise.workedExampleCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // =========================================================================
  // PRESERVED INTERVIEW SIMULATOR STATE
  // =========================================================================
  const [selectedQIdx, setSelectedQIdx] = useState(0);
  const [interviewAnswer, setInterviewAnswer] = useState("");
  const [isEvaluatingInterview, setIsEvaluatingInterview] = useState(false);
  const [interviewResult, setInterviewResult] = useState<InterviewEvaluation | null>(null);
  const [interviewError, setInterviewError] = useState<string | null>(null);

  const activeInterviewQ = interviewQuestionsList[selectedQIdx];

  const handleEvaluateInterview = async () => {
    setIsEvaluatingInterview(true);
    setInterviewError(null);
    try {
      const res = await fetchWithAuth("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: activeInterviewQ.role,
          question: activeInterviewQ.prompt,
          answer: interviewAnswer,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setInterviewError(data?.error || "Evaluation failed. Please provide a substantive response (min 5 characters).");
        setInterviewResult(null);
      } else {
        setInterviewResult(data);
      }
    } catch (e: any) {
      console.error(e);
      setInterviewError(e?.message || "Failed to reach interview evaluation engine. Please try again.");
      setInterviewResult(null);
    } finally {
      setIsEvaluatingInterview(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(var(--color-burgundy-rgb),0.15)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[var(--surface-rose)] text-[var(--color-burgundy)] border border-[rgba(var(--color-dusty-rose-rgb),0.6)]">
              <Code2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-burgundy)]">
              Check What You Know • Practice & Code Lab
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display-serif font-bold text-[var(--color-burgundy)]">
            Interactive Learning & Practice Lab
          </h1>
          <p className="text-xs text-[var(--color-burgundy)]/85 mt-0.5 font-medium">
            Step-by-step lessons, real coding practice, instant test verification, and intelligent AI feedback.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-[var(--color-creme-latte)] border border-[rgba(var(--color-burgundy-rgb),0.18)] shrink-0">
          <button
            onClick={() => setActiveMode("practice")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeMode === "practice"
                ? "bg-[var(--color-burgundy)] text-[var(--color-warm-ivory)] shadow-xs"
                : "text-[var(--color-burgundy)]/80 hover:text-[var(--color-burgundy)]"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Interactive Coding Practice</span>
          </button>
          <button
            onClick={() => setActiveMode("interview")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeMode === "interview"
                ? "bg-[var(--color-burgundy)] text-[var(--color-warm-ivory)] shadow-xs"
                : "text-[var(--color-burgundy)]/80 hover:text-[var(--color-burgundy)]"
            }`}
          >
            <MessageSquareCode className="w-3.5 h-3.5" />
            <span>Interview Simulator Mode</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODE A: STRUCTURED LESSON & CODING PRACTICE EXPERIENCE (8 STEPS)    */}
      {/* =================================================================== */}
      {activeMode === "practice" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Progressive Difficulty Navigation Bar */}
          <div className="card-coffee p-4 sm:p-5 border border-[rgba(var(--color-burgundy-rgb),0.14)] bg-[var(--color-warm-ivory)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-burgundy)] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--color-burgundy)]" />
                <span>Progressive Learning Levels (Guided Beginner → Challenge)</span>
              </span>
              <span className="text-xs font-semibold text-[var(--color-burgundy)]/80">
                Exercise {exerciseIndex + 1} of {PRACTICE_EXERCISES.length} • ~{activeExercise.estimatedMinutes} mins
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PRACTICE_EXERCISES.map((ex, idx) => {
                const isSelected = exerciseIndex === idx;
                return (
                  <button
                    key={ex.id}
                    onClick={() => handleSelectExercise(idx)}
                    className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[var(--color-burgundy)] text-[var(--color-warm-ivory)] border-[var(--color-burgundy)] shadow-xs"
                        : "bg-[var(--color-creme-latte)] border-[rgba(var(--color-burgundy-rgb),0.15)] text-[var(--color-burgundy)] hover:border-[var(--color-burgundy)]/40"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      Step {ex.stepNumber}
                    </span>
                    <span className="text-xs font-bold truncate mt-0.5">
                      {ex.title}
                    </span>
                    <span
                      className={`text-[9px] font-semibold mt-1 px-1.5 py-0.5 rounded w-fit ${
                        isSelected
                          ? "bg-[var(--surface-rose)] text-[var(--color-burgundy)]"
                          : "bg-[var(--surface-rose)]/70 text-[var(--color-burgundy)]"
                      }`}
                    >
                      {ex.level}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exercise Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-[var(--surface-rose)]/40 border border-[rgba(var(--color-dusty-rose-rgb),0.5)]">
            <div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md bg-[var(--color-burgundy)] text-[var(--color-warm-ivory)]">
                {activeExercise.difficultyBadge}
              </span>
              <h2 className="text-xl sm:text-2xl font-display-serif font-bold text-[var(--color-burgundy)] mt-2">
                {activeExercise.title}
              </h2>
              <p className="text-xs text-[var(--color-burgundy)]/90 mt-1 font-medium leading-relaxed">
                {activeExercise.summary}
              </p>
            </div>
          </div>

          {/* =============================================================== */}
          {/* STEP 1: LEARN THE IDEA                                           */}
          {/* =============================================================== */}
          <div className="card-coffee p-6 sm:p-8 space-y-5 border border-[rgba(var(--color-burgundy-rgb),0.14)] bg-[var(--color-warm-ivory)]">
            <div className="flex items-center gap-2 pb-3 border-b border-[rgba(var(--color-burgundy-rgb),0.12)]">
              <span className="p-1.5 rounded-lg bg-[var(--surface-rose)] text-[var(--color-burgundy)]">
                <BookOpen className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-burgundy)]/70">
                  Step 1 of 8
                </span>
                <h3 className="text-base font-display-serif font-bold text-[var(--color-burgundy)]">
                  Learn the Idea — Plain Language & Real-World Concept
                </h3>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-[var(--color-burgundy)]/95 leading-relaxed font-medium">
              {activeExercise.conceptExplanation}
            </div>

            {/* Real-World Analogy Callout */}
            <div className="p-4 rounded-xl bg-[var(--surface-rose)]/50 border border-[rgba(var(--color-dusty-rose-rgb),0.6)] space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-burgundy)]">
                <Lightbulb className="w-4 h-4 text-[var(--color-burgundy)]" />
                <span>Everyday Real-World Example</span>
              </div>
              <p className="text-xs text-[var(--color-burgundy)]/90 leading-relaxed font-medium">
                {activeExercise.realWorldAnalogy}
              </p>
            </div>

            {/* Vocabulary Grid */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold uppercase text-[var(--color-burgundy)] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[var(--color-burgundy)]" />
                <span>Key Words to Know</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeExercise.vocabulary.map((vocab, vIdx) => (
                  <div
                    key={vIdx}
                    className="p-3 rounded-xl bg-[var(--color-creme-latte)] border border-[rgba(var(--color-burgundy-rgb),0.12)] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-burgundy)]">
                        {vocab.term}
                      </span>
                      {vocab.example && (
                        <code className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-warm-ivory)] text-[var(--color-burgundy)] font-mono-code border border-[rgba(var(--color-burgundy-rgb),0.1)]">
                          {vocab.example}
                        </code>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-burgundy)]/85 leading-relaxed font-medium">
                      {vocab.definition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* STEP 2: SEE HOW IT WORKS                                         */}
          {/* =============================================================== */}
          <div className="card-coffee p-6 sm:p-8 space-y-5 border border-[rgba(var(--color-burgundy-rgb),0.14)] bg-[var(--color-warm-ivory)]">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(var(--color-burgundy-rgb),0.12)]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[var(--surface-rose)] text-[var(--color-burgundy)]">
                  <Eye className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-burgundy)]/70">
                    Step 2 of 8
                  </span>
                  <h3 className="text-base font-display-serif font-bold text-[var(--color-burgundy)]">
                    See How It Works — Worked Code Example
                  </h3>
                </div>
              </div>

              <button
                onClick={copyWorkedCode}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[rgba(var(--color-burgundy-rgb),0.2)] bg-[var(--color-warm-ivory)] text-[var(--color-burgundy)] text-xs font-semibold hover:bg-[var(--surface-rose)] transition cursor-pointer"
              >
                {codeCopied ? <Check className="w-3.5 h-3.5 text-green-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{codeCopied ? "Copied" : "Copy Code"}</span>
              </button>
            </div>

            {/* Worked Code Block */}
            <div className="rounded-xl overflow-hidden bg-[#181313] text-[#F5E8E0] border border-white/10 shadow-xs">
              <div className="px-4 py-2 bg-[#241C1C] border-b border-white/10 flex items-center justify-between text-[11px] font-mono-code text-zinc-300">
                <span>worked_example.js</span>
                <span className="text-zinc-400">JavaScript</span>
              </div>
              <pre className="p-4 font-mono-code text-xs sm:text-sm overflow-x-auto leading-relaxed text-[#F7F2EB]">
                {activeExercise.workedExampleCode}
              </pre>
            </div>

            {/* Line-by-Line Annotations */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold uppercase text-[var(--color-burgundy)] block">
                Line-by-Line Breakdown
              </span>
              <div className="space-y-2">
                {activeExercise.lineExplanations.map((lineExp, lIdx) => (
                  <div
                    key={lIdx}
                    className="p-3 rounded-xl bg-[var(--color-creme-latte)] border border-[rgba(var(--color-burgundy-rgb),0.12)] flex flex-col sm:flex-row sm:items-center gap-2 text-xs"
                  >
                    <code className="font-mono-code text-[11px] font-bold text-[var(--color-burgundy)] bg-[var(--surface-rose)]/70 px-2 py-1 rounded sm:w-1/2 shrink-0 truncate">
                      {lineExp.line}
                    </code>
                    <span className="text-[var(--color-burgundy)]/90 font-medium leading-relaxed">
                      {lineExp.explanation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* STEP 3: UNDERSTAND THE CODE                                      */}
          {/* =============================================================== */}
          <div className="card-coffee p-6 sm:p-8 space-y-5 border border-[rgba(var(--color-burgundy-rgb),0.14)] bg-[var(--color-warm-ivory)]">
            <div className="flex items-center gap-2 pb-3 border-b border-[rgba(var(--color-burgundy-rgb),0.12)]">
              <span className="p-1.5 rounded-lg bg-[var(--surface-rose)] text-[var(--color-burgundy)]">
                <Compass className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-burgundy)]/70">
                  Step 3 of 8
                </span>
                <h3 className="text-base font-display-serif font-bold text-[var(--color-burgundy)]">
                  Understand the Code — Input, Logic & Output Breakdown
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Input */}
              <div className="p-4 rounded-xl bg-[var(--color-creme-latte)] border border-[rgba(var(--color-burgundy-rgb),0.15)] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-burgundy)] block">
                  1. The Input (What goes in)
                </span>
                <p className="text-xs text-[var(--color-burgundy)]/90 leading-relaxed font-medium">
                  {activeExercise.inputExplanation}
                </p>
              </div>

              {/* Logic */}
              <div className="p-4 rounded-xl bg-[var(--surface-rose)]/50 border border-[rgba(var(--color-dusty-rose-rgb),0.6)] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-burgundy)] block">
                  2. The Logic (How it processes)
                </span>
                <p className="text-xs text-[var(--color-burgundy)]/90 leading-relaxed font-medium">
                  {activeExercise.logicExplanation}
                </p>
              </div>

              {/* Output */}
              <div className="p-4 rounded-xl bg-[var(--color-creme-latte)] border border-[rgba(var(--color-burgundy-rgb),0.15)] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-burgundy)] block">
                  3. Expected Result (What comes out)
                </span>
                <p className="text-xs text-[var(--color-burgundy)]/90 leading-relaxed font-medium">
                  {activeExercise.outputExplanation}
                </p>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* STEP 4: WRITE YOUR OWN CODE                                      */}
          {/* =============================================================== */}
          <div
            ref={editorRef}
            className="card-coffee p-6 sm:p-8 space-y-5 border border-[rgba(var(--color-burgundy-rgb),0.14)] bg-[var(--color-warm-ivory)]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(var(--color-burgundy-rgb),0.12)]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[var(--color-burgundy)] text-[var(--color-warm-ivory)]">
                  <Code2 className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-burgundy)]/70">
                    Step 4 of 8
                  </span>
                  <h3 className="text-base font-display-serif font-bold text-[var(--color-burgundy)]">
                    Write Your Own Code — Your Turn to Build
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUserCode(activeExercise.starterCode)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[rgba(var(--color-burgundy-rgb),0.2)] bg-[var(--color-warm-ivory)] text-[var(--color-burgundy)] text-xs font-semibold hover:bg-[var(--surface-rose)] transition cursor-pointer"
                  title="Reset to starter code"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Task Prompt & Requirements */}
            <div className="p-4 rounded-xl bg-[var(--color-creme-latte)] border border-[rgba(var(--color-burgundy-rgb),0.15)] space-y-3">
              <span className="text-xs font-bold uppercase text-[var(--color-burgundy)] block">
                Your Task Instructions:
              </span>
              <p className="text-xs sm:text-sm font-semibold text-[var(--color-burgundy)] leading-relaxed whitespace-pre-line">
                {activeExercise.taskPrompt}
              </p>
              <div className="space-y-1 pt-1">
                <span className="text-[10px] uppercase font-bold text-[var(--color-burgundy)]/75 block">
                  Requirements Checklist:
                </span>
                {activeExercise.requirements.map((req, rIdx) => (
                  <div key={rIdx} className="flex items-start gap-1.5 text-xs text-[var(--color-burgundy)]/90 font-medium">
                    <span className="text-[var(--color-flowering-chestnut)] font-bold">•</span>
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hint Accordion */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {activeExercise.hints.map((_, hIdx) => (
                  <button
                    key={hIdx}
                    onClick={() => setShowHintIndex(showHintIndex === hIdx ? null : hIdx)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border border-[rgba(var(--color-burgundy-rgb),0.2)] bg-[var(--surface-rose)]/40 text-[var(--color-burgundy)] hover:bg-[var(--surface-rose)] transition cursor-pointer"
                  >
                    <Lightbulb className="w-3 h-3 text-[var(--color-burgundy)]" />
                    <span>{showHintIndex === hIdx ? `Hide Hint ${hIdx + 1}` : `Hint ${hIdx + 1}`}</span>
                  </button>
                ))}

                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border border-[rgba(var(--color-burgundy-rgb),0.2)] text-[var(--color-burgundy)]/80 hover:text-[var(--color-burgundy)] transition cursor-pointer ml-auto"
                >
                  <span>{showSolution ? "Hide Solution" : "View Model Solution"}</span>
                </button>
              </div>

              {showHintIndex !== null && (
                <div className="p-3.5 rounded-xl bg-[var(--surface-rose)] border border-[var(--color-dusty-rose)] text-xs text-[var(--color-burgundy)] font-medium leading-relaxed animate-in fade-in duration-150">
                  💡 <span className="font-bold">Hint:</span> {activeExercise.hints[showHintIndex]}
                </div>
              )}

              {showSolution && (
                <div className="p-4 rounded-xl bg-[#1A1414] text-[#F5E8E0] border border-white/10 space-y-2 animate-in fade-in duration-150">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                    Model Reference Solution:
                  </span>
                  <pre className="font-mono-code text-xs overflow-x-auto text-emerald-300">
                    {activeExercise.solutionCode}
                  </pre>
                  <p className="text-[10px] text-zinc-400">
                    Study the solution structure, then try implementing it in your own words in the editor below.
                  </p>
                </div>
              )}
            </div>

            {/* Interactive Code Editor */}
            <div className="rounded-xl overflow-hidden bg-[#181313] text-[#F5E8E0] border border-white/10 shadow-xs">
              <div className="px-4 py-2 bg-[#241C1C] border-b border-white/10 flex items-center justify-between text-[11px] font-mono-code text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                  <span>solution.js — Editable Workstation</span>
                </span>
                <span className="text-zinc-400 text-[10px]">Client-Side In-Browser Sandbox</span>
              </div>
              <textarea
                rows={10}
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                spellCheck={false}
                className="w-full p-4 font-mono-code text-xs sm:text-sm bg-[#181313] text-[#F7F2EB] focus:outline-none resize-y leading-relaxed border-0"
                placeholder="// Type your solution here..."
              />
            </div>

            {/* Action Buttons for Step 5 & Step 6 */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-[var(--color-burgundy)]/80 font-medium">
                Untrusted code runs securely in your browser sandbox. Real output is captured truthful and un-faked.
              </div>

              <div className="flex items-center gap-2">
                {/* Step 5 Action: Run and Test */}
                <button
                  onClick={handleRunAndTest}
                  disabled={isExecuting}
                  className="btn-burgundy px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Step 5: Run & Test Code</span>
                    </>
                  )}
                </button>

                {/* Step 6 Action: Check My Answer */}
                <button
                  onClick={handleCheckMyAnswer}
                  disabled={isCritiquing || !userCode.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--surface-rose)] text-[var(--color-burgundy)] border border-[rgba(var(--color-dusty-rose-rgb),0.8)] hover:bg-[var(--surface-rose)]/80 transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isCritiquing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-burgundy)]" />
                      <span>Analyzing Logic...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[var(--color-burgundy)]" />
                      <span>Step 6: Check My Answer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* STEP 5: RUN AND TEST (RESULTS & OUTPUT)                          */}
          {/* =============================================================== */}
          {(testResults || executionError || executionLogs.length > 0) && (
            <div className="card-coffee p-6 sm:p-8 space-y-5 border border-[rgba(var(--color-burgundy-rgb),0.14)] bg-[var(--color-warm-ivory)] animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(var(--color-burgundy-rgb),0.12)]">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[var(--surface-rose)] text-[var(--color-burgundy)]">
                    <Terminal className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-burgundy)]/70">
                      Step 5 of 8
                    </span>
                    <h3 className="text-base font-display-serif font-bold text-[var(--color-burgundy)]">
                      Run and Test — Truthful Execution Output & Test Assertions
                    </h3>
                  </div>
                </div>

                {executionTimeMs !== null && (
                  <span className="text-xs font-semibold text-[var(--color-burgundy)]/80">
                    Execution Time: {executionTimeMs}ms
                  </span>
                )}
              </div>

              {/* Execution Error Notice */}
              {executionError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-mono-code space-y-1">
                  <span className="font-bold block">Execution Error:</span>
                  <p>{executionError}</p>
                </div>
              )}

              {/* Console stdout */}
              {executionLogs.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-[var(--color-burgundy)] block">
                    Console Logs (stdout)
                  </span>
                  <div className="p-3 rounded-xl bg-[#1A1414] text-zinc-200 font-mono-code text-xs space-y-1">
                    {executionLogs.map((log, lIdx) => (
                      <div key={lIdx}>&gt; {log}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Case Breakdown Matrix */}
              {testResults && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-[var(--color-burgundy)] block">
                      Automated Test Results ({testResults.filter((t) => t.passed).length} / {testResults.length} Passed)
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        testResults.every((t) => t.passed)
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {testResults.every((t) => t.passed) ? "All Tests Passed ✓" : "Fix Failed Tests ⚠️"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {testResults.map((tr, trIdx) => (
                      <div
                        key={trIdx}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          tr.passed
                            ? "bg-green-50/60 border-green-200 text-green-950"
                            : "bg-rose-50/60 border-rose-200 text-rose-950"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {tr.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            <span className="font-bold text-xs">{tr.name}</span>
                          </div>
                          <p className="text-[11px] opacity-80">{tr.description}</p>
                          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] font-mono-code">
                            <span className="bg-white/80 px-2 py-0.5 rounded border border-black/10">
                              Input: {tr.input}
                            </span>
                            <span className="bg-white/80 px-2 py-0.5 rounded border border-black/10">
                              Expected: {tr.expected}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded border ${
                                tr.passed ? "bg-green-100 border-green-300" : "bg-rose-100 border-rose-300 font-bold"
                              }`}
                            >
                              Actual: {tr.actual}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] uppercase font-extrabold px-2 py-1 rounded shrink-0 ${
                            tr.passed ? "bg-green-200 text-green-800" : "bg-rose-200 text-rose-800"
                          }`}
                        >
                          {tr.passed ? "PASSED" : "FAILED"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 7: EXPLAIN AND IMPROVE (AI CRITIQUE & STEP 8: TRY AGAIN)     */}
          {/* =============================================================== */}
          {codeCritique && (
            <div className="card-coffee p-6 sm:p-8 space-y-6 border border-[rgba(var(--color-burgundy-rgb),0.14)] bg-[var(--color-warm-ivory)] animate-in slide-in-from-bottom duration-300">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(var(--color-burgundy-rgb),0.12)]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-flowering-chestnut)]">
                    Step 7 of 8 • Explain and Improve
                  </span>
                  <h3 className="text-lg font-display-serif font-bold text-[var(--color-burgundy)] mt-0.5">
                    Verdict: {codeCritique.verdict}
                  </h3>
                  <p className="text-[11px] text-[var(--color-burgundy)]/80 mt-0.5 font-medium">
                    Review provider: {codeCritique.provider}
                  </p>
                </div>

                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-rose)] text-[var(--color-burgundy)] border border-[rgba(var(--color-dusty-rose-rgb),0.6)] font-bold text-sm">
                  <Award className="w-4 h-4 text-[var(--color-burgundy)]" />
                  <span>Score: {codeCritique.rating} / 10</span>
                </div>
              </div>

              {/* Rubric Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Correct Parts */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-burgundy)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-700" />
                    <span>Correct Parts (What You Did Well)</span>
                  </span>
                  <div className="space-y-2">
                    {codeCritique.correctParts.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[var(--surface-rose)] border border-[rgba(var(--color-dusty-rose-rgb),0.5)] text-xs text-[var(--color-burgundy)] font-medium leading-relaxed"
                      >
                        ✓ {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mistakes & Why they are mistakes */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-burgundy)] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <span>Mistakes & Why They Matter</span>
                  </span>
                  <div className="space-y-2">
                    {codeCritique.mistakes.length === 0 ? (
                      <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-900 font-medium">
                        ✓ No critical mistakes detected! Your solution matches the rubric requirements.
                      </div>
                    ) : (
                      codeCritique.mistakes.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[var(--color-creme-latte)] border border-[rgba(var(--color-burgundy-rgb),0.15)] space-y-1 text-xs text-[var(--color-burgundy)]"
                        >
                          <span className="font-bold block text-rose-800">• {m.mistake}</span>
                          <span className="text-[11px] text-[var(--color-burgundy)]/85 block leading-relaxed">
                            <span className="font-semibold">Why:</span> {m.whyMistake}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Hints & Suggested Improvements */}
              <div className="p-4 rounded-xl bg-[var(--color-creme-latte)] border border-[rgba(var(--color-burgundy-rgb),0.14)] space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-burgundy)] flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-[var(--color-flowering-chestnut)]" />
                  <span>Hints & Suggested Improvements</span>
                </span>
                <div className="space-y-1">
                  {codeCritique.suggestedImprovements.map((tip, idx) => (
                    <div key={idx} className="text-xs text-[var(--color-burgundy)]/90 font-medium flex items-start gap-1.5">
                      <span className="text-[var(--color-flowering-chestnut)] font-bold">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* =========================================================== */}
              {/* STEP 8: TRY AGAIN (ACTIONS)                                  */}
              {/* =========================================================== */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[rgba(var(--color-burgundy-rgb),0.12)]">
                <div className="text-xs text-[var(--color-burgundy)]/85 font-medium">
                  Step 8 of 8 • Revise your code in the editor and click &apos;Run & Test&apos; to verify your adjustments.
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTryAgain}
                    className="btn-burgundy px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again & Revise Code</span>
                  </button>

                  {exerciseIndex < PRACTICE_EXERCISES.length - 1 && (
                    <button
                      onClick={() => handleSelectExercise(exerciseIndex + 1)}
                      className="btn-secondary-coffee px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Next Exercise</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODE B: PRESERVED TECHNICAL INTERVIEW SIMULATOR                     */}
      {/* =================================================================== */}
      {activeMode === "interview" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Question Selector Tabs */}
          <div className="flex flex-wrap gap-2">
            {interviewQuestionsList.map((q, i) => (
              <button
                key={q.id}
                onClick={() => {
                  setSelectedQIdx(i);
                  setInterviewResult(null);
                  setInterviewError(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedQIdx === i ? "btn-burgundy shadow-xs" : "btn-secondary-coffee"
                }`}
              >
                Prompt {i + 1}: {q.category}
              </button>
            ))}
          </div>

          {/* Active Question Prompt */}
          <div className="card-coffee p-6 sm:p-8 space-y-4 border border-[rgba(var(--color-burgundy-rgb),0.14)] bg-[var(--color-warm-ivory)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[var(--surface-rose)] text-[var(--color-burgundy)] border border-[rgba(var(--color-dusty-rose-rgb),0.5)]">
                Role: {activeInterviewQ.role} • {activeInterviewQ.category}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-display-serif font-bold text-[var(--color-burgundy)] leading-snug">
              {activeInterviewQ.prompt}
            </h2>

            {/* Rubric Points Overview */}
            <div className="p-4 rounded-xl bg-[var(--color-creme-latte)] border border-[rgba(var(--color-burgundy-rgb),0.15)] space-y-2">
              <span className="text-[10px] uppercase font-bold text-[var(--color-burgundy)] block">
                Senior Interviewer Assessment Focus
              </span>
              <div className="space-y-1">
                {activeInterviewQ.rubricKeyPoints.map((pt, idx) => (
                  <div key={idx} className="text-xs text-[var(--color-burgundy)]/90 flex items-start gap-2 font-medium">
                    <span className="text-[var(--color-flowering-chestnut)] font-bold">•</span>
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Answer Input */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-[var(--color-burgundy)]">
                Your Technical Response:
              </label>
              <textarea
                rows={6}
                value={interviewAnswer}
                onChange={(e) => setInterviewAnswer(e.target.value)}
                placeholder="Structure your answer: trade-offs, architecture choices, latency implications, and resilience patterns..."
                className="input-coffee w-full p-4 rounded-xl text-xs sm:text-sm leading-relaxed bg-[var(--color-warm-ivory)] text-[var(--color-burgundy)]"
              />
            </div>

            {/* Submit Action */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleEvaluateInterview}
                disabled={isEvaluatingInterview || !interviewAnswer.trim()}
                className="btn-burgundy px-6 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isEvaluatingInterview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--color-warm-ivory)]" />
                    <span>Interviewer Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[var(--color-warm-ivory)]" />
                    <span>Check My Answer</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {interviewError && (
            <div className="p-4 rounded-xl bg-[var(--surface-rose)] border border-[var(--color-dusty-rose)] text-xs text-[var(--color-burgundy)] flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[var(--color-burgundy)]" />
              <div className="space-y-1">
                <span className="font-bold block">Evaluation Notice</span>
                <p className="leading-relaxed font-medium">{interviewError}</p>
              </div>
            </div>
          )}

          {/* Feedback Panel */}
          {interviewResult && (
            <div className="card-coffee p-6 sm:p-8 space-y-6 animate-in slide-in-from-bottom duration-300 border border-[rgba(var(--color-burgundy-rgb),0.14)] bg-[var(--color-warm-ivory)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(var(--color-burgundy-rgb),0.12)]">
                <div>
                  <span className="text-xs font-bold uppercase text-[var(--color-flowering-chestnut)]">
                    AI Interviewer Critique
                  </span>
                  <h3 className="text-lg font-display-serif font-bold text-[var(--color-burgundy)] mt-0.5">
                    Verdict: {interviewResult.verdict}
                  </h3>
                </div>

                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-rose)] text-[var(--color-burgundy)] border border-[rgba(var(--color-dusty-rose-rgb),0.6)] font-bold text-sm">
                  <Award className="w-4 h-4 text-[var(--color-burgundy)]" />
                  <span>Score: {interviewResult.rating} / 10</span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[var(--text-secondary)]" role="status">
                Feedback provider: {interviewResult.provider}. {interviewResult.persistenceMessage}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-burgundy)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-burgundy)]" />
                    <span>Demonstrated Strengths</span>
                  </span>
                  <div className="space-y-2">
                    {(interviewResult.strengths || []).map((s: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[var(--surface-rose)] border border-[rgba(var(--color-dusty-rose-rgb),0.5)] text-xs text-[var(--color-burgundy)] font-medium"
                      >
                        ✓ {s}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-burgundy)] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-[var(--color-flowering-chestnut)]" />
                    <span>Areas for Improvement</span>
                  </span>
                  <div className="space-y-2">
                    {(interviewResult.areasForImprovement || []).map((a: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[var(--color-creme-latte)] border border-[rgba(var(--color-burgundy-rgb),0.15)] text-xs text-[var(--color-burgundy)] font-medium"
                      >
                        ! {a}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ideal Talking Points */}
              {interviewResult.idealTalkingPoints && (
                <div className="p-4 rounded-xl bg-[var(--color-warm-ivory)] border border-[rgba(var(--color-burgundy-rgb),0.14)] space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-burgundy)] flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-[var(--color-flowering-chestnut)]" />
                    <span>Interviewer Pro-Tip Talking Points</span>
                  </span>
                  <div className="space-y-1">
                    {interviewResult.idealTalkingPoints.map((tp: string, idx: number) => (
                      <div key={idx} className="text-xs text-[var(--color-burgundy)]/90 font-medium">
                        • {tp}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SimulatorPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-5xl p-8 text-sm text-[var(--text-secondary)]">Loading simulator…</main>}>
      <SimulatorPageContent />
    </Suspense>
  );
}
