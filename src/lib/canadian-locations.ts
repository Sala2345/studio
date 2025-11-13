
export const provinces = [
  { name: 'Alberta', code: 'AB' },
  { name: 'British Columbia', code: 'BC' },
  { name: 'Manitoba', code: 'MB' },
  { name: 'New Brunswick', code: 'NB' },
  { name: 'Newfoundland and Labrador', code: 'NL' },
  { name: 'Nova Scotia', code: 'NS' },
  { name: 'Ontario', code: 'ON' },
  { name: 'Prince Edward Island', code: 'PE' },
  { name: 'Quebec', code: 'QC' },
  { name: 'Saskatchewan', code: 'SK' },
  { name: 'Northwest Territories', code: 'NT' },
  { name: 'Nunavut', code: 'NU' },
  { name: 'Yukon', code: 'YT' },
];

const citiesByProvince: Record<string, string[]> = {
  'Alberta': ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'St. Albert', 'Medicine Hat', 'Grande Prairie'],
  'British Columbia': ['Vancouver', 'Victoria', 'Surrey', 'Burnaby', 'Richmond', 'Kelowna', 'Abbotsford'],
  'Manitoba': ['Winnipeg', 'Brandon'],
  'New Brunswick': ['Moncton', 'Saint John', 'Fredericton'],
  'Newfoundland and Labrador': ['St. John\'s'],
  'Nova Scotia': ['Halifax'],
  'Ontario': ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Markham', 'Vaughan', 'Kitchener', 'Windsor'],
  'Prince Edward Island': ['Charlottetown'],
  'Quebec': ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay'],
  'Saskatchewan': ['Saskatoon', 'Regina'],
  'Northwest Territories': ['Yellowknife'],
  'Nunavut': ['Iqaluit'],
  'Yukon': ['Whitehorse'],
};

export const getCitiesForProvince = (provinceName: string): string[] => {
  return citiesByProvince[provinceName] || [];
};
