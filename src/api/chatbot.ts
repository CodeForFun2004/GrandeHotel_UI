import instance from './axios';

export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatHistoryItem = {
  role: ChatRole;
  content: string;
};

export type ChatbotRequest = {
  prompt: string;
  history?: ChatHistoryItem[];
};

export type ChatbotResponse = {
  reply: string;
};

export async function askChatbot(prompt: string, history: ChatHistoryItem[] = []): Promise<string> {
  const payload: ChatbotRequest = { prompt, history };
  const res = await instance.post<ChatbotResponse>('/chatbot', payload);
  // Fallback: if API returns a different shape, try some common fields
  const data = res.data as any;
  return (
    (data && (data.reply || data.answer || data.message)) ?? 'Sorry, no reply received.'
  );
}
