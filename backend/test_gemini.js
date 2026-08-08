require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
  const prompt = `You are a YouTube SEO expert. Respond ONLY with valid JSON (no markdown, no code fences):
{"title":"catchy title max 80 chars","description":"2-3 sentence description","tags":["tag1","tag2","tag3","tag4","tag5"]}
For a cooking video showing pasta being made.`;
  
  const r = await model.generateContent(prompt);
  const raw = r.response.text().trim();
  console.log('Raw response:', raw);
  const jsonText = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();
  const parsed = JSON.parse(jsonText);
  console.log('\n✅ Title:', parsed.title);
  console.log('✅ Description:', parsed.description);
  console.log('✅ Tags:', parsed.tags);
}
test().catch(e => console.error('❌ Error:', e.message));
