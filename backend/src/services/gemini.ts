import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not set, skipping AI metadata generation');
      return null;
    }

    if (!fs.existsSync(thumbnailPath)) {
      console.warn('Thumbnail not found for AI analysis:', thumbnailPath);
      return null;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const imageData = fs.readFileSync(thumbnailPath);
    const base64Image = imageData.toString('base64');
    const mimeType = 'image/png';

    const userContext = userTitle && userTitle !== 'Untitled Video'
      ? `The uploader named this video: "${userTitle}". Use this as context.`
      : '';

    const prompt = `You are a YouTube/video platform SEO expert. Analyze this video thumbnail image and generate metadata.

${userContext}

Respond ONLY with valid JSON in exactly this format (no markdown, no extra text):
{
  "title": "engaging video title (max 80 chars)",
  "description": "compelling description of the video content (2-3 sentences, max 300 chars)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Rules:
- Title should be catchy and descriptive based on what you see in the thumbnail
- Description should explain what the video is about
- Tags should be relevant keywords (5-8 tags)
- All text in English
- No hashtags in tags array, just plain words/phrases`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
    ]);

    const responseText = result.response.text().trim();
    
    // Strip markdown code blocks if present
    const jsonText = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(jsonText) as AISuggestions;
    
    // Validate structure
    if (!parsed.title || !parsed.description || !Array.isArray(parsed.tags)) {
      throw new Error('Invalid AI response structure');
    }

    // Sanitize
    return {
      title: String(parsed.title).slice(0, 100),
      description: String(parsed.description).slice(0, 500),
      tags: parsed.tags.map(t => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 10),
    };
  } catch (err) {
    console.error('Gemini AI metadata generation failed:', err);
    return null;
  }
};
