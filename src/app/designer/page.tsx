

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { generateDesign } from "@/ai/flows/generate-design";
import { Loader2, Download, Edit, Save } from "lucide-react";
import { designTemplates, DesignTemplate } from "@/lib/design-templates";
import { cn } from "@/lib/utils";

const MAX_IMAGE_SIZE_MB = 0.95; // Just under 1MB to be safe
const MAX_IMAGE_DIMENSION = 1024; // Max width/height for resizing

// Function to communicate back to the parent window
const sendFileToParent = (fileData: any) => {
  if (window.opener) {
    window.opener.postMessage({ type: 'UPLOADED_FILE', file: fileData }, '*');
    window.close();
  } else if (window.parent) {
    window.parent.postMessage({ type: 'ADD_GENERATED_DESIGN', file: fileData }, '*');
  }
};


function DesignerPageContent() {
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(null);
  const [width, setWidth] = useState<number | string>("");
  const [height, setHeight] = useState<number | string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Check if running inside an iframe
    if (window.self !== window.top) {
      setIsInIframe(true);
    }
    const templateId = searchParams.get('template');
    if (templateId) {
      const template = designTemplates.find(t => t.id === templateId);
      if (template) {
        handleTemplateSelect(template);
      }
    }
    const initialPrompt = searchParams.get('prompt');
    if (initialPrompt) {
        setPrompt(decodeURIComponent(initialPrompt));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleBaseImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        resizeImage(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setBaseImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const resizeImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = resizeCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let { width, height } = img;
        if (width > height) {
          if (width > MAX_IMAGE_DIMENSION) {
            height *= MAX_IMAGE_DIMENSION / width;
            width = MAX_IMAGE_DIMENSION;
          }
        } else {
          if (height > MAX_IMAGE_DIMENSION) {
            width *= MAX_IMAGE_DIMENSION / height;
            height = MAX_IMAGE_DIMENSION;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const resizedDataUrl = canvas.toDataURL(file.type, 0.9);
        setBaseImage(resizedDataUrl);
         toast({
          title: "Image Resized",
          description: "Your image was large and has been automatically resized to optimize performance.",
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateClick = async (isEdit: boolean = false) => {
    const currentPrompt = isEdit ? editPrompt : prompt;
    const imageBase = isEdit ? generatedDesign : baseImage;

    if (!currentPrompt) {
      toast({
        variant: "destructive",
        title: "Prompt is required",
        description: `Please enter a prompt to ${isEdit ? 'edit the' : 'generate a'} design.`,
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
        baseImage: imageBase || undefined 
      });
      setGeneratedDesign(result.imageUrl);
      setIsEditing(false); // Exit editing mode after successful generation
      setEditPrompt("");
    } catch (error) {
      console.error("Design generation failed:", error);
      toast({
        variant: "destructive",
        title: "Design Generation Failed",
        description: (error as Error).message || "There was an error generating the design. Please try again.",
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
  
  const handleUseDesign = async () => {
    if (!generatedDesign) return;
    setIsSaving(true);
    try {
        const fileData = {
            name: 'ai-generated-design.png',
            size: 0, // Size is not easily available for data URI without conversion
            type: 'image/png',
            url: generatedDesign, 
            key: `generated-${Date.now()}`
        };

        sendFileToParent(fileData);
        
        toast({
            title: "Design Saved",
            description: "The generated design has been added to your request.",
        });

    } catch (error) {
        console.error("Error saving design:", error);
        toast({
            variant: "destructive",
            title: "Could Not Save Design",
            description: "There was an error adding the design to your request."
        });
    } finally {
        setIsSaving(false);
    }
  };


  const generateResizedImage = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || !generatedDesign || !width || !height) return null;

    const img = document.createElement('img');
    img.src = generatedDesign;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const targetWidth = Number(width) * 96; // Assuming 96 DPI for print
    const targetHeight = Number(height) * 96;
    const targetAspect = targetWidth / targetHeight;
    
    const imageAspect = img.naturalWidth / img.naturalHeight;

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    let sx, sy, sWidth, sHeight;

    if (imageAspect > targetAspect) {
        sHeight = img.naturalHeight;
        sWidth = sHeight * targetAspect;
        sx = (img.naturalWidth - sWidth) / 2;
        sy = 0;
    } else {
        sWidth = img.naturalWidth;
        sHeight = sWidth / targetAspect;
        sx = 0;
        sy = (img.naturalHeight - sHeight) / 2;
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
    
    return canvas.toDataURL('image/png');
};

  const handleTemplateSelect = (template: DesignTemplate) => {
    setSelectedTemplate(template);
    setWidth(template.defaultWidth || "");
    setHeight(template.defaultHeight || "");
    setGeneratedDesign(null);
    setIsEditing(false);
  };

  return (
    <div className="p-4 sm:p-6 bg-background text-foreground min-h-screen">
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={resizeCanvasRef} className="hidden" />
      <Card className="w-full max-w-7xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">AI Designer</CardTitle>
          <CardDescription>
            Create a unique design with AI. Choose a template, describe what you want, and let the AI do the rest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Step 1: Template Selection */}
          <div>
            <h3 className="text-xl font-semibold mb-4">1. Select a Template</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {designTemplates.map((template) => (
                <Card 
                  key={template.id} 
                  onClick={() => handleTemplateSelect(template)}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg bg-black text-white",
                    selectedTemplate?.id === template.id ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-border"
                  )}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center h-40">
                    <p className="font-semibold text-center uppercase tracking-wider">{template.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Step 2: Customize */}
          {selectedTemplate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t">
              {/* Left Column: Inputs */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">2. Customize Your Design</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="width">Width (in)</Label>
                            <Input id="width" type="number" placeholder="e.g., 31.5" value={width} onChange={(e) => setWidth(e.target.value)} disabled={!selectedTemplate.allowAnySize} />
                        </div>
                        <div>
                            <Label htmlFor="height">Height (in)</Label>
                            <Input id="height" type="number" placeholder="e.g., 83.25" value={height} onChange={(e) => setHeight(e.target.value)} disabled={!selectedTemplate.allowAnySize} />
                        </div>
                    </div>
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
                  </div>
                </div>

                <Button onClick={() => handleGenerateClick(false)} disabled={isLoading || isSaving} className="w-full text-lg py-6">
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Generate Design
                </Button>
              </div>

              {/* Right Column: Output */}
              <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-border bg-card p-8 min-h-[400px]">
                {isLoading && (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p>Generating your masterpiece...</p>
                  </div>
                )}
                {!isLoading && generatedDesign && (
                  <div className="w-full space-y-4">
                    <h3 className="text-xl font-semibold text-center">Your Generated Design</h3>
                    <div className="relative w-full aspect-square rounded-md overflow-hidden border">
                      <Image src={generatedDesign} alt="Generated design" fill className="object-contain" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                       {isInIframe ? (
                         <Button onClick={handleUseDesign} disabled={isSaving} className="w-full sm:col-span-2">
                           {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                           Use This Design
                         </Button>
                       ) : (
                        <>
                          <Button onClick={() => handleDownload(generatedDesign, 'generated-design-original.png')} variant="secondary">
                              <Download className="mr-2"/> Download Original
                          </Button>
                          <Button onClick={() => setIsEditing(true)} variant="outline">
                              <Edit className="mr-2" /> Edit Image
                          </Button>
                        </>
                       )}
                    </div>
                    {width && height && !isInIframe && (
                      <Button onClick={() => handleDownload(generateResizedImage(), `design-${width}x${height}.png`)} variant="default" className="w-full">
                          <Download className="mr-2"/> Download {width}" x {height}"
                      </Button>
                    )}
                  </div>
                )}
                {!isLoading && !generatedDesign && (
                  <div className="text-center text-muted-foreground">
                    <p>Your generated design will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Image Customizer */}
          {isEditing && generatedDesign && (
             <div className="pt-8 border-t space-y-4">
                <h3 className="text-xl font-semibold">3. Image Customizer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="relative w-full aspect-square rounded-md overflow-hidden border">
                        <Image src={generatedDesign} alt="Image to edit" fill className="object-contain" />
                    </div>
                    <div className="space-y-4">
                        <Label htmlFor="edit-prompt">Edit Instructions</Label>
                        <Textarea
                            id="edit-prompt"
                            placeholder="e.g., 'Make the background a vibrant blue', 'Add a sun in the top left corner'"
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            className="min-h-[100px]"
                        />
                        <Button onClick={() => handleGenerateClick(true)} disabled={isLoading || isSaving} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Apply Customization
                        </Button>
                    </div>
                </div>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DesignerPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <DesignerPageContent />
    </React.Suspense>
  );
}
