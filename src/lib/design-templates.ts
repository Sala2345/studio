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

export const designTemplates: DesignTemplate[] = data.templates;
