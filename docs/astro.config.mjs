// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Storypoint Estimate Docs',
			description: 'Documentation for Storypoint Estimate - free online story point estimation tool for agile teams.',
			logo: {
				src: './src/assets/logo.svg',
				alt: 'Storypoint Estimate',
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/thatcatdev/sakiyomi' },
			],
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
					],
				},
				{
					label: 'Features',
					items: [
						{ label: 'Creating Rooms', slug: 'features/creating-rooms' },
						{ label: 'Voting', slug: 'features/voting' },
						{ label: 'Team Management', slug: 'features/team-management' },
					],
				},
				{
					label: 'Self-Hosting',
					items: [
						{ label: 'Deployment Guide', slug: 'self-hosting/deployment' },
						{ label: 'Configuration', slug: 'self-hosting/configuration' },
					],
				},
			],
		}),
	],
});
