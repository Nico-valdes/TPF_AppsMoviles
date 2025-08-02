/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    // Mapear nombres de colores a nuestra nueva estructura
    const colorMap: { [key: string]: string } = {
      text: Colors.textPrimary,
      background: Colors.background,
      tint: Colors.secondary,
      tabIconDefault: Colors.textTertiary,
      tabIconSelected: Colors.secondary,
    };
    
    return colorMap[colorName] || Colors.textPrimary;
  }
}
