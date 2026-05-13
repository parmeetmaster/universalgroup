import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7c3aed",
    800: "#6d28d9",
    900: "#4c1d95",
  },
  sidebar: {
    bg: "#fefeff",
    hover: "#f5f3ff",
    active: "#ede9fe",
    text: "#94a3b8",
    activeText: "#7c3aed",
  },
  dashboard: {
    bg: "#f4f2ff",
    card: "#ffffff",
    border: "#e8e4f3",
    muted: "#f1f0f7",
  },
};

const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
};

const styles = {
  global: {
    body: {
      bg: "dashboard.bg",
      color: "gray.700",
    },
    "*::-webkit-scrollbar": {
      width: "6px",
    },
    "*::-webkit-scrollbar-track": {
      bg: "transparent",
    },
    "*::-webkit-scrollbar-thumb": {
      bg: "brand.200",
      borderRadius: "full",
    },
  },
};

const components = {
  Button: {
    defaultProps: {
      colorScheme: "brand",
    },
  },
};

export const theme = extendTheme({
  config,
  colors,
  fonts,
  styles,
  components,
});
