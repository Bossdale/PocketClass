import { forwardRef } from 'react';
import { Pressable, View } from 'react-native';
import { Link, usePathname, type Href } from 'expo-router';
import { cn } from '../lib/utils';

interface NavLinkProps {
  href: Href<string | object>;
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}

const NavLink = forwardRef<View, NavLinkProps>(
  ({ href, className, activeClassName, children, ...props }, ref) => {
    // We check the current mobile route instead of using react-router-dom
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
      // Link must wrap a Pressable using the 'asChild' prop in Expo Router
      <Link href={href} asChild>
        <Pressable
          ref={ref}
          className={cn(className, isActive && activeClassName)}
          {...props}
        >
          {children}
        </Pressable>
      </Link>
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };