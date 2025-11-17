import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function MyWorksPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>My Works</CardTitle>
          <CardDescription>This is the page for "My Works". Content can be added here later.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Welcome to your works page!</p>
        </CardContent>
      </Card>
    </div>
  );
}
