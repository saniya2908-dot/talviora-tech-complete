import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
export const isGeminiConfigured = Boolean(apiKey && apiKey !== "your_gemini_api_key_here");
const requestedModel = process.env.GEMINI_MODEL?.trim();
const modelName = requestedModel === "gemini-3.8-flash" || requestedModel === "gemini-3.6-flash"
  ? requestedModel
  : "gemini-3.8-flash";

const genAI = isGeminiConfigured ? new GoogleGenAI({ apiKey }) : null;

async function generateText(prompt: string, temperature: number, maxOutputTokens?: number) {
  if (!genAI) {
    throw new Error("Gemini is not configured. Add GEMINI_API_KEY on the server to enable AI features.");
  }

  const models = [...new Set([modelName, "gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.5-flash-lite"])];
  let lastError: unknown;

  for (let index = 0; index < models.length; index += 1) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        genAI.models.generateContent({
          model: models[index],
          contents: prompt,
          config: { temperature, responseMimeType: "application/json", ...(maxOutputTokens ? { maxOutputTokens } : {}) },
        }),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("AI provider request timed out.")), 25000);
        }),
      ]);
      if (!result.text) throw new Error("AI provider returned no text.");
      return result.text;
    } catch (error) {
      lastError = error;
      const status = (error as { status?: number }).status;
      const message = error instanceof Error ? error.message : String(error);
      const temporarilyUnavailable = status === 404 || status === 429 || status === 503 || /NOT_FOUND|not available to new users|UNAVAILABLE|high demand|timed out/i.test(message);
      if (!temporarilyUnavailable || index === models.length - 1) throw error;
      console.warn(`Gemini model ${models[index]} is temporarily unavailable; retrying with ${models[index + 1]}.`);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("AI provider request failed.");
}

function parseJson<T>(rawText: string): T {
  const clean = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  const candidate = firstBrace !== -1 && lastBrace > firstBrace
    ? clean.slice(firstBrace, lastBrace + 1)
    : clean;
  return JSON.parse(candidate) as T;
}

export async function generateCareerAssessmentAnalysis(params: {
  targetRole: string;
  skills: Record<string, number>;
}) {
  const prompt = `
You are the career-learning feedback assistant for TALVIORA TECH. Give cautious, specific educational guidance from the submitted assessment scores. Do not claim hiring outcomes, salary predictions, percentile rankings, or verified readiness.
Learner-selected target role (for context, not an external benchmark): ${params.targetRole}
Observed skill scores (0-100): ${JSON.stringify(params.skills)}

Return only JSON with readinessScore (0-100, derived only from the supplied scores), strongPillars (array), growthPillars (array), prioritySkills (array), recommendedProjects (array), nextSprintFocus (string), and executiveSummary (string). Mark readiness as an assessment result, not a job guarantee.
`;
  return parseJson<{
    readinessScore: number;
    strongPillars: string[];
    growthPillars: string[];
    prioritySkills: string[];
    recommendedProjects: string[];
    nextSprintFocus: string;
    executiveSummary: string;
  }>(await generateText(prompt, 0.3));
}

export async function evaluateInterviewResponse(params: {
  role: string;
  question: string;
  userAnswer: string;
}) {
  const prompt = `
Evaluate this practice answer against the question and role. Give evidence-based feedback from the words supplied; do not imply this is a real hiring assessment.
Role: ${params.role}
Question: ${params.question}
Candidate answer: ${params.userAnswer}

Return only JSON with rating (1-10), strengths (array), areasForImprovement (array), idealTalkingPoints (array), and verdict (string).
`;
  return parseJson<{
    rating: number;
    strengths: string[];
    areasForImprovement: string[];
    idealTalkingPoints: string[];
    verdict: string;
  }>(await generateText(prompt, 0.3));
}

