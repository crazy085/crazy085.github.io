import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface MessageInputProps {
  ws: WebSocket | null;
  currentUserId: string;
  receiverId: string;
}

export function MessageInput({ ws, currentUserId, receiverId }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(
      JSON.stringify({
        type: "message",
        senderId: currentUserId,
        receiverId,
        content: message.trim(),
      })
    );

    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-end gap-2">
        <Textarea
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="resize-none min-h-12 max-h-32 text-base rounded-3xl"
          rows={1}
          data-testid="input-message"
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim()}
          size="icon"
          className="h-12 w-12 rounded-full flex-shrink-0"
          data-testid="button-send"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
