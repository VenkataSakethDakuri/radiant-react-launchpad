import { Button } from "@/components/ui/button";
import { Mic, StopCircle } from "lucide-react";

interface VoiceRecorderProps {
  isRecording: boolean;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const VoiceRecorder = ({
  isRecording,
  isProcessing,
  onStartRecording,
  onStopRecording,
}: VoiceRecorderProps) => {
  return (
    <Button
      variant={isRecording ? "destructive" : "secondary"}
      onClick={isRecording ? onStopRecording : onStartRecording}
      disabled={isProcessing}
    >
      {isRecording ? (
        <StopCircle className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};