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
      const result = await model.generateContent(messages[0].content);
      const response = await result.response;
      const text = response.text();
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
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

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