export async function* streamMentorReply(
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): AsyncGenerator<string> {
  if (!genAI) {
    throw new Error("Gemini is not configured. Add GEMINI_API_KEY on the server to enable AI features.");
  }

  const prompt = [
    "You are Talviora's capable, careful general AI assistant and learning mentor.",
    "Answer the user's actual question regardless of topic, including technology, school, work, writing, creativity, everyday knowledge, and casual conversation. Do not refuse a harmless question because it is outside technology or career topics.",
    "Be accurate and direct. Do not invent facts, citations, actions, memory, or personal experience. If you are uncertain, say so plainly. You have no live web access in this chat; identify when an answer may be out of date and do not present guesses as current facts.",
    "For medical, legal, financial, or other high-stakes topics, give general information carefully and encourage checking with a qualified professional when the situation needs it.",
    "Use a warm, playful voice for casual, odd, or off-topic questions. Add a clever joke or silly comparison while still answering what the user actually asked. Do not derail into unrelated nonsense, make up facts, or mock the user. Keep technology, study, and career guidance clear and useful. For medical, legal, financial, safety, or otherwise serious questions, use a respectful, careful tone without jokes. Keep simple answers concise; give detail when it helps. Ask one focused clarification only when needed to answer correctly.",
    "Do not retain or reconstruct a personal profile about private individuals from earlier conversation history; discuss personal details only when the user provides them in the current request.",
    "Conversation history (oldest first):",
    history.slice(-40).map((item) => (item.role === "user" ? "User: " : "Assistant: ") + item.content).join("\n"),
    "User: " + message,
    "Assistant:"
  ].join("\n\n");

  const models = [...new Set([modelName, "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash"])];
  let lastError: unknown;

  for (let index = 0; index < models.length; index += 1) {
    let emittedText = false;
    try {
      const stream = await genAI.models.generateContentStream({
        model: models[index],
        contents: prompt,
        config: {
          maxOutputTokens: 4096,
          thinkingConfig: {
            thinkingLevel: models[index] === "gemini-3.5-flash-lite" ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW
          }
        }
      });
      const iterator = stream[Symbol.asyncIterator]();
      while (true) {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        let next: IteratorResult<Awaited<ReturnType<typeof iterator.next>> extends IteratorResult<infer T> ? T : never>;
        try {
          next = await Promise.race([
            iterator.next(),
            new Promise<never>((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error("AI provider stream timed out.")), 30000);
            })
          ]);
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
        }

        if (next.done) break;
        const text = next.value.text;
        if (text) {
          emittedText = true;
          yield text;
        }
      }

      if (!emittedText) throw new Error("AI provider returned no text.");
      return;
    } catch (error) {
      lastError = error;
      if (emittedText) throw error;
      const status = (error as { status?: number })?.status;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const temporarilyUnavailable = status === 404 || status === 429 || status === 503 ||
        /NOT_FOUND|not available to new users|UNAVAILABLE|high demand|timed out/i.test(errorMessage);
      if (!temporarilyUnavailable || index === models.length - 1) throw error;
      console.warn("Gemini model temporarily unavailable; trying the next configured fallback.");
    }
  }

  throw lastError instanceof Error ? lastError : new Error("AI provider request failed.");
}

export async function generatePersonalisedLearningPlan(params: {
  targetField: string;
  experienceLevel: string;
  dailyStudyMinutes: number;
  mainGoal: string;
}) {
  const prompt = `
You are the curriculum and career planning guide for TALVIORA TECH.
Create an honest, realistic, encouraging, and structured learning journey plan for a learner based ONLY on their provided answers.
Target field: ${params.targetField}
Experience level: ${params.experienceLevel}
Daily study commitment: ${params.dailyStudyMinutes} minutes/day
Main practical goal: ${params.mainGoal}

Return ONLY valid JSON with this exact schema:
{
  "summary": "one or two sentence supportive summary of this custom plan",
  "todayTasks": [
    { "title": "concrete action", "durationMinutes": 20, "type": "reading" }
  ],
  "weeklyGoalHours": 5,
  "roadmapMilestones": [
    { "week": 1, "title": "Foundation Milestone", "desc": "description of what they will achieve" }
  ],
  "recommendedExercises": [
    { "title": "exercise title", "desc": "brief instructions", "actionUrl": "/learning", "actionLabel": "Practice in Sandbox" }
  ],
  "suggestedProjects": [
    { "title": "project name", "level": "Beginner", "deliverable": "what is built", "desc": "why this matters" }
  ],
  "recommendedNextAction": {
    "title": "immediate next step",
    "desc": "why do this first",
    "actionUrl": "/learning",
    "actionLabel": "Start Step 1"
  }
}
Do not guarantee hiring or make inflated claims. Tailor tasks realistically to ${params.dailyStudyMinutes} minutes per day.
`;
  return parseJson<{
    summary: string;
    todayTasks: { title: string; durationMinutes: number; type: "reading" | "practice" | "quiz" | "project" }[];
    weeklyGoalHours: number;
    roadmapMilestones: { week: number; title: string; desc: string }[];
    recommendedExercises: { title: string; desc: string; actionUrl: string; actionLabel: string }[];
    suggestedProjects: { title: string; level: string; deliverable: string; desc: string }[];
    recommendedNextAction: { title: string; desc: string; actionUrl: string; actionLabel: string };
  }>(await generateText(prompt, 0.4));
}

