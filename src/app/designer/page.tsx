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
import { Loader2, Download } from "lucide-react";
import { designTemplates, DesignTemplate } from "@/lib/design-templates";
import { cn } from "@/lib/utils";

export default function DesignerPage() {
  const [prompt, setPrompt] = useState("");
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);
  const [resizedDesign, setResizedDesign] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(null);
  const [width, setWidth] = useState<number | string>("");
  const [height, setHeight] = useState<number | string>("");
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (selectedTemplate) {
      setPrompt(`A design for a ${selectedTemplate.name}`);
      setWidth(selectedTemplate.defaultWidth || "");
      setHeight(selectedTemplate.defaultHeight || "");
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (generatedDesign && width && height && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new window.Image();
      img.onload = () => {
        const w = typeof width === 'string' ? parseFloat(width) : width;
        const h = typeof height === 'string' ? parseFloat(height) : height;
        canvas.width = w * 96; // Assuming 96 DPI for print
        canvas.height = h * 96;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setResizedDesign(canvas.toDataURL("image/png"));
      };
      img.src = generatedDesign;
    } else {
      setResizedDesign(null);
    }
  }, [generatedDesign, width, height]);


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

  const handleGenerateClick = async () => {
    if (!prompt) {
      toast({
        variant: "destructive",
        title: "Prompt is required",
        description: "Please enter a prompt to generate a design.",
      });
      return;
    }
    setIsLoading(true);
    setGeneratedDesign(null);
    setResizedDesign(null);
    try {
      const result = await generateDesign({ prompt, baseImage: baseImage || undefined });
      setGeneratedDesign(result.imageUrl);
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

  const TemplateGrid = () => (
    <div className="space-y-4">
        <Label>Choose a Template</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {designTemplates.map(template => (
                <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={cn(
                        "p-4 border rounded-lg text-center hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
                        selectedTemplate?.id === template.id && "bg-accent ring-2 ring-ring"
                    )}
                >
                    <div className="font-semibold text-sm">{template.name}</div>
                    {template.defaultWidth && template.defaultHeight && (
                        <div className="text-xs text-muted-foreground">{`${template.defaultWidth}" x ${template.defaultHeight}"`}</div>
                    )}
                </button>
            ))}
        </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>AI Designer</CardTitle>
          <CardDescription>
            Create a unique design with AI. Choose a template, describe what you want, and optionally provide a base image.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Controls */}
            <div className="space-y-6">
                {!selectedTemplate ? (
                    <TemplateGrid />
                ) : (
                    <>
                        <div>
                            <Button variant="link" className="p-0" onClick={() => setSelectedTemplate(null)}>
                                &larr; Back to templates
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">{selectedTemplate.name}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="width">Width (inches)</Label>
                                    <Input
                                        id="width"
                                        type="number"
                                        placeholder="e.g., 31.5"
                                        value={width}
                                        onChange={e => setWidth(e.target.value)}
                                        disabled={!selectedTemplate.allowAnySize}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="height">Height (inches)</Label>
                                    <Input
                                        id="height"
                                        type="number"
                                        placeholder="e.g., 83.25"
                                        value={height}
                                        onChange={e => setHeight(e.target.value)}
                                        disabled={!selectedTemplate.allowAnySize}
                                    />
                                </div>
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

                        <Button onClick={handleGenerateClick} disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Design
                        </Button>
                    </>
                )}
            </div>

            {/* Right Column: Output */}
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
                        <Button onClick={() => handleDownload(generatedDesign, 'generated-design-original.png')} variant="secondary">
                            <Download className="mr-2"/> Original
                        </Button>
                         <Button onClick={() => handleDownload(resizedDesign, `design-${width}x${height}.png`)} variant="secondary" disabled={!resizedDesign}>
                            <Download className="mr-2"/> {width}" x {height}"
                        </Button>
                    </div>
                </>
                )}
                {!isLoading && !generatedDesign && (
                <div className="text-center text-muted-foreground">
                    {!selectedTemplate 
                        ? <p>Please choose a template to begin.</p>
                        : <p>Your generated design will appear here.</p>
                    }
                </div>
                )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </CardContent>
      </Card>
    </div>
  );
}
