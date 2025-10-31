"use client";

import { useState } from "react";
import { chat } from "@/ai/flows/chat";
import { useToast } from "@/hooks/use-toast";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";

export type Message = {
  role: "user" | "model";
  content: string;
  imageUrl?: string;
};

const initialMessages: Message[] = [
    {
      role: "model",
      content: "Hello! I am Gemini, your friendly AI assistant. How can I help you today? You can also send me images.",
    },
  ];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (messageContent: string, imageUrl?: string) => {
    setIsLoading(true);
    const newMessages: Message[] = [...messages, { role: "user", content: messageContent, imageUrl }];
    setMessages(newMessages);

    try {
      const historyForApi = newMessages.slice(0, -1).map(msg => ({
        role: msg.role,
        content: [{ text: msg.content }]
      }));

      const result = await chat({ history: historyForApi, message: messageContent, imageUrl });
      
      setMessages([
        ...newMessages,
        { role: "model", content: result.response },
      ]);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
      setMessages(prev => [...prev, {role: 'model', content: 'Sorry, I encountered an error. Please try again.'}]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ChatMessages messages={messages} isLoading={isLoading} />
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
