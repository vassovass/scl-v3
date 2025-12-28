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

// =============================================================================
// Public Functions
// =============================================================================

/**
 * Extract step data from a screenshot (Legacy/Current use)
 */
export async function callGemini(params: GeminiCallParams): Promise<GeminiResult> {
    const prompt = `The user states they walked ${params.stepsClaimed} steps on ${params.forDate}. From the attached screenshot, extract the actual steps, distance in kilometers, calories, and the date displayed. Respond strictly as JSON with keys steps, km, calories, date.`;

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
            temperature: 0.2,
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
        return {
            steps: typeof parsed.steps === "number" ? parsed.steps : undefined,
            km: typeof parsed.km === "number" ? parsed.km : undefined,
            calories: typeof parsed.calories === "number" ? parsed.calories : undefined,
            date: typeof parsed.date === "string" ? parsed.date : undefined,
        };
    } catch {
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
