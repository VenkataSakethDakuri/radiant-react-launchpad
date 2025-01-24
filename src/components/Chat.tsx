import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mic, Send, StopCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const Chat = () => {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get('chat');
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

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
      setMessages((prev) => [...prev, { role: "user", content: userInput }]);
      
      // Get AI response
      const { data: chatData, error: chatError } = await supabase.functions.invoke("chat", {
        body: { userInput, userId: user?.id, chatId },
      });

      if (chatError) throw chatError;

      setMessages((prev) => [...prev, { role: "assistant", content: chatData.botResponse }]);
      
      // Convert response to speech
      const { data: voiceData, error: voiceError } = await supabase.functions.invoke("text-to-speech", {
        body: { text: chatData.botResponse },
      });

      if (voiceError) throw voiceError;

      // Play audio response
      const audio = new Audio(`data:audio/mp3;base64,${voiceData.audioContent}`);
      await audio.play();

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please create a new chat first",
      });
      return;
    }

    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setMessages((prev) => [...prev, { role: "user", content: inputText }]);
      
      // Get AI response
      const { data: chatData, error: chatError } = await supabase.functions.invoke("chat", {
        body: { userInput: inputText, userId: user?.id, chatId },
      });

      if (chatError) throw chatError;

      setMessages((prev) => [...prev, { role: "assistant", content: chatData.botResponse }]);
      
      // Convert response to speech
      const { data: voiceData, error: voiceError } = await supabase.functions.invoke("text-to-speech", {
        body: { text: chatData.botResponse },
      });

      if (voiceError) throw voiceError;

      // Play audio response
      const audio = new Audio(`data:audio/mp3;base64,${voiceData.audioContent}`);
      await audio.play();

      setInputText("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-background border rounded-lg shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground ml-4"
                  : "bg-muted mr-4"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isProcessing || isRecording}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isProcessing || isRecording || !inputText.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            variant={isRecording ? "destructive" : "secondary"}
            onClick={isRecording ? handleStopRecording : startRecording}
            disabled={isProcessing}
          >
            {isRecording ? (
              <StopCircle className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};