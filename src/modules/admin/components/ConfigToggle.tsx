import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    color?: string; // class for color, e.g., 'toggle-primary', 'toggle-error'
}

export default function ConfigToggle({ label, description, checked, onChange, disabled, color = 'toggle-primary' }: Props) {
    return (
        <div className={cn(
            "form-control w-full p-4 rounded-xl border transition-all",
            "bg-card border-border hover:shadow-sm",
            checked ? "border-primary/20 bg-primary/5" : ""
        )}>
            <label className="label cursor-pointer flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <span className="label-text font-medium text-base text-foreground">{label}</span>
                    {description && <span className="label-text-alt text-muted-foreground">{description}</span>}
                </div>
                <input
                    type="checkbox"
                    className={cn(`toggle ${color}`, checked ? "toggle-primary" : "")}
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                />
            </label>
        </div>
    );
}
