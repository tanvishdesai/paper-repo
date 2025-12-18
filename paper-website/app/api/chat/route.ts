import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  try {
    // Create the model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // For the first message, use generateContent
    if (messages.length === 1) {
      const systemPrompt = `
      You are a helpful AI tutor for students preparing for exams.
      Your goal is to explain the solution to a question in a clear, novice-friendly way.
      
      CRITICAL: You must respond in valid JSON format ONLY. Do not wrap the JSON in markdown code blocks.
      You can use markdown formatting (bold, italics, inline code, latex) within the string values.
      DO NOT use HTML tags (like <ul>, <li>, <b>, etc.). Use standard Markdown for lists (- item) and formatting.
      
      The JSON object must have this structure:
      {
        "explanation": "A concise summary of the explanation (2-3 sentences max).",
        "steps": ["Step 1 explanation", "Step 2 explanation", "Step 3 explanation"],
        "key_concepts": ["Concept 1", "Concept 2"]
      }
      
      If the user's message is just a request for help, treat it as "Please explain this question".
      `;

      const fullPrompt = `${systemPrompt}\n\nUser Question: ${messages[0].content}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      let text = response.text();

      // Clean up potential markdown formatting if model ignores instruction
      text = text.replace(/```json\n?|\n?```/g, "").trim();

      return NextResponse.json({ response: text });
    }

    // For follow-up messages, use chat
    const chat = model.startChat({
      history: messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    });

    // Send the latest message
    const result = await chat.sendMessage(messages[messages.length - 1].content);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Gemini API error:', error);

    // Try fallback model if the first one fails
    try {
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      if (messages.length === 1) {
        const result = await fallbackModel.generateContent(messages[0].content);
        const response = await result.response;
        const text = response.text();
        return NextResponse.json({ response: text });
      }

      const chat = fallbackModel.startChat({
        history: messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
      });

      const result = await chat.sendMessage(messages[messages.length - 1].content);
      const response = await result.response;
      const text = response.text();

      return NextResponse.json({ response: text });
    } catch (fallbackError) {
      console.error('Fallback Gemini API error:', fallbackError);
      return NextResponse.json(
        { error: 'Failed to get response from Gemini. Please check your API key and try again.' },
        { status: 500 }
      );
    }
  }
}
