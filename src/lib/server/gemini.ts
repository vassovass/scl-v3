import { z } from "zod";
import { format, subDays } from "date-fns";

/**
 * Gemini API client for StepLeague.
 * Handles step verification, feedback merging, and AI chat.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "models/gemini-2.0-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// =============================================================================
// Types
// =============================================================================

export interface GeminiExtraction {
    steps?: number;
    km?: number;
    calories?: number;
    date?: string;
    confidence?: "high" | "medium" | "low";
    notes?: string;
}

export interface GeminiResult {
    extraction: GeminiExtraction;
    rawText: string;
}

export interface GeminiCallParams {
    stepsClaimed: number;
    forDate: string;
    imageBase64: string;
    mimeType: string;
    userTimezone?: string; // Proactive: Ready for client-side timezone injection
}

export interface FeedbackItem {
    id: string;
    description: string | null;
    subject: string | null;
    screenshot_url: string | null;
    type: string;
    board_status: string;
    priority_order: number;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface AIChatResponse {
    reply: string;
    recommendations?: any[];
    actions?: any[];
}

interface GeminiPart {
    text?: string;
    inlineData?: {
        data: string;
        mimeType: string;
    };
}

interface GeminiContent {
    role: "user" | "model";
    parts: GeminiPart[];
}

// Proactive: Validation schema for robustness
const extractionSchema = z.object({
    steps: z.number().or(z.string().transform(val => Number(val))).nullish(), // Handle potential string "1000" from lenient JSON
    km: z.number().or(z.string().transform(val => Number(val))).nullish(),
    calories: z.number().or(z.string().transform(val => Number(val))).nullish(),
    date: z.string().nullish(),
    confidence: z.enum(["high", "medium", "low"]).optional(),
    notes: z.string().optional(),
});

// =============================================================================
// Public Functions
// =============================================================================

/**
 * Generates the verification prompt with relative date context.
 * Exported for testability (Proactive: Testability).
 */
