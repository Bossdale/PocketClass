import React, { forwardRef } from "react";
import { Pressable, PressableProps, StyleProp, ViewStyle, View } from "react-native";
import { Link, usePathname, type Href } from "expo-router";

// Extend standard Pressable props, adding custom style props for active states
export interface NavLinkProps extends Omit<PressableProps, "style"> {
  href: Href;
  style?: StyleProp<ViewStyle>;
  activeStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const NavLink = forwardRef<View, NavLinkProps>(
  ({ href, style, activeStyle, children, ...props }, ref) => {
    // usePathname gets the current active route from Expo Router
    const pathname = usePathname();
    
    // Check if the current route matches the link's target destination
    // (You can adjust this to `pathname.startsWith(String(href))` if you want parent routes to stay active)
    const isActive = pathname === href;

    return (
      // Link wraps the Pressable. `asChild` tells Link to pass routing behavior down to the Pressable
      <Link href={href} asChild>
        <Pressable
          ref={ref}
          // Combine base styles with active styles if the route matches
          style={[
            style,
            isActive && activeStyle
          ]}
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