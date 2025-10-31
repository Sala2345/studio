"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatAvatar } from "./chat-avatar";
import type { Message } from "./chat-interface";

type ChatMessagesProps = {
  messages: Message[];
  isLoading: boolean;
};

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea className="flex-1" viewportRef={viewportRef}>
      <div className="p-4 sm:p-6 space-y-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-4",
              message.role === "user" && "justify-end"
            )}
          >
            {message.role === "model" && <ChatAvatar role="model" />}
            <div
              className={cn(
                "rounded-lg p-3 max-w-[80%] break-words",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === "user" && <ChatAvatar role="user" />}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-4">
            <ChatAvatar role="model" />
            <div className="rounded-lg p-3 bg-card border">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse delay-0"></span>
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse delay-200"></span>
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse delay-400"></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
