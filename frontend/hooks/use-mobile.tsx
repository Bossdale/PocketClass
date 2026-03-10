import { useWindowDimensions } from 'react-native';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const { width } = useWindowDimensions();
  
  // Returns true if the screen width is less than the breakpoint
  return width < MOBILE_BREAKPOINT;
}