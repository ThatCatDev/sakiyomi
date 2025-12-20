// Branding configuration based on domain

export interface BrandConfig {
  name: string;
  shortName: string;
}

const BRAND_CONFIG: Record<string, BrandConfig> = {
  'storypoint-estimate.com': {
    name: 'Storypoint Estimate',
    shortName: 'SP Estimate',
  },
  'www.storypoint-estimate.com': {
    name: 'Storypoint Estimate',
    shortName: 'SP Estimate',
  },
};

const DEFAULT_BRAND: BrandConfig = {
  name: 'Sakiyomi',
  shortName: 'Sakiyomi',
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
