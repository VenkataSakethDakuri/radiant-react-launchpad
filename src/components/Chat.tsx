import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { MessageList } from "./chat/MessageList";
import { MessageInput } from "./chat/MessageInput";
import { VoiceRecorder } from "./chat/VoiceRecorder";
import { EmptyState } from "./chat/EmptyState";
import { fetchMessages, sendMessage } from "@/utils/chatUtils";
import type { Message } from "@/types/chat";

export const Chat = () => {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get('chat');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => chatId ? fetchMessages(chatId) : Promise.resolve([]),
    enabled: !!chatId
  });

  const handleSendMessage = async () => {
    if (!chatId || !inputText.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please create a new chat first",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const botResponse = await sendMessage(chatId, inputText, user.id);
      
      // Play audio response with optimized settings
      const { data: voiceData, error: voiceError } = await supabase.functions.invoke("text-to-speech", {
        body: { 
          text: botResponse,
          speed: 1.3, // Increase speed slightly
          model: 'tts-1-hd' // Use higher quality model
        },
      });

      if (voiceError) throw voiceError;

      const audio = new Audio(`data:audio/mp3;base64,${voiceData.audioContent}`);
      await audio.play();

      setInputText("");
      refetchMessages();
    } catch (error) {
      console.error('Error in text chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not access microphone",
      });
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<string>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          resolve(base64Audio);
        };
      };

      mediaRecorderRef.current!.stop();
      setIsRecording(false);
    });
  };

  const handleStopRecording = async () => {
    if (!chatId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please create a new chat first",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const base64Audio = await stopRecording();
      const { data: { user } } = await supabase.auth.getUser();
      
      // Convert speech to text
      const { data: speechData, error: speechError } = await supabase.functions.invoke("speech-to-text", {
        body: { audio: base64Audio },
      });

      if (speechError) throw speechError;
      
      // Send message to chat
      const userInput = speechData.text;
      await supabase
        .from('messages')
        .insert({
          conversation_id: chatId,
          role: 'user',
          content: userInput
        });

      // Get AI response
      const { data: chatData, error: chatError } = await supabase.functions.invoke("chat", {
        body: { userInput, userId: user?.id, chatId },
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

      // Convert response to speech
      const { data: voiceData, error: voiceError } = await supabase.functions.invoke("text-to-speech", {
        body: { text: chatData.botResponse },
      });

      if (voiceError) throw voiceError;

      // Play audio response
      const audio = new Audio(`data:audio/mp3;base64,${voiceData.audioContent}`);
      await audio.play();

      refetchMessages();
    } catch (error) {
      console.error('Error in voice chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!chatId) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto bg-background border rounded-lg shadow-sm">
      <MessageList messages={messages} />
      <div className="border-t p-4">
        <div className="flex gap-2 w-full">
          <MessageInput
            inputText={inputText}
            setInputText={setInputText}
            handleSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            isRecording={isRecording}
          />
          <VoiceRecorder
            isRecording={isRecording}
            isProcessing={isProcessing}
            onStartRecording={startRecording}
            onStopRecording={handleStopRecording}
          />
        </div>
      </div>
    </div>
  );
};
