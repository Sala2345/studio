"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
};

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    onSendMessage(message);
    setMessage("");
  };

  return (
    <div className="p-4 border-t bg-card">
        <form onSubmit={handleSubmit} className="flex items-start gap-4">
        <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 resize-none max-h-36"
            rows={1}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as unknown as FormEvent);
                }
            }}
            disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading || !message.trim()} aria-label="Send message">
            <Send className="h-5 w-5" />
            <span className="sr-only">Send</span>
        </Button>
        </form>
    </div>
  );
}
