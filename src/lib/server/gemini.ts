/**
 * Gemini API client for step verification.
 * Calls Gemini 2.5 Flash to extract steps/km/calories from fitness app screenshots.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "models/gemini-2.5-flash-preview-05-20";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

export async function callGemini(params: GeminiCallParams): Promise<GeminiResult> {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `The user states they walked ${params.stepsClaimed} steps on ${params.forDate}. From the attached screenshot, extract the actual steps, distance in kilometers, calories, and the date displayed. Respond strictly as JSON with keys steps, km, calories, date.`;

    const body = {
        contents: [
            {
                role: "user",
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            data: params.imageBase64,
                            mimeType: params.mimeType,
                        },
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.2,
            topP: 0.8,
        },
    };

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gemini request failed (${response.status}): ${text}`);
    }

    const result = await response.json();
    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const extraction = parseGeminiText(rawText);

    return { extraction, rawText };
}

function parseGeminiText(rawText: string): GeminiExtraction {
    if (!rawText) {
        return {};
    }

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
