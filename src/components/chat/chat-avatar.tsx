"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bot } from "lucide-react";

type ChatAvatarProps = {
  role: 'user' | 'model';
};

export function ChatAvatar({ role }: ChatAvatarProps) {
  if (role === 'user') {
    return (
      <Avatar className="h-9 w-9">
        <AvatarFallback className="bg-secondary">
          <User className="h-5 w-5 text-secondary-foreground" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className="h-9 w-9">
      <AvatarFallback className="bg-primary text-primary-foreground">
        <Bot className="h-5 w-5" />
      </AvatarFallback>
    </Avatar>
  );
}
