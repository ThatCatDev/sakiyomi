// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Sakiyomi Docs',
			description: 'Documentation for Sakiyomi - an open-source story point estimation tool for agile teams.',
			logo: {
				src: './src/assets/logo.svg',
				alt: 'Sakiyomi',
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
						{ label: 'Room Participants', slug: 'features/team-management' },
						{ label: 'Teams', slug: 'features/teams' },
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
