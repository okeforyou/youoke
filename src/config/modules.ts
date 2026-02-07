import { ComponentType } from 'react';
import {
    MusicalNoteIcon,
    DevicePhoneMobileIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';

export type ModuleCategory = 'music' | 'utility' | 'social' | 'core';
export type ModuleTier = 'free' | 'paid' | 'enterprise';
export type BillingPeriod = 'one-time' | 'monthly' | 'yearly';

export interface ModulePricing {
    tier: ModuleTier;
    priceTHB: number;
    billingPeriod: BillingPeriod;
}

export interface ModuleDefinition {
    id: string;
    name: string;
    description: string;
    icon?: ComponentType<{ className?: string }>;
    version: string;
    category: ModuleCategory;
    isHidden?: boolean;
    pricing: ModulePricing;
    features?: Record<string, boolean | string | number>;
    requires?: string[];
}

export const MODULES: ModuleDefinition[] = [
    // --- CORE MODULES (Hidden) ---
    {
        id: 'core-player',
        name: 'Universal Player',
        description: 'Core playback engine for YouOke.',
        version: '1.0.0',
        category: 'core',
        isHidden: true,
        pricing: { tier: 'free', priceTHB: 0, billingPeriod: 'one-time' }
    },

    // --- PLUGINS (Visible in Store) ---
    {
        id: 'youtube-theme',
        name: 'YouTube Karaoke',
        description: 'Access millions of songs from YouTube with instant search and karaoke mode.',
        icon: MusicalNoteIcon,
        version: '1.2.0',
        category: 'music',
        pricing: { tier: 'paid', priceTHB: 50, billingPeriod: 'monthly' }
    },
    {
        id: 'remote-control',
        name: 'Remote Control',
        description: 'Control the player from your mobile device via QR Code.',
        icon: DevicePhoneMobileIcon,
        version: '1.1.0',
        category: 'utility',
        pricing: { tier: 'free', priceTHB: 0, billingPeriod: 'one-time' }
    },
    {
        id: 'party-system',
        name: 'Party Mode',
        description: 'Allow friends to join and queue songs together.',
        icon: UserGroupIcon,
        version: '1.0.0',
        category: 'social',
        pricing: { tier: 'free', priceTHB: 0, billingPeriod: 'one-time' }
    }
];

export const getModuleInfo = (id: string) => MODULES.find(m => m.id === id);
