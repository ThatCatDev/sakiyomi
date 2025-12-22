// Branding configuration based on domain

export interface BrandConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  keywords: string[];
  docsUrl: string;
}

const BRAND_CONFIG: Record<string, BrandConfig> = {
  'storypoint-estimate.com': {
    name: 'Storypoint Estimate',
    shortName: 'SP Estimate',
    tagline: 'Online Story Point Estimation',
    description: 'Online story point estimation tool for agile teams. No signup required. Real-time team voting for sprint planning and collaboration.',
    keywords: ['story points', 'story point estimation', 'agile estimation', 'sprint planning', 'scrum estimation', 'team estimation', 'agile team tools', 'online estimation tool', 'agile voting', 'sprint estimation'],
    docsUrl: 'https://docs.storypoint-estimate.com',
  },
  'www.storypoint-estimate.com': {
    name: 'Storypoint Estimate',
    shortName: 'SP Estimate',
    tagline: 'Online Story Point Estimation',
    description: 'Online story point estimation tool for agile teams. No signup required. Real-time team voting for sprint planning and collaboration.',
    keywords: ['story points', 'story point estimation', 'agile estimation', 'sprint planning', 'scrum estimation', 'team estimation', 'agile team tools', 'online estimation tool', 'agile voting', 'sprint estimation'],
    docsUrl: 'https://docs.storypoint-estimate.com',
  },
};

const DEFAULT_BRAND: BrandConfig = {
  name: 'Sakiyomi',
  shortName: 'Sakiyomi',
  tagline: 'Online Story Point Estimation',
  description: 'Online story point estimation tool for agile teams. No signup required. Real-time team voting for sprint planning and collaboration.',
  keywords: ['story points', 'story point estimation', 'agile estimation', 'sprint planning', 'scrum estimation', 'team estimation', 'agile team tools', 'online estimation tool', 'agile voting', 'sprint estimation'],
  docsUrl: 'https://docs.sakiyomi.dev',
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

export function getDocsUrl(hostname: string): string {
  return getBrandConfig(hostname).docsUrl;
}
