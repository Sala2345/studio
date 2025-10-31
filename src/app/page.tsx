import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Gem } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-3xl h-[90vh] max-h-[800px] flex flex-col shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-4 border-b p-4 shrink-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
             <Gem className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl font-bold text-foreground">Gemini Chat</CardTitle>
        </CardHeader>
        <ChatInterface />
      </Card>
    </main>
  );
}
