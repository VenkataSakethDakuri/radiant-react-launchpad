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
    const { userInput, userId } = await req.json();
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch previous conversations
    const { data: previousConversations } = await supabaseClient
      .from('conversations')
      .select('user_input, bot_response')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Create context from previous conversations
    const conversationHistory = previousConversations?.map(conv => 
      `User: ${conv.user_input}\nAssistant: ${conv.bot_response}`
    ).join('\n') || '';

    // Generate AI response
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
            content: 'You are a helpful AI journaling assistant. Use previous conversations to personalize responses and help users reflect on their thoughts and feelings.'
          },
          { 
            role: 'system', 
            content: `Previous conversations:\n${conversationHistory}`
          },
          { role: 'user', content: userInput }
        ],
      }),
    });

    const data = await response.json();
    const botResponse = data.choices[0].message.content;

    // Store conversation in database
    await supabaseClient
      .from('conversations')
      .insert({
        user_id: userId,
        user_input: userInput,
        bot_response: botResponse,
      });

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