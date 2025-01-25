import { supabase } from "@/integrations/supabase/client";

export const fetchMessages = async (chatId: string) => {
  console.log('Fetching messages for chat:', chatId);
  
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', chatId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return messages.map(msg => ({
    role: msg.role as "user" | "assistant",
    content: msg.content
  }));
};

export const sendMessage = async (chatId: string, content: string, userId: string) => {
  console.log('Sending message:', { chatId, content });
  
  // Save user message
  const { error: userMessageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: chatId,
      role: 'user',
      content: content
    });

  if (userMessageError) throw userMessageError;
  
  // Get AI response with optimized settings
  const { data: chatData, error: chatError } = await supabase.functions.invoke("chat", {
    body: { 
      userInput: content, 
      userId, 
      chatId
    },
  });

  if (chatError) throw chatError;

  // Convert response to speech with optimized settings
  const { data: voiceData, error: voiceError } = await supabase.functions.invoke("text-to-speech", {
    body: { 
      text: chatData.botResponse,
      speed: 1.3, // Faster speech
      model: 'tts-1' // Use standard model for better performance
    },
  });

  if (voiceError) throw voiceError;

  return chatData.botResponse;
};