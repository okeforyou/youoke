import React from 'react'

interface ChipProps {
  label: string;
  className: string;
  onClick?: () => void;
}

const Chip: React.FC<ChipProps> = ({ label, className, onClick }) => {
  return (
    <div className="chip-container">
      <div className={`chip ${className}`} onClick={onClick}>
        {label}
        <div className="sparkle sparkle1"></div>
        <div className="sparkle sparkle2"></div>
        <div className="sparkle sparkle3"></div>
        <div className="sparkle sparkle4"></div>
      </div>
    </div>
  );
};

export default Chip;
