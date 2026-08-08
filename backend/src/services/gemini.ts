import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Models in order of preference (confirmed working first)
const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

export interface AISuggestions {
  title: string;
  description: string;
  tags: string[];
  transcript?: string;
}

/**
 * Step 1: Transcribe audio from video using Gemini.
 * Sends the audio file inline (base64) and gets a transcript.
 */
export const transcribeAudio = async (audioPath: string): Promise<string | null> => {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return null;
    }
    if (!fs.existsSync(audioPath)) {
      console.warn('Audio file not found for transcription:', audioPath);
      return null;
    }

    const audioData = fs.readFileSync(audioPath);
    const base64Audio = audioData.toString('base64');

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          'Please transcribe the speech in this audio. Return ONLY the transcript text, nothing else. If there is no speech or it is unclear, return "NO_SPEECH".',
          { inlineData: { mimeType: 'audio/aac', data: base64Audio } },
        ]);
        const transcript = result.response.text().trim();
        console.log(`Transcript extracted using ${modelName}: "${transcript.substring(0, 80)}..."`);
        return transcript === 'NO_SPEECH' ? null : transcript;
      } catch (modelErr: any) {
        console.warn(`Transcription failed with ${modelName}:`, modelErr.message?.substring(0, 80));
      }
    }
    return null;
  } catch (err) {
    console.error('Transcription error:', err);
    return null;
  }
};

/**
 * Step 2: Generate title, description, and tags from transcript.
 * Falls back to thumbnail-based analysis if no transcript is available.
 */
export const generateVideoMetadata = async (
  options: {
    transcript?: string | null;
    thumbnailPath?: string;
    userTitle?: string;
    userDescription?: string;
  }
): Promise<AISuggestions | null> => {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('GEMINI_API_KEY not configured, skipping AI metadata generation');
      return null;
    }

    const { transcript, thumbnailPath, userTitle, userDescription } = options;

    // Build context
    let contextParts: any[] = [];
    let contextText = '';

    if (transcript && transcript.length > 10) {
      // PRIMARY: Use transcript for accurate metadata
      contextText = `Video transcript:\n"${transcript.substring(0, 3000)}"`;
    } else if (thumbnailPath && fs.existsSync(thumbnailPath)) {
      // FALLBACK: Use thumbnail image
      const imageData = fs.readFileSync(thumbnailPath);
      contextParts.push({ inlineData: { mimeType: 'image/png', data: imageData.toString('base64') } });
      contextText = 'Analyze this video thumbnail image to understand what the video is about.';
    } else if (userTitle) {
      // LAST RESORT: Use filename/title as hint
      contextText = `The video is titled: "${userTitle}"`;
    } else {
      console.warn('No context available for AI metadata generation');
      return null;
    }

    const userContext: string[] = [];
    if (userTitle && userTitle !== 'Untitled Video') userContext.push(`Uploader's title: "${userTitle}"`);
    if (userDescription) userContext.push(`Uploader's description: "${userDescription}"`);

    const prompt = `You are a YouTube SEO expert. Based on the following video content, generate optimized metadata.

${contextText}
${userContext.length > 0 ? '\nAdditional context:\n' + userContext.join('\n') : ''}

Respond ONLY with this exact JSON format (no markdown, no code fences, no extra text):
{"title":"engaging title max 80 chars","description":"compelling 2-4 sentence description","tags":["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8"]}

Rules:
- Title must be catchy, SEO-optimized, based on actual content
- Description must be informative and engage viewers  
- Tags must be relevant search keywords (no # symbols)
- All in the same language as the transcript`;

    const promptParts: any[] = [prompt, ...contextParts];

    let lastError: Error | null = null;

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(promptParts);

        const raw = result.response.text().trim();
        // Strip any accidental markdown fences
        const jsonText = raw
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const parsed = JSON.parse(jsonText) as AISuggestions;

        if (!parsed.title || !parsed.description || !Array.isArray(parsed.tags)) {
          throw new Error('Invalid AI response structure');
        }

        console.log(`✅ AI metadata generated using ${modelName}:`, parsed.title);
        return {
          title: String(parsed.title).slice(0, 100),
          description: String(parsed.description).slice(0, 1000),
          tags: parsed.tags
            .map(t => String(t).toLowerCase().trim().replace(/^#+/, ''))
            .filter(t => t.length > 0)
            .slice(0, 10),
          transcript: transcript || undefined,
        };
      } catch (modelErr: any) {
        console.warn(`Model ${modelName} failed:`, modelErr.message?.substring(0, 100));
        lastError = modelErr;
      }
    }

    console.error('All Gemini models failed. Last error:', lastError?.message);
    return null;
  } catch (err) {
    console.error('AI metadata generation error:', err);
    return null;
  }
};
