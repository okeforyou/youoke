import React from 'react';

interface ConfigToggleProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    color?: string; // e.g., 'toggle-primary', 'toggle-error'
}

const ConfigToggle: React.FC<ConfigToggleProps> = ({
    label,
    description,
    checked,
    onChange,
    color = 'toggle-primary'
}) => {
    return (
        <div className="form-control">
            <label className="label cursor-pointer items-start gap-4">
                <div className="flex-1">
                    <span className="label-text font-bold text-gray-900">{label}</span>
                    {description && (
                        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                    )}
                </div>
                <input
                    type="checkbox"
                    className={`toggle ${color}`}
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
            </label>
        </div>
    );
};

export default ConfigToggle;
