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
  // Save user message
  await supabase
    .from('messages')
    .insert({
      conversation_id: chatId,
      role: 'user',
      content: content
    });
  
  // Get AI response with optimized settings
  const { data: chatData, error: chatError } = await supabase.functions.invoke("chat", {
    body: { 
      userInput: content, 
      userId, 
      chatId,
      settings: {
        temperature: 0.7,
        max_tokens: 150, // Limit response length for faster processing
        presence_penalty: 0.6,
        frequency_penalty: 0.6
      }
    },
  });

  if (chatError) throw chatError;

  // Save assistant message
  await supabase
    .from('messages')
    .insert({
      conversation_id: chatId,
      role: 'assistant',
      content: chatData.botResponse
    });

  return chatData.botResponse;
};