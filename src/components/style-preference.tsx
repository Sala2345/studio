
'use client';

import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Check } from 'lucide-react';

interface Style {
  title: string;
  description: string;
  image1?: string | null;
  image2?: string | null;
}

interface StylePreferenceProps {
  contactLabel?: string;
  contactRequired?: boolean;
  contactSubtitle?: string;
  styleLabel?: string;
  styleOptionalText?: string;
  styles?: Style[];
  onContactModeChange?: (value: string) => void;
  onStyleChange?: (value: string) => void;
}

export const StylePreference: React.FC<StylePreferenceProps> = ({ 
  contactLabel = "What's your preferred mode of contact?",
  contactRequired = true,
  contactSubtitle = "How would you like us to contact you?",
  styleLabel = "What style would you like?",
  styleOptionalText = "(optional)",
  styles = [],
  onContactModeChange = () => {},
  onStyleChange = () => {}
}) => {
  const [contactMode, setContactMode] = useState('email');
  const [selectedStyle, setSelectedStyle] = useState('');

  const handleContactModeChange = (value: string) => {
    setContactMode(value);
    onContactModeChange(value);
  };

  const handleStyleChange = (value: string) => {
    setSelectedStyle(value);
    onStyleChange(value);
  };

  const defaultStyles: Style[] = [
    {
      title: "Clean & Minimal",
      description: "Minimal yet impactful, embracing modern simplicity with style.",
      image1: "https://picsum.photos/seed/style1/300/300",
      image2: "https://picsum.photos/seed/style2/300/300"
    },
    {
      title: "Elegant & Formal",
      description: "Elegance with a formal touch, perfect harmony of poise, grace.",
      image1: "https://picsum.photos/seed/style3/300/300",
      image2: "https://picsum.photos/seed/style4/300/300"
    },
    {
      title: "Typography",
      description: "Typography with blending elegance, merging style, clarity.",
      image1: "https://picsum.photos/seed/style5/300/300",
      image2: "https://picsum.photos/seed/style6/300/300"
    },
    {
      title: "Fun & Whimsical",
      description: "Playful & Lively, where creativity meets carefree charm.",
      image1: "https://picsum.photos/seed/style7/300/300",
      image2: "https://picsum.photos/seed/style8/300/300"
    },
    {
      title: "Let The Expert Decide",
      description: "Trust the expert to choose the best, tailored to your needs with",
      image1: "https://picsum.photos/seed/style9/300/300",
      image2: null,
    }
  ];

  const styleOptions = styles.length > 0 ? styles : defaultStyles;

  return (
    <div className="font-sans">
      {/* Contact Mode Section */}
      <div className="mb-12">
        <h2 className="text-[17px] font-semibold text-gray-800 mb-2">
          {contactLabel}
          {contactRequired && <span className="text-destructive ml-1">*</span>}
        </h2>
        <p className="text-sm text-muted-foreground mb-5">{contactSubtitle}</p>

        <RadioGroup 
          value={contactMode} 
          onValueChange={handleContactModeChange}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[680px]"
        >
          <Label 
            htmlFor="contact-email"
            className={cn(
              "flex items-center gap-3 px-5 py-4 border-2 rounded-lg cursor-pointer transition-all duration-200 bg-background",
              contactMode === 'email' ? 'border-primary' : 'border-border hover:border-primary'
            )}
          >
            <RadioGroupItem 
              value="email" 
              id="contact-email" 
              className="sr-only"
            />
             <span className={cn(
              "w-[20px] h-[20px] border-2 rounded-full flex items-center justify-center transition-all duration-200",
              contactMode === 'email' ? 'border-primary bg-primary' : 'border-border bg-background'
            )}>
              {contactMode === 'email' && <span className="w-[8px] h-[8px] bg-white rounded-full" />}
            </span>
            <span className="text-sm font-normal text-foreground">Email</span>
          </Label>

          <Label 
            htmlFor="contact-call"
            className={cn(
              "flex items-center gap-3 px-5 py-4 border-2 rounded-lg cursor-pointer transition-all duration-200 bg-background",
              contactMode === 'call' ? 'border-primary' : 'border-border hover:border-primary'
            )}
          >
            <RadioGroupItem 
              value="call" 
              id="contact-call" 
              className="sr-only"
            />
            <span className={cn(
              "w-[20px] h-[20px] border-2 rounded-full flex items-center justify-center transition-all duration-200",
              contactMode === 'call' ? 'border-primary bg-primary' : 'border-border bg-background'
            )}>
              {contactMode === 'call' && <span className="w-[8px] h-[8px] bg-white rounded-full" />}
            </span>
            <span className="text-sm font-normal text-foreground">Call</span>
          </Label>
        </RadioGroup>
      </div>

      {/* Style Selection Section */}
      <div>
        <h2 className="text-[17px] font-semibold text-gray-800 mb-8">
          {styleLabel}{' '}
          <span className="text-sm text-muted-foreground font-normal">{styleOptionalText}</span>
        </h2>

        <RadioGroup 
            value={selectedStyle}
            onValueChange={handleStyleChange}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 max-w-[1600px]"
        >
          {styleOptions.map((style, index) => {
            const styleId = style.title.toLowerCase().replace(/\s+/g, '-');
            const isSelected = selectedStyle === styleId;

            return (
              <Label
                key={index}
                htmlFor={styleId}
                className={cn(
                    "group relative border-2 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 bg-background",
                    isSelected ? 'border-primary shadow-lg' : 'border-border hover:border-primary hover:shadow-md'
                )}
              >
                <RadioGroupItem
                  id={styleId}
                  value={styleId}
                  className="absolute opacity-0"
                />
                
                <div className="aspect-square p-5 flex items-center justify-center bg-muted/30 relative overflow-hidden transition-all duration-300 group-hover:bg-muted/60">
                  <div className="w-full h-full flex items-center justify-center gap-3" style={{perspective: '1000px'}}>
                    {style.image1 && (
                      <div className={cn("h-full transition-all duration-300 group-hover:-rotate-2 group-hover:scale-105", style.image2 ? 'w-[47%]' : 'w-full')} style={{ transformStyle: 'preserve-3d' }}>
                        <Image
                          src={style.image1}
                          alt={`${style.title} preview 1`}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover rounded-xl shadow-lg"
                        />
                      </div>
                    )}
                    {style.image2 && (
                       <div className="w-[47%] h-full transition-all duration-300 group-hover:rotate-2 group-hover:scale-105" style={{ transformStyle: 'preserve-3d' }}>
                        <Image
                          src={style.image2}
                          alt={`${style.title} preview 2`}
                           width={300}
                          height={300}
                          className="w-full h-full object-cover rounded-xl shadow-lg"
                        />
                      </div>
                    )}
                    {!style.image1 && !style.image2 && (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        No preview
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-4 bg-background">
                  <h3 className="text-sm font-semibold text-black mb-2 leading-snug">
                    {style.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {style.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute top-3 right-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </Label>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
};
