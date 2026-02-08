import React from "react";
import { IconType } from "react-icons";

interface IconProps {
  icon: IconType;
  size?: number;
  className?: string;
  [key: string]: any; // Allow any additional props
}

/**
 * Icon wrapper component to fix TypeScript issues with react-icons
 * Usage: <Icon icon={FiHome} size={20} className="text-red-500" />
 */
const Icon: React.FC<IconProps> = ({ icon: IconComponent, ...props }) => {
  return React.createElement(IconComponent as any, props);
};

export default Icon;
