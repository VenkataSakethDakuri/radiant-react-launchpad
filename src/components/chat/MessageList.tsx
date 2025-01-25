import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export const MessageList = ({ messages }: { messages: Message[] }) => {
  return (
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
  );
};