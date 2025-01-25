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

    // Fetch previous messages for context
    console.log('Fetching chat history');
    const { data: messages, error: messagesError } = await supabaseClient
      .from('messages')
      .select('role, content')
      .eq('conversation_id', chatId)
      .order('created_at', { ascending: true })
      .limit(10); // Limit to last 10 messages for context

    if (messagesError) {
      throw messagesError;
    }

    // Format messages for OpenAI
    const messageHistory = messages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // Add current user message
    messageHistory.push({ role: 'user', content: userInput });

    // Generate AI response with context
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
            content: 'You are a helpful AI journaling assistant. Help users reflect on their thoughts and feelings. Use previous context to provide more personalized and relevant responses. Keep responses concise but meaningful.'
          },
          ...messageHistory
        ],
        max_tokens: 150, // Limit response length for faster processing
        temperature: 0.7,
        presence_penalty: 0.6, // Encourage the model to talk about new topics
        frequency_penalty: 0.6, // Reduce repetition
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
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});