import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages, language } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured.' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a helpful, authoritative, and unbiased AI assistant for the Indian Voter Companion app. 
    Your goal is to guide Indian citizens through the electoral process, providing accurate information about voter registration, 
    polling booths, EVMs, VVPATs, and election dates based on the Election Commission of India guidelines. 
    You must always respond in the language requested by the user, which is currently set to: ${language}.
    Keep your answers concise, clear, and easy to understand. Do not endorse any political party or candidate.`;

    // Format history for Gemini
    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      {
        role: "model",
        parts: [{ text: "Understood. I will act as the Indian Voter Companion and assist the user in their requested language." }]
      }
    ];

    for (const msg of messages) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });

    return NextResponse.json({ message: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response.' },
      { status: 500 }
    );
  }
}