export function generateVerificationPrompt(
    claimedSteps: number,
    claimedDate: string,
    timezone: string = "UTC"
): string {
    const today = new Date();
    const fmt = (d: Date) => format(d, "yyyy-MM-dd");
    const currentYear = fmt(today).split('-')[0];

    return `You are a specialized OCR and data extraction expert for fitness tracking applications.

YOUR CONSTRAINTS:
- NEVER fabricate data - return null if you cannot confidently extract a value
- NEVER guess dates - if ambiguous, explain why in the "notes" field
- ALWAYS provide a confidence score and explain your reasoning in "notes"
- ALWAYS return valid JSON matching the schema exactly

TASK: Extract step count and date from fitness app screenshot.

USER CLAIM:
- Claimed steps: ${claimedSteps === 0 ? 'AUTO-EXTRACT (user did not specify)' : claimedSteps}
- Claimed date: ${claimedDate}

DATE CONTEXT (Reference: ${fmt(today)}):
- Today = ${fmt(today)}
- Yesterday = ${fmt(subDays(today, 1))}
- 2 days ago = ${fmt(subDays(today, 2))}
- 3 days ago = ${fmt(subDays(today, 3))}
- Current year: ${currentYear}

KNOWN FITNESS APP PATTERNS:

**Samsung Health:**
- Daily total: Large number at top or bottom of screen
- Labels: "걸음" (Korean), "Steps", "steps"
- Date format: "Sat, 22 Nov" or "오늘" (Today)
- Chart: Hourly bars (IGNORE - extract the total, not hourly values)

**Google Fit:**
- Daily total: Center of screen, large font
- Label: "Steps" with shoe icon
- Ring chart shows goal progress (IGNORE goal, extract actual)

**Apple Health:**
- Daily total: Center card with "Steps" label
- Bar chart background is decorative (IGNORE)

**Xiaomi Mi Fit / Zepp Life:**
- Labels: "步数" (Chinese), "Steps", "걸음수" (Korean)
- Large number at top

EXTRACTION RULES:

1. **Steps**: Extract the TOTAL daily step count (usually the largest number)
   - IGNORE hourly breakdowns, weekly totals, or goal numbers
   - If multiple dates visible, extract ONLY for the claimed date
   - Common labels: "Steps", "steps", "步数" (Chinese), "걸음" (Korean), "Schritte" (German), "Pas" (French)
   - If hourly breakdown visible, the total is usually at the very top OR very bottom

2. **Date**: Convert screenshot date to YYYY-MM-DD format (MULTILINGUAL)

   **English:** "Today" → ${fmt(today)}, "Yesterday" → ${fmt(subDays(today, 1))}
   **Chinese:** "今天"/"今日" → ${fmt(today)}, "昨天"/"昨日" → ${fmt(subDays(today, 1))}
   **Spanish:** "Hoy" → ${fmt(today)}, "Ayer" → ${fmt(subDays(today, 1)}}
   **German:** "Heute" → ${fmt(today)}, "Gestern" → ${fmt(subDays(today, 1)}}
   **Korean:** "오늘" → ${fmt(today)}, "어제" → ${fmt(subDays(today, 1)}}
   **French:** "Aujourd'hui" → ${fmt(today)}, "Hier" → ${fmt(subDays(today, 1)}}

   **Partial dates:** "Sat, 22 Nov", "22 Nov", "Nov 22" → Use year ${currentYear}
   **Weekday inference:** "Sat, 22 Nov" → Calculate year from weekday + current date

   If language/format is ambiguous, analyze UI elements and note your reasoning.
   If year is missing, use ${currentYear} and note the assumption.

3. **Distance & Calories**: Extract if visible (optional)
   - Handle both metric (km) and imperial (mi) units
   - Convert miles to km if needed: 1 mi = 1.60934 km

4. **Confidence Scoring:**
   - **"high"**: Step count clearly visible, date explicit, good image quality, 95%+ confident
   - **"medium"**: Minor issues (small font, inferred date, slight blur), 70-95% confident
   - **"low"**: Blurry, rotated >15°, multiple totals unclear, weekly view, <70% confident
   - **null**: Image unreadable or shows non-fitness data

5. **Edge Cases:**
   - **Goal vs Actual**: Extract ACTUAL steps, not goal (e.g., "Goal: 10,000 / Actual: 7,500" → extract 7500)
   - **Weekly view**: If multiple days shown, extract only the claimed date
   - **Partial day**: "So far today: 3,421 steps" → extract 3421, set confidence: "medium"
   - **Zero steps**: If screenshot shows "0 steps" → return 0 (NOT null)
   - **Rotated/cropped**: Attempt extraction, lower confidence, explain in notes

RESPONSE FORMAT (strict JSON):
{
  "steps": number | null,
  "km": number | null,
  "calories": number | null,
  "date": "YYYY-MM-DD" | null,
  "confidence": "high" | "medium" | "low" | null,
  "notes": "Explain your extraction process, reasoning, and any assumptions"
}

VALIDATION:
- "steps": integer 0-100000 (if >100000, set confidence: "low")
- "km": float 0-100 (if >100, set confidence: "low")
- "date": Must be YYYY-MM-DD format
- "notes": REQUIRED - always explain which number you chose and why

EXAMPLES:
{"steps": 12345, "date": "2024-11-20", "confidence": "high", "notes": "Samsung Health. Daily total clearly at top. Date 'Thu, 20 Nov' - inferred 2024."}
{"steps": 9677, "date": "2024-11-22", "confidence": "medium", "notes": "Date 'Sat, 22 Nov' - inferred year ${currentYear} from context."}
{"steps": null, "date": null, "confidence": "low", "notes": "Image blurry. Cannot distinguish daily total from hourly breakdown."}`;
}

/**
 * Extract step data from a screenshot (Legacy/Current use)
 */
export async function callGemini(params: GeminiCallParams): Promise<GeminiResult> {
    const prompt = generateVerificationPrompt(params.stepsClaimed, params.forDate, params.userTimezone);

    const contents: GeminiContent[] = [{
        role: "user",
        parts: [
            { text: prompt },
            {
                inlineData: {
                    data: params.imageBase64,
                    mimeType: params.mimeType,
                },
            },
        ]
    }];

    const rawText = await callGeminiGenerative(contents);
    const extraction = parseGeminiText(rawText);

    return { extraction, rawText };
}

/**
 * Generate a combined description from multiple feedback items
 * Fetches screenshots if available and includes them in the prompt.
 */
