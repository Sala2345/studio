import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Gem, Brush, PencilRuler, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-3xl h-[90vh] max-h-[800px] flex flex-col shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b p-4 shrink-0">
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <Gem className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl font-bold text-foreground">SpeedPro AI</CardTitle>
            </div>
            <div className="flex items-center gap-2">
                <Link href="/designer" passHref>
                    <Button variant="outline">
                        <Brush className="mr-2 h-4 w-4" />
                        AI Designer
                    </Button>
                </Link>
                 <Link href="/hire-a-designer" passHref>
                    <Button variant="outline">
                        <PencilRuler className="mr-2 h-4 w-4" />
                        Hire a Designer
                    </Button>
                </Link>
                <Link href="/design-request" passHref>
                    <Button variant="outline">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Design Request
                    </Button>
                </Link>
            </div>
        </CardHeader>
        <ChatInterface />
      </Card>
    </main>
  );
}
