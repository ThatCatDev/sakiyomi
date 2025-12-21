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
    description: 'Free online story point estimation tool for agile teams. No signup required. Real-time team voting for sprint planning and collaboration.',
    keywords: ['story points', 'story point estimation', 'agile estimation', 'sprint planning', 'scrum estimation', 'team estimation', 'agile team tools', 'online estimation tool', 'free estimation tool', 'agile voting', 'sprint estimation'],
  },
  'www.storypoint-estimate.com': {
    name: 'Storypoint Estimate',
    shortName: 'SP Estimate',
    tagline: 'Free Online Story Point Estimation',
    description: 'Free online story point estimation tool for agile teams. No signup required. Real-time team voting for sprint planning and collaboration.',
    keywords: ['story points', 'story point estimation', 'agile estimation', 'sprint planning', 'scrum estimation', 'team estimation', 'agile team tools', 'online estimation tool', 'free estimation tool', 'agile voting', 'sprint estimation'],
  },
};

const DEFAULT_BRAND: BrandConfig = {
  name: 'Sakiyomi',
  shortName: 'Sakiyomi',
  tagline: 'Free Online Story Point Estimation',
  description: 'Free online story point estimation tool for agile teams. No signup required. Real-time team voting for sprint planning and collaboration.',
  keywords: ['story points', 'story point estimation', 'agile estimation', 'sprint planning', 'scrum estimation', 'team estimation', 'agile team tools', 'online estimation tool', 'free estimation tool', 'agile voting', 'sprint estimation'],
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
