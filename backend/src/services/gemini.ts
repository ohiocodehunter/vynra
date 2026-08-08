import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Try models in order of preference (cheapest/fastest first)
const GEMINI_MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];

export interface AISuggestions {
  title: string;
  description: string;
  tags: string[];
}

/**
 * Analyze a video thumbnail using Gemini Vision and generate
 * a suggested title, description, and tags.
 */
export const generateVideoMetadata = async (
  thumbnailPath: string,
  userTitle?: string
): Promise<AISuggestions | null> => {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('GEMINI_API_KEY not configured, skipping AI metadata generation');
      return null;
    }

    if (!fs.existsSync(thumbnailPath)) {
      console.warn('Thumbnail not found for AI analysis:', thumbnailPath);
      return null;
    }

    const userContext = userTitle && userTitle !== 'Untitled Video'
      ? `The uploader named this video: "${userTitle}". Use this as context.`
      : '';

    const prompt = `You are a YouTube/video platform SEO expert. Analyze this video thumbnail image and generate metadata.

${userContext}

Respond ONLY with valid JSON in exactly this format (no markdown, no extra text, no code blocks):
{"title":"engaging video title max 80 chars","description":"compelling 2-3 sentence description max 300 chars","tags":["tag1","tag2","tag3","tag4","tag5"]}`;

    const imageData = fs.readFileSync(thumbnailPath);
    const base64Image = imageData.toString('base64');

    let lastError: Error | null = null;

    // Try each model in sequence until one works
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          prompt,
          { inlineData: { mimeType: 'image/png', data: base64Image } },
        ]);

        const raw = result.response.text().trim();
        // Strip any markdown code fences
        const jsonText = raw
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const parsed = JSON.parse(jsonText) as AISuggestions;

        if (!parsed.title || !parsed.description || !Array.isArray(parsed.tags)) {
          throw new Error('Invalid AI response structure');
        }

        console.log(`AI metadata generated using model: ${modelName}`);
        return {
          title: String(parsed.title).slice(0, 100),
          description: String(parsed.description).slice(0, 500),
          tags: parsed.tags.map(t => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 10),
        };
      } catch (modelErr: any) {
        console.warn(`Model ${modelName} failed:`, modelErr.message?.substring(0, 100));
        lastError = modelErr;
        // Continue to next model
      }
    }

    console.error('All Gemini models failed. Last error:', lastError?.message);
    return null;
  } catch (err) {
    console.error('Gemini AI metadata generation failed:', err);
    return null;
  }
};
