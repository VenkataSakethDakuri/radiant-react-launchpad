import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received chat request');
    const { userInput, userId, chatId } = await req.json();
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify chat belongs to user
    const { data: chat, error: chatError } = await supabaseClient
      .from('conversations')
      .select('id')
      .eq('id', chatId)
      .eq('user_id', userId)
      .single();

    if (chatError || !chat) {
      throw new Error('Invalid chat ID');
    }

    // Fetch all user's messages across all conversations for context
    console.log('Fetching user chat history across all conversations');
    const { data: allMessages, error: allMessagesError } = await supabaseClient
      .from('messages')
      .select('role, content, conversation_id')
      .in('conversation_id', (
        await supabaseClient
          .from('conversations')
          .select('id')
          .eq('user_id', userId)
      ).data?.map(c => c.id) || [])
      .order('created_at', { ascending: true })
      .limit(20); // Limit to last 20 messages for broader context

    if (allMessagesError) {
      throw allMessagesError;
    }

    // Format messages for OpenAI, including conversation context
    const messageHistory = allMessages?.map(msg => ({
      role: msg.role,
      content: `${msg.content}${msg.conversation_id === chatId ? ' (current conversation)' : ' (from previous conversation)'}`
    })) || [];

    // Add current user message
    messageHistory.push({ role: 'user', content: userInput });

    // Generate AI response with enhanced context
    console.log('Making request to OpenAI API');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful AI journaling assistant. Help users reflect on their thoughts and feelings. Use context from all previous conversations to provide highly personalized and relevant responses. When referencing previous conversations, be natural and conversational. Keep responses concise but meaningful.'
          },
          ...messageHistory
        ],
        max_tokens: 150,
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.6,
      }),
    });

    const data = await response.json();
    const botResponse = data.choices[0].message.content;

    // Store the assistant's response
    const { error: insertError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: chatId,
        role: 'assistant',
        content: botResponse
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(JSON.stringify({ botResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});