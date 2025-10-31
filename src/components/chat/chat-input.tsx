"use client";

import { useState, type FormEvent, useRef } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

type ChatInputProps = {
  onSendMessage: (message: string, imageUrl?: string) => void;
  isLoading: boolean;
};

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<{ url: string; file: File } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage({ url: e.target?.result as string, file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !image) || isLoading) return;
    onSendMessage(message, image?.url);
    setMessage("");
    setImage(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 border-t bg-card">
        <div className="relative">
          {image && (
            <div className="relative mb-2 w-24 h-24 rounded-md overflow-hidden border">
              <Image src={image.url} alt="Selected image" fill className="object-cover" />
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/50 hover:bg-black/75 text-white"
                onClick={() => {
                    setImage(null);
                    if(fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-start gap-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              aria-label="Attach image"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
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
            <Button type="submit" size="icon" disabled={isLoading || (!message.trim() && !image)} aria-label="Send message">
                <Send className="h-5 w-5" />
                <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
    </div>
  );
}
