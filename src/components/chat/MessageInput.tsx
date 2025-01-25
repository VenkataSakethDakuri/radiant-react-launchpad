import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface MessageInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  handleSendMessage: () => void;
  isProcessing: boolean;
  isRecording: boolean;
}

export const MessageInput = ({
  inputText,
  setInputText,
  handleSendMessage,
  isProcessing,
  isRecording,
}: MessageInputProps) => {
  return (
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
    </div>
  );
};