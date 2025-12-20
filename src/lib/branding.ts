// Branding configuration based on domain

export interface BrandConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  keywords: string[];
}

const BRAND_CONFIG: Record<string, BrandConfig> = {
  'storypoint-estimate.com': {
    name: 'Storypoint Estimate',
    shortName: 'SP Estimate',
    tagline: 'Free Online Story Point Estimation',
    description: 'Free online story point estimation tool for agile teams. No signup required. Real-time scrum poker for sprint planning and team collaboration.',
    keywords: ['planning poker', 'planning poker online', 'scrum poker', 'story points', 'agile estimation', 'sprint planning', 'story point estimation', 'pointing poker', 'free planning poker', 'online estimation tool', 'scrum estimation', 'agile team tools'],
  },
  'www.storypoint-estimate.com': {
    name: 'Storypoint Estimate',
    shortName: 'SP Estimate',
    tagline: 'Free Online Story Point Estimation',
    description: 'Free online story point estimation tool for agile teams. No signup required. Real-time scrum poker for sprint planning and team collaboration.',
    keywords: ['planning poker', 'planning poker online', 'scrum poker', 'story points', 'agile estimation', 'sprint planning', 'story point estimation', 'pointing poker', 'free planning poker', 'online estimation tool', 'scrum estimation', 'agile team tools'],
  },
};

const DEFAULT_BRAND: BrandConfig = {
  name: 'Sakiyomi',
  shortName: 'Sakiyomi',
  tagline: 'Free Online Story Point Estimation',
  description: 'Free online story point estimation tool for agile teams. No signup required. Real-time scrum poker for sprint planning and team collaboration.',
  keywords: ['planning poker', 'planning poker online', 'scrum poker', 'story points', 'agile estimation', 'sprint planning', 'story point estimation', 'pointing poker', 'free planning poker', 'online estimation tool', 'scrum estimation', 'agile team tools'],
};

export function getBrandConfig(hostname: string): BrandConfig {
  return BRAND_CONFIG[hostname] || DEFAULT_BRAND;
}

export function getAppName(hostname: string): string {
  return getBrandConfig(hostname).name;
}

export function getShortAppName(hostname: string): string {
  return getBrandConfig(hostname).shortName;
}

export function getDescription(hostname: string): string {
  return getBrandConfig(hostname).description;
}

export function getKeywords(hostname: string): string {
  return getBrandConfig(hostname).keywords.join(', ');
}
