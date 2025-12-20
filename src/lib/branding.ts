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
    tagline: 'Estimate stories together',
    description: 'Free real-time story point estimation tool for agile teams. Fast, collaborative sprint planning with your team.',
    keywords: ['story points', 'agile estimation', 'sprint planning', 'scrum', 'team collaboration', 'story estimation'],
  },
  'www.storypoint-estimate.com': {
    name: 'Storypoint Estimate',
    shortName: 'SP Estimate',
    tagline: 'Estimate stories together',
    description: 'Free real-time story point estimation tool for agile teams. Fast, collaborative sprint planning with your team.',
    keywords: ['story points', 'agile estimation', 'sprint planning', 'scrum', 'team collaboration', 'story estimation'],
  },
};

const DEFAULT_BRAND: BrandConfig = {
  name: 'Sakiyomi',
  shortName: 'Sakiyomi',
  tagline: 'Estimate stories together',
  description: 'Free real-time story point estimation tool for agile teams. Fast, collaborative sprint planning with your team.',
  keywords: ['story points', 'agile estimation', 'sprint planning', 'scrum', 'team collaboration', 'story estimation'],
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
