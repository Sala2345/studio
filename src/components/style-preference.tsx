
'use client';

import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface Style {
  title: string;
  description: string;
  image1?: string;
  image2?: string;
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
  onContactModeChange,
  onStyleChange
}) => {
  const [contactMode, setContactMode] = useState('email');
  const [selectedStyle, setSelectedStyle] = useState('');

  const handleContactModeChange = (value: string) => {
    setContactMode(value);
    if (onContactModeChange) {
      onContactModeChange(value);
    }
  };

  const handleStyleChange = (value: string) => {
    setSelectedStyle(value);
    if (onStyleChange) {
      onStyleChange(value);
    }
  };

  const defaultStyles: Style[] = [
    {
      title: "Clean & Minimal",
      description: "Minimal yet impactful, embracing modern simplicity with style.",
      image1: "https://picsum.photos/seed/101/300/300",
      image2: "https://picsum.photos/seed/102/300/300"
    },
    {
      title: "Elegant & Formal",
      description: "Elegance with a formal touch, perfect harmony of poise, grace.",
      image1: "https://picsum.photos/seed/103/300/300",
      image2: "https://picsum.photos/seed/104/300/300"
    },
    {
      title: "Typography",
      description: "Typography with blending elegance, merging style, clarity.",
      image1: "https://picsum.photos/seed/105/300/300",
      image2: "https://picsum.photos/seed/106/300/300"
    },
    {
      title: "Fun & Whimsical",
      description: "Playful & Lively, where creativity meets carefree charm.",
      image1: "https://picsum.photos/seed/107/300/300",
      image2: "https://picsum.photos/seed/108/300/300"
    },
    {
      title: "Let The Expert Decide",
      description: "Trust the expert to choose the best, tailored to your needs with",
      image1: "https://picsum.photos/seed/109/300/300"
    }
  ];

  const styleOptions = styles.length > 0 ? styles : defaultStyles;

  return (
    <div className="font-sans">
      {/* Contact Mode Section */}
      <div className="mb-10">
        <h2 className="text-lg font-medium text-gray-800 mb-2">
          {contactLabel}
          {contactRequired && <span className="text-destructive ml-1">*</span>}
        </h2>
        <p className="text-sm text-gray-600 mb-4">{contactSubtitle}</p>

        <RadioGroup 
          value={contactMode} 
          onValueChange={handleContactModeChange}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl"
        >
          <div className="relative">
            <RadioGroupItem value="email" id="contact-email-style" className="sr-only peer" />
            <Label
              htmlFor="contact-email-style"
              className="flex items-center gap-3 p-5 border-2 rounded-lg cursor-pointer transition-all bg-background peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
            >
              <div className="w-5 h-5 border-2 border-border rounded-full flex-shrink-0 relative peer-data-[state=checked]:border-primary">
                <div className="absolute inset-0.5 bg-primary rounded-full scale-0 peer-data-[state=checked]:scale-100 transition-transform"></div>
              </div>
              <span className="text-base font-medium text-foreground">Email</span>
            </Label>
          </div>
          <div className="relative">
            <RadioGroupItem value="call" id="contact-call-style" className="sr-only peer" />
            <Label
              htmlFor="contact-call-style"
              className="flex items-center gap-3 p-5 border-2 rounded-lg cursor-pointer transition-all bg-background peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
            >
              <div className="w-5 h-5 border-2 border-border rounded-full flex-shrink-0 relative peer-data-[state=checked]:border-primary">
                <div className="absolute inset-0.5 bg-primary rounded-full scale-0 peer-data-[state=checked]:scale-100 transition-transform"></div>
              </div>
              <span className="text-base font-medium text-foreground">Call</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Style Selection Section */}
      <div className="mt-10">
        <h2 className="text-lg font-medium text-gray-800 mb-2">
          {styleLabel}{' '}
          <span className="text-base text-gray-500 font-normal">{styleOptionalText}</span>
        </h2>

        <RadioGroup 
            value={selectedStyle}
            onValueChange={handleStyleChange}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mt-6"
        >
          {styleOptions.map((style, index) => {
            const styleId = style.title.toLowerCase().replace(/\s+/g, '-');
            return (
              <div key={index}>
                <RadioGroupItem value={styleId} id={`style-${styleId}`} className="sr-only peer" />
                <Label
                  htmlFor={`style-${styleId}`}
                  className="block cursor-pointer rounded-xl border-2 bg-background transition-all hover:border-muted-foreground hover:-translate-y-0.5 hover:shadow-md peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 overflow-hidden"
                >
                  <div className="aspect-square bg-gray-100 p-4">
                    <div className="flex h-full w-full items-stretch justify-center gap-2">
                      {style.image1 && (
                        <div className={cn("relative h-full", style.image2 ? 'w-1/2' : 'w-full')}>
                            <Image
                                src={style.image1}
                                alt={`${style.title} preview 1`}
                                fill
                                loading="lazy"
                                className="rounded-md object-cover shadow-sm"
                            />
                        </div>
                      )}
                      {style.image2 && (
                        <div className="relative h-full w-1/2">
                            <Image
                                src={style.image2}
                                alt={`${style.title} preview 2`}
                                fill
                                loading="lazy"
                                className="rounded-md object-cover shadow-sm"
                            />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="w-5 h-5 border-2 border-border rounded-full flex-shrink-0 relative peer-data-[state=checked]:border-primary">
                            <div className="absolute inset-0.5 bg-primary rounded-full scale-0 peer-data-[state=checked]:scale-100 transition-transform"></div>
                        </div>
                        <h3 className="font-semibold text-base text-gray-800">{style.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-snug">{style.description}</p>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
};
