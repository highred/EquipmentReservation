
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import db from '../db';

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.warn("[WARN] Gemini API key not found in process.env.API_KEY. AI features will be disabled.");
}

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        equipmentNames: {
            type: Type.ARRAY,
            description: "A list of generic equipment names mentioned in the job description (e.g., 'drill', 'ladder').",
            items: { type: Type.STRING }
        },
        durationDays: {
            type: Type.NUMBER,
            description: "The estimated duration of the job in full days."
        }
    },
    required: ["equipmentNames", "durationDays"]
};

interface GeminiResponse {
    equipmentNames: string[];
    durationDays: number;
}

export const callGemini = async (prompt: string): Promise<GeminiResponse> => {
    if (!ai) {
        throw new Error("Gemini API key is not configured on the server. Please set the API_KEY environment variable.");
    }
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the following job description and extract the required equipment and job duration in days. Job Description: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2,
            },
        });

        const jsonText = response.text ?? '';

        if (!jsonText) {
            console.error("Gemini API returned an empty or invalid response:", response);
            throw new Error("Received an empty response from the AI assistant.");
        }
        
        let parsedResponse: GeminiResponse;

        try {
             parsedResponse = JSON.parse(jsonText);
        } catch (jsonError) {
            console.error("Failed to parse JSON from Gemini response:", jsonText);
            throw new Error("AI response was not in a valid JSON format.");
        }

        if (!parsedResponse || !parsedResponse.equipmentNames || typeof parsedResponse.durationDays !== 'number') {
            console.error("Parsed AI response is missing required fields:", parsedResponse);
            throw new Error("AI response was not in the expected format.");
        }
        
        return parsedResponse;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`AI assistant failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred while contacting the AI assistant.");
    }
};


// --- New Rescheduling Logic ---

const rescheduleResponseSchema = {
    type: Type.OBJECT,
    properties: {
        alternativeSlots: {
            type: Type.ARRAY,
            description: "A list of up to 3 alternative, non-conflicting time slots for the booking. Each slot should have a start and end time in ISO 8601 format.",
            items: {
                type: Type.OBJECT,
                properties: {
                    start: { type: Type.STRING },
                    end: { type: Type.STRING }
                }
            }
        },
        alternativeEquipment: {
            type: Type.ARRAY,
            description: "A list of alternative equipment IDs that are available during the originally requested time and might be suitable for the job.",
             items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.NUMBER },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    imageUrl: { type: Type.STRING }
                }
            }
        }
    },
     required: ["alternativeSlots", "alternativeEquipment"]
};

interface RescheduleParams {
    equipmentId: number;
    start: string;
    end:string;
    jobDescription: string;
    userId: number;
}

export const getRescheduleSuggestions = async (params: RescheduleParams) => {
     if (!ai) {
        throw new Error("Gemini API key is not configured.");
    }

    const { equipmentId, start, end, jobDescription } = params;

    // 1. Get details of the equipment being requested
    const equipmentRes = await db.query('SELECT name, description FROM equipment WHERE id = $1', [equipmentId]);
    if (equipmentRes.rows.length === 0) {
        throw new Error('Equipment not found.');
    }
    const equipmentName = equipmentRes.rows[0].name;

    // 2. Find conflicting reservations for the same equipment
    const conflictsRes = await db.query(
        `SELECT start, "end" FROM reservations 
         WHERE "equipmentId" = $1 AND (start, "end") OVERLAPS ($2, $3)
         ORDER BY start ASC`,
        [equipmentId, start, end]
    );
    const conflicts = conflictsRes.rows;

    // 3. Find alternative equipment available during the requested time
    const alternativesRes = await db.query(
        `SELECT * FROM equipment 
         WHERE id != $1 AND NOT EXISTS (
            SELECT 1 FROM reservations 
            WHERE "equipmentId" = equipment.id AND (start, "end") OVERLAPS ($2, $3)
         ) LIMIT 5`,
        [equipmentId, start, end]
    );
    const alternativeEquipment = alternativesRes.rows;

    const durationMs = new Date(end).getTime() - new Date(start).getTime();

    const prompt = `
        A user is trying to book the equipment "${equipmentName}" from ${start} to ${end} for the job: "${jobDescription}".
        The total duration of the job is approximately ${Math.round(durationMs / (1000 * 60 * 60 * 24))} days.
        
        However, this time is unavailable due to the following existing bookings for this equipment:
        ${conflicts.map(c => `- From ${c.start.toISOString()} to ${c.end.toISOString()}`).join('\n')}

        TASK:
        1. Suggest up to 3 alternative, non-conflicting time slots for the original equipment ("${equipmentName}"). The suggested slots should be for the same duration as the original request and should start after the user's original start time.
        2. From the list of fully available alternative equipment provided below, suggest any that would be a good fit for the user's job description.

        AVAILABLE ALTERNATIVE EQUIPMENT:
        ${alternativeEquipment.map(e => `- ID: ${e.id}, Name: "${e.name}", Description: "${e.description}"`).join('\n')}

        Return your answer in the specified JSON format. The alternativeEquipment array should only contain items from the provided list that you recommend.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: rescheduleResponseSchema,
                temperature: 0.3,
            },
        });

        const jsonText = response.text ?? '';
        if (!jsonText) throw new Error("Received an empty response from the AI assistant.");

        const suggestions = JSON.parse(jsonText);

        const validatedSlots = [];
        if (suggestions.alternativeSlots && Array.isArray(suggestions.alternativeSlots)) {
            for (const slot of suggestions.alternativeSlots) {
                if (slot && typeof slot.start === 'string' && typeof slot.end === 'string') {
                     try {
                        if (new Date(slot.start) >= new Date(slot.end)) continue;

                        const { rows: conflicts } = await db.query(
                            `SELECT 1 FROM reservations WHERE "equipmentId" = $1 AND (start, "end") OVERLAPS ($2, $3) LIMIT 1`,
                            [equipmentId, slot.start, slot.end]
                        );
                        if (conflicts.length === 0) {
                            validatedSlots.push(slot);
                        }
                    } catch (e) {
                         console.error(`Invalid date format in AI suggestion: ${JSON.stringify(slot)}`, e);
                    }
                }
            }
        }

        const validatedEquipment = [];
        if (suggestions.alternativeEquipment && Array.isArray(suggestions.alternativeEquipment)) {
            for (const item of suggestions.alternativeEquipment) {
                 if (item && typeof item.id === 'number') {
                     const { rows: conflicts } = await db.query(
                        `SELECT 1 FROM reservations WHERE "equipmentId" = $1 AND (start, "end") OVERLAPS ($2, $3) LIMIT 1`,
                        [item.id, start, end] // Check against the original requested time
                    );
                    if (conflicts.length === 0) {
                        validatedEquipment.push(item);
                    }
                }
            }
        }

        return {
            alternativeSlots: validatedSlots,
            alternativeEquipment: validatedEquipment
        };

    } catch (error) {
        console.error("Error calling Gemini for rescheduling:", error);
        throw new Error("Failed to get rescheduling suggestions from the AI assistant.");
    }
};
