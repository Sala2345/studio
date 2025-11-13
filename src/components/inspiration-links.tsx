
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InspirationLinksProps {
  heading?: string;
  optionalText?: string;
  description?: string;
  placeholder?: string;
  addLinkText?: string;
  onChange?: (links: string[]) => void;
}

export const InspirationLinks: React.FC<InspirationLinksProps> = ({
  heading = "What should we use as inspiration?",
  optionalText = "(optional)",
  description = "Add links to designs and styles you like",
  placeholder = "https://www.example.com/",
  addLinkText = "Add Link",
  onChange,
}) => {
  const [links, setLinks] = useState<string[]>(['']);
  const [errors, setErrors] = useState<boolean[]>([]);

  const memoizedOnChange = useCallback(onChange, [onChange]);

  useEffect(() => {
    if (memoizedOnChange) {
      const validLinks = links.filter((link, index) => link && !errors[index]);
      memoizedOnChange(validLinks);
    }
  }, [links, errors, memoizedOnChange]);

  const isValidUrl = (str: string): boolean => {
    if (!str) return false;
    try {
      const url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  const validateLink = (link: string, index: number) => {
    if (!link) {
      setErrors(prev => {
        const newErrors = [...prev];
        newErrors[index] = false;
        return newErrors;
      });
      return;
    }
    const isValid = isValidUrl(link);
    setErrors(prev => {
      const newErrors = [...prev];
      newErrors[index] = !isValid;
      return newErrors;
    });
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
    validateLink(value, index);
  };

  const addLinkInput = () => {
    setLinks(prev => [...prev, '']);
    setErrors(prev => [...prev, false]);
  };

  const removeLinkInput = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    const newErrors = errors.filter((_, i) => i !== index);
    setLinks(newLinks);
    setErrors(newErrors);
  };
  
  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="font-sans">
      <h2 className="text-lg font-medium text-gray-800 mb-2">
        {heading}
        <span className="text-base text-gray-500 font-normal ml-1">{optionalText}</span>
      </h2>
      <p className="text-sm text-gray-600 mb-6">{description}</p>
      
      <div className="max-w-3xl">
        <div className="flex flex-col gap-4">
          {links.map((link, index) => (
            <div key={index} className="space-y-2">
              <div className="relative group">
                <Input
                  type="url"
                  placeholder={placeholder}
                  value={link}
                  onChange={(e) => handleLinkChange(index, e.target.value)}
                  onBlur={() => validateLink(link, index)}
                  className={cn(
                    'pr-12 text-base h-auto py-3.5',
                    errors[index] && 'border-destructive focus-visible:ring-destructive'
                  )}
                />
                {links.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLinkInput(index)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-muted-foreground hover:text-destructive md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {errors[index] && (
                <p className="text-sm text-destructive">Please enter a valid URL.</p>
              )}
              {!errors[index] && isValidUrl(link) && (
                 <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1.5 px-1">
                    <LinkIcon className="h-3 w-3 text-primary"/>
                    <span>{getHostname(link)}</span>
                 </div>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="link"
          onClick={addLinkInput}
          className="p-0 h-auto text-primary mt-4"
        >
          <Plus className="mr-2 h-4 w-4" />
          {addLinkText}
        </Button>
      </div>
    </div>
  );
};
