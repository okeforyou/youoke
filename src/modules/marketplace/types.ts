import { ComponentType } from 'react';

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

    // Visibility: 'core' modules are typically hidden from the store
    isHidden?: boolean;

    // Business Logic
    pricing: ModulePricing;

    // Feature flags enabled by this module
    features?: Record<string, boolean | string | number>;

    // Dependency Requirements
    requires?: string[];
}
