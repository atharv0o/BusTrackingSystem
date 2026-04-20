import { extendTheme } from 'native-base';
import { COLORS, FONT_FAMILY } from './constants';

export const appTheme = extendTheme({
  colors: {
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: COLORS.primary,
      600: '#1D4ED8',
      700: '#1E40AF',
      800: '#1E3A8A',
      900: '#172554'
    }
  },
  config: {
    initialColorMode: 'light'
  },
  components: {
    Text: {
      baseStyle: {
        color: COLORS.text
      }
    },
    Button: {
      defaultProps: {
        borderRadius: 'xl'
      }
    },
    Input: {
      defaultProps: {
        borderRadius: 'xl',
        variant: 'filled',
        _focus: {
          borderColor: COLORS.primary
        }
      }
    }
  },
  fontConfig: {
    System: {
      400: {
        normal: FONT_FAMILY.web
      }
    }
  },
  fonts: {
    heading: FONT_FAMILY.web,
    body: FONT_FAMILY.web,
    mono: FONT_FAMILY.web
  }
});

export const screenStyles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: COLORS.background
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  }
};

export const statusColors = {
  idle: COLORS.mutedText,
  active: COLORS.success,
  paused: COLORS.warning,
  completed: COLORS.danger,
  tracking: COLORS.info
};