export async function generateMergedDescription(items: FeedbackItem[]): Promise<string> {
    const parts: GeminiPart[] = [];

    // 1. Add text context
    let prompt = `Combine these ${items.length} feedback items into one clear, concise merged description. 
    Capture all key points, reproduction steps, and technical details.
    
    ITEMS TO MERGE:
    `;

    items.forEach((item, index) => {
        prompt += `\nItem ${index + 1}: "${item.subject}" - ${item.description || '(no description)'}`;
        if (item.screenshot_url) {
            prompt += ` [Has screenshot ${index + 1}]`;
        }
    });

    prompt += `\n\nINSTRUCTIONS:
    1. Write a single cohesive description that makes sense on its own.
    2. Do not just list the items; synthesize them.
    3. If there are screenshots, describe what they likely show based on the context and refer to them as "Screenshot 1", etc.
    4. Keep it professional and actionable for developers.
    `;

    parts.push({ text: prompt });

    // 2. Add images
    for (const item of items) {
        if (item.screenshot_url) {
            try {
                const imagePart = await fetchImageAsBase64(item.screenshot_url);
                if (imagePart) {
                    parts.push(imagePart);
                }
            } catch (e) {
                console.error(`Failed to fetch image for item ${item.id}:`, e);
            }
        }
    }

    const contents: GeminiContent[] = [{ role: "user", parts }];
    return await callGeminiGenerative(contents);
}

/**
 * Chat with AI about feedback items
 * Can analyze items, suggest merges, or answer questions.
 */
export async function chatWithAI(
    message: string,
    items: FeedbackItem[],
    history: ChatMessage[] = []
): Promise<AIChatResponse> {
    // Summarize items for context (truncated to avoid token limits if too many)
    // For large datasets, we'd use RAG, but for <100 active items this is fine.
    const itemsContext = items.slice(0, 50).map(i =>
        `[${i.id}] ${i.type} (${i.board_status}): "${i.subject}"`
    ).join("\n");

    const systemPrompt = `You are an AI assistant for StepLeague's admin dashboard.
    You have access to the current list of feedback/kanban items.
    
    YOUR CAPABILITIES:
    1. Answer questions about the backlog (counts, themes, priorities).
    2. Suggest items to merge (if they are duplicates).
    3. Suggest groupings or priorities.
    
    CURRENT ITEMS:
    ${itemsContext}
    
    RESPONSE FORMAT:
    Respond strictly as JSON object with these keys:
    {
      "reply": "Your conversational response here",
      "recommendations": [ { "type": "merge|group|priority", "items": ["id1", "id2"], "reason": "..." } ],
      "actions": [ { "type": "merge", "primaryId": "id1", "secondaryIds": ["id2"] } ]
    }
    
    Refuse to do anything outside of managing these items.
    `;

    const contents: GeminiContent[] = [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...history.map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
        } as GeminiContent)),
        { role: "user", parts: [{ text: message }] }
    ];

    // Force JSON response
    const rawText = await callGeminiGenerative(contents, true);

    try {
        const parsed = JSON.parse(extractJson(rawText));
        return {
            reply: parsed.reply || "I processed your request.",
            recommendations: parsed.recommendations || [],
            actions: parsed.actions || []
        };
    } catch (e) {
        // Fallback if JSON parsing fails
        return {
            reply: rawText,
        };
    }
}

// =============================================================================
// Internal Helpers
// =============================================================================

async function callGeminiGenerative(contents: GeminiContent[], jsonMode = false): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const body = {
        contents,
        generationConfig: {
            temperature: 0.2, // Proactive: Low temp for more deterministic extraction
            topP: 0.8,
            responseMimeType: jsonMode ? "application/json" : "text/plain",
        },
    };

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gemini request failed (${response.status}): ${text}`);
    }

    const result = await response.json();
    return result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function fetchImageAsBase64(url: string): Promise<GeminiPart | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        const mimeType = res.headers.get("content-type") || "image/jpeg";

        return {
            inlineData: {
                data: base64,
                mimeType,
            }
        };
    } catch {
        return null;
    }
}

function parseGeminiText(rawText: string): GeminiExtraction {
    if (!rawText) return {};
    const trimmed = rawText.trim();
    const jsonText = extractJson(trimmed);
    try {
        const parsed = JSON.parse(jsonText);
        // Proactive: Use Zod safeParse for typed validation
        const result = extractionSchema.safeParse(parsed);

        if (result.success) {
            return {
                steps: result.data.steps ?? undefined,
                km: result.data.km ?? undefined,
                calories: result.data.calories ?? undefined,
                date: result.data.date ?? undefined,
                confidence: result.data.confidence ?? undefined,
                notes: result.data.notes ?? undefined,
            };
        }
        console.warn("Gemini extraction failed schema validation:", result.error);
        return {};
    } catch (e) {
        console.warn("Gemini JSON parse failed:", e);
        return {};
    }
}

function extractJson(text: string): string {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
        return text.slice(start, end + 1);
    }
    return text;
}
