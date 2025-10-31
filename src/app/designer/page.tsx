"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { generateDesign } from "@/ai/flows/generate-design";
import { Loader2, Download, Pencil } from "lucide-react";

export default function DesignerPage() {
  const [prompt, setPrompt] = useState("");
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");

  const { toast } = useToast();

  const handleBaseImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBaseImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateClick = async (isEdit: boolean = false) => {
    const currentPrompt = isEdit ? editPrompt : prompt;
    const imageForGeneration = isEdit ? generatedDesign : baseImage;

    if (!currentPrompt) {
      toast({
        variant: "destructive",
        title: "Prompt is required",
        description: "Please enter a prompt to generate a design.",
      });
      return;
    }
    setIsLoading(true);
    if (!isEdit) {
      setGeneratedDesign(null);
    }

    try {
      const result = await generateDesign({ 
        prompt: currentPrompt, 
        baseImage: imageForGeneration || undefined 
      });
      setGeneratedDesign(result.imageUrl);
      setIsEditing(false); // Exit editing mode after successful generation
      setEditPrompt(""); // Clear edit prompt
    } catch (error) {
      console.error("Design generation failed:", error);
      toast({
        variant: "destructive",
        title: "Design Generation Failed",
        description: "There was an error generating the design. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = (dataUrl: string | null, filename: string) => {
    if (dataUrl) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  return (
    <div className="p-4 sm:p-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>AI Designer</CardTitle>
          <CardDescription>
            Create a unique design with AI. Describe what you want, and optionally provide a base image to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Controls */}
            <div className="space-y-6">
                <div>
                    <Label htmlFor="prompt">Prompt</Label>
                    <Textarea
                        id="prompt"
                        placeholder="e.g., A watercolor painting of a majestic lion"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>

                <div>
                    <Label htmlFor="image">Base Image (Optional)</Label>
                    <Input id="image" type="file" accept="image/*" onChange={handleBaseImageChange} />
                </div>
                
                {baseImage && (
                    <div className="relative w-full max-w-sm aspect-square rounded-md overflow-hidden border">
                        <Image src={baseImage} alt="Base image" fill className="object-contain" />
                    </div>
                )}

                <Button onClick={() => handleGenerateClick(false)} disabled={isLoading} className="w-full">
                    {isLoading && !isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Design
                </Button>
            </div>

            {/* Right Column: Output & Editing */}
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-border bg-card p-8 min-h-[400px]">
                {isLoading && (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-12 w-12 animate-spin" />
                      <p>Generating your masterpiece...</p>
                  </div>
                )}
                {!isLoading && generatedDesign && (
                <>
                    <div className="relative w-full aspect-square rounded-md overflow-hidden border">
                        <Image src={generatedDesign} alt="Generated design" fill className="object-contain" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <Button onClick={() => handleDownload(generatedDesign, 'generated-design.png')} variant="secondary">
                            <Download className="mr-2"/> Download
                        </Button>
                        <Button onClick={startEditing} variant="outline">
                            <Pencil className="mr-2" /> Edit Image
                        </Button>
                    </div>
                </>
                )}
                {!isLoading && !generatedDesign && (
                  <div className="text-center text-muted-foreground">
                      <p>Your generated design will appear here.</p>
                  </div>
                )}
            </div>

            {/* Editor Section */}
            {isEditing && generatedDesign && (
              <div className="md:col-span-2 mt-8 space-y-6 p-6 border-t">
                  <h3 className="text-xl font-semibold">Image Customizer</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="relative w-full aspect-square rounded-md overflow-hidden border">
                        <Image src={generatedDesign} alt="Image to edit" fill className="object-contain" />
                    </div>
                    <div className="space-y-4">
                      <div>
                          <Label htmlFor="edit-prompt">Edit Prompt</Label>
                          <Textarea
                              id="edit-prompt"
                              placeholder="e.g., Change the background to a starry night"
                              value={editPrompt}
                              onChange={(e) => setEditPrompt(e.target.value)}
                              className="min-h-[100px]"
                          />
                      </div>
                      <div className="flex gap-4">
                        <Button onClick={() => handleGenerateClick(true)} disabled={isLoading} className="flex-1">
                            {isLoading && isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Apply Edit
                        </Button>
                        <Button onClick={() => setIsEditing(false)} variant="ghost" disabled={isLoading}>
                            Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
