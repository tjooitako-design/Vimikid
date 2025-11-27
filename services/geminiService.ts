import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; // Fallback for safety, though env is expected
const ai = new GoogleGenAI({ apiKey });

export const generateEncouragement = async (
  score: number,
  timeSeconds: number,
  language: Language,
  username: string
): Promise<string> => {
  
  if (!apiKey) {
    console.warn("No API Key found, skipping AI generation.");
    return "Great job! Keep learning!";
  }

  const langName = language === 'ms' ? 'Malay' : language === 'zh' ? 'Mandarin Chinese' : 'English';
  
  // Prompt engineering for a kid-friendly response
  const prompt = `
    You are VimiKid, a friendly and cheerful AI tutor for kids.
    A kid named ${username} just finished a multiplication quiz.
    
    Stats:
    - Score: ${score}/10
    - Time: ${timeSeconds} seconds
    - Language: ${langName}

    Generate a short, very encouraging, and funny message for them in ${langName}.
    If the score is low, be supportive. If high, be amazed.
    Keep it under 30 words.
    Use simple words suitable for a 7-10 year old.
    Do not use markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "You did great!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "You are a math star! (AI offline)";
  }
};
