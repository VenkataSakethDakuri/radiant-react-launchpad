import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received text-to-speech request');
    const { text, speed = 1.2, model = 'tts-1' } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    // Limit text length to prevent stack overflow
    const maxLength = 4096; // OpenAI's recommended max length
    const truncatedText = text.length > maxLength 
      ? text.slice(0, maxLength) + '...' 
      : text;

    console.log('Making request to OpenAI API with text length:', truncatedText.length);
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: truncatedText,
        voice: 'alloy',
        response_format: 'mp3',
        speed,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to generate speech');
    }

    console.log('Successfully received audio from OpenAI');
    
    // Get the audio data as an ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Convert to base64 more efficiently using a typed array
    const uint8Array = new Uint8Array(arrayBuffer);
    let base64Audio = '';
    const chunkSize = 32768; // Process in chunks to prevent stack overflow
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      base64Audio += String.fromCharCode.apply(null, chunk);
    }
    
    base64Audio = btoa(base64Audio);
    console.log('Successfully converted audio to base64');

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});