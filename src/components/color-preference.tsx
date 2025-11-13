
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Minus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';

interface Color {
  value: string;
  name: string;
}

interface ColorPreferenceProps {
  heading?: string;
  optionalText?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  customColorLabel?: string;
  defaultColors?: Color[];
  onChange?: (colors: string) => void;
}

const defaultColorSwatches: Color[] = [
    { value: '#FF0000', name: 'Red' },
    { value: '#FF6B35', name: 'Orange' },
    { value: '#FFD700', name: 'Gold' },
    { value: '#00FF00', name: 'Green' },
    { value: '#0066FF', name: 'Blue' },
    { value: '#8B00FF', name: 'Purple' },
    { value: '#FF1493', name: 'Pink' },
    { value: '#000000', name: 'Black' },
    { value: '#FFFFFF', name: 'White' },
    { value: '#808080', name: 'Gray' },
];

export const ColorPreference: React.FC<ColorPreferenceProps> = ({
  heading = "What colors would you like included?",
  optionalText = "(optional)",
  description = "List the colors you want, for example: \"red\", \"blue\", or select a specific color with the color picker.",
  placeholder = "Start typing here",
  buttonText = "Add Color",
  customColorLabel = "Or pick a custom color:",
  defaultColors = defaultColorSwatches,
  onChange,
}) => {
  const [text, setText] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedColors, setSelectedColors] = useState<Color[]>([]);
  const [customColor, setCustomColor] = useState('#ED1C24');
  const customColorInputRef = useRef<HTMLInputElement>(null);

  const memoizedOnChange = useCallback(onChange, [onChange]);

  useEffect(() => {
    const colorNames = selectedColors.map(c => c.name).join(', ');
    setText(colorNames);
    if (memoizedOnChange) {
      memoizedOnChange(colorNames);
    }
  }, [selectedColors, memoizedOnChange]);

  const handleTogglePicker = () => {
    setIsPickerOpen(prev => !prev);
  };

  const handleSwatchClick = (color: Color) => {
    setSelectedColors(prev => {
      const isSelected = prev.some(sc => sc.value === color.value);
      if (isSelected) {
        return prev.filter(sc => sc.value !== color.value);
      } else {
        return [...prev, color];
      }
    });
  };

  const handleAddCustomColor = () => {
    if (customColor && !selectedColors.some(c => c.value.toLowerCase() === customColor.toLowerCase())) {
      setSelectedColors(prev => [...prev, { value: customColor, name: customColor }]);
    }
  };

  const removeColor = (colorValue: string) => {
    setSelectedColors(prev => prev.filter(c => c.value !== colorValue));
  };

  return (
    <div className="font-sans">
      <div className="mb-10">
        <h2 className="text-lg font-medium text-gray-800 mb-2">
          {heading}{' '}
          <span className="text-base text-gray-500 font-normal">{optionalText}</span>
        </h2>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        
        <div className="relative max-w-3xl mb-5">
            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                maxLength={300}
                className="min-h-[80px] pr-20"
            />
            <span className="absolute bottom-3 right-4 text-sm text-muted-foreground pointer-events-none">
                {text.length}/300
            </span>
        </div>

        <Button
            variant="outline"
            onClick={handleTogglePicker}
            className="text-primary border-primary hover:bg-primary/5 hover:text-primary"
        >
            {isPickerOpen ? <Minus className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {isPickerOpen ? `Hide ${buttonText} Picker` : buttonText}
        </Button>
        
        {isPickerOpen && (
            <div className="mt-5 p-5 bg-muted/50 rounded-lg max-w-3xl">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-3 mb-5">
                    {defaultColors.map((color) => {
                        const isSelected = selectedColors.some(sc => sc.value.toLowerCase() === color.value.toLowerCase());
                        return (
                            <button
                                key={color.value}
                                type="button"
                                onClick={() => handleSwatchClick(color)}
                                className={cn(
                                    "w-[50px] h-[50px] rounded-lg cursor-pointer transition-all duration-200 relative",
                                    "hover:scale-105",
                                    isSelected ? 'ring-2 ring-offset-2 ring-primary' : 'ring-1 ring-inset ring-border'
                                )}
                                style={{ backgroundColor: color.value }}
                            >
                                {isSelected && (
                                    <span className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold" style={{ textShadow: '0 0 3px rgba(0,0,0,0.7)'}}>✓</span>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="flex items-center gap-4">
                    <Label htmlFor="custom-color" className="font-medium">{customColorLabel}</Label>
                    <div 
                        className="relative h-10 w-16 rounded-md border border-input bg-background cursor-pointer"
                        onClick={() => customColorInputRef.current?.click()}
                    >
                         <Input
                            ref={customColorInputRef}
                            id="custom-color"
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                         <div 
                            className="w-full h-full rounded-[5px] border-4 border-background"
                            style={{ backgroundColor: customColor }}
                        ></div>
                    </div>
                    <Button type="button" onClick={handleAddCustomColor} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Confirm Colour</Button>
                </div>
            </div>
        )}

        {selectedColors.length > 0 && (
            <div className="mt-5 max-w-3xl">
                 <div className="text-sm text-muted-foreground mb-2">Selected colors:</div>
                 <div className="flex flex-wrap gap-3">
                    {selectedColors.map(color => (
                        <div key={color.value} className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-muted">
                            <span
                                className="h-5 w-5 rounded-full border border-border"
                                style={{ backgroundColor: color.value }}
                            />
                            <span className="text-sm font-medium">{color.name}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full"
                                onClick={() => removeColor(color.value)}
                            >
                                <X className="h-4 w-4"/>
                            </Button>
                        </div>
                    ))}
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};
