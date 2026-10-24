import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SmartOPD & DentalFlow Clinical Cockpit',
    short_name: 'SmartOPD',
    description: 'High-speed clinical cockpit and waiting room orchestration platform for General Physicians and Dental Practices.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#06b6d4',
    orientation: 'any',
    categories: ['medical', 'health', 'productivity'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '192x192 512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Receptionist POS',
        short_name: 'Reception',
        description: 'Fast keyboard-first check-in & seat allocator',
        url: '/desk/8e14c2a0-4f1a-4b9e-9c12-1a2b3c4d5e6f',
        icons: [{ src: '/icon.svg', sizes: 'any' }],
      },
      {
        name: 'Waiting Room TV',
        short_name: 'Smart TV',
        description: '1080p operatory matrix & voice announcements',
        url: '/tv/8e14c2a0-4f1a-4b9e-9c12-1a2b3c4d5e6f',
        icons: [{ src: '/icon.svg', sizes: 'any' }],
      },
      {
        name: 'Doctor Mobile PWA',
        short_name: 'Doctor Mobile',
        description: '1-Thumb clinical cockpit, Odontogram & CamRx',
        url: '/mobile/a1111111-2222-3333-4444-555555555555',
        icons: [{ src: '/icon.svg', sizes: 'any' }],
      },
      {
        name: 'Patient Live Tracker',
        short_name: 'Patient Tracker',
        description: 'Zero-App QR queue position & seat tracker',
        url: '/q/smartopd-demo',
        icons: [{ src: '/icon.svg', sizes: 'any' }],
      },
    ],
  };
}
