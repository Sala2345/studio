import data from './design-templates.json';

export type DesignTemplate = {
  id: string;
  name: string;
  defaultWidth?: number;
  defaultHeight?: number;
  allowAnySize: boolean;
  imageUrl?: string;
  imageHint?: string;
};

// Add placeholder image URLs
const templatesWithPlaceholders: DesignTemplate[] = data.templates.map(template => {
    switch (template.id) {
        case 'blade-lite-800':
            return { ...template, imageUrl: `https://picsum.photos/seed/blade800/600/400`, imageHint: 'banner stand' };
        case 'blade-lite-850':
            return { ...template, imageUrl: `https://picsum.photos/seed/blade850/600/400`, imageHint: 'banner stand' };
        case 'car-magnets':
            return { ...template, imageUrl: `https://picsum.photos/seed/carmagnet/600/400`, imageHint: 'car magnet' };
        case 'signicade-deluxe':
            return { ...template, imageUrl: `https://picsum.photos/seed/signdeluxe/600/400`, imageHint: 'sandwich board' };
        case 'signicade-standard':
            return { ...template, imageUrl: `https://picsum.photos/seed/signstandard/600/400`, imageHint: 'sandwich board' };
        case 'custom':
            return { ...template, imageUrl: `https://picsum.photos/seed/customsize/600/400`, imageHint: 'ruler measure' };
        default:
            return template;
    }
});

export const designTemplates: DesignTemplate[] = templatesWithPlaceholders;
