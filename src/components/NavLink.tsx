import Link, { LinkProps } from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps extends LinkProps {
    children: ReactNode;
    className?: string;
    activeClassName?: string;
}

export const NavLink = ({ children, className, activeClassName, ...props }: NavLinkProps) => {
    const { pathname } = useRouter();
    const isActive = pathname === props.href || pathname.startsWith(`${props.href}/`);

    return (
        <Link {...props} className={cn(className, isActive && activeClassName)}>
            {children}
        </Link>
    );
};
