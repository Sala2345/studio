import data from './design-templates.json';

export type DesignTemplate = {
  id: string;
  name: string;
  defaultWidth?: number;
  defaultHeight?: number;
  allowAnySize: boolean;
};

export const designTemplates: DesignTemplate[] = data.templates;
