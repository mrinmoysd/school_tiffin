export const lightThemeColors = {
  brand: {
    green500: '#22C55E',
    green600: '#16A34A',
    green700: '#15803D',
    blue500: '#3B82F6',
    blue700: '#1D4ED8',
  },
  neutral: {
    white: '#FFFFFF',
    slate50: '#F8FAFC',
    slate100: '#F1F5F9',
    slate200: '#E2E8F0',
    slate300: '#CBD5E1',
    slate400: '#94A3B8',
  },
  action: {
    primary: '#16A34A',
    primaryPressed: '#15803D',
  },
  intent: {
    success: '#16A34A',
    successStrong: '#15803D',
    info: '#3B82F6',
    infoStrong: '#1D4ED8',
    warning: '#F59E0B',
    danger: '#DC2626',
  },
  surface: {
    infoAlt: '#F8FBFF',
    infoSofter: '#F0F9FF',
    infoSoft: '#E0F2FE',
    infoSubtle: '#DBEAFE',
    successSubtle: '#DCFCE7',
    warningSoft: '#FEF3C7',
    warningSubtle: '#FFEDD5',
    dangerSoft: '#FEF2F2',
    dangerSubtle: '#FEE2E2',
    violetSubtle: '#EDE9FE',
  },
  border: {
    infoAccent: '#38BDF8',
    infoSoft: '#7DD3FC',
    info: '#93C5FD',
    infoLight: '#BAE6FD',
    danger: '#FECACA',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#64748B',
    subtle: '#334155',
    success: '#166534',
    warning: '#92400E',
    danger: '#991B1B',
    dangerStrong: '#B91C1C',
    infoDark: '#0C4A6E',
    infoDeeper: '#075985',
  },
  overlay: {
    scrim: 'rgba(15, 23, 42, 0.45)',
    edgeFadeTint: 'rgba(15, 23, 42, 0.9)',
  },
} as const;

type DeepStringRecord<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringRecord<T[K]> : string;
};

export type AppThemeColors = DeepStringRecord<typeof lightThemeColors>;

export const darkThemeColors: AppThemeColors = {
  brand: {
    green500: '#34D399',
    green600: '#22C55E',
    green700: '#16A34A',
    blue500: '#60A5FA',
    blue700: '#3B82F6',
  },
  neutral: {
    white: '#0F172A',
    slate50: '#020617',
    slate100: '#0F172A',
    slate200: '#1E293B',
    slate300: '#334155',
    slate400: '#64748B',
  },
  action: {
    primary: '#22C55E',
    primaryPressed: '#16A34A',
  },
  intent: {
    success: '#22C55E',
    successStrong: '#16A34A',
    info: '#60A5FA',
    infoStrong: '#3B82F6',
    warning: '#FBBF24',
    danger: '#F87171',
  },
  surface: {
    infoAlt: '#0B1220',
    infoSofter: '#172554',
    infoSoft: '#1E3A8A',
    infoSubtle: '#1E40AF',
    successSubtle: '#14532D',
    warningSoft: '#78350F',
    warningSubtle: '#7C2D12',
    dangerSoft: '#7F1D1D',
    dangerSubtle: '#991B1B',
    violetSubtle: '#4C1D95',
  },
  border: {
    infoAccent: '#38BDF8',
    infoSoft: '#3B82F6',
    info: '#2563EB',
    infoLight: '#1D4ED8',
    danger: '#7F1D1D',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    muted: '#94A3B8',
    subtle: '#E2E8F0',
    success: '#86EFAC',
    warning: '#FCD34D',
    danger: '#FCA5A5',
    dangerStrong: '#F87171',
    infoDark: '#BFDBFE',
    infoDeeper: '#93C5FD',
  },
  overlay: {
    scrim: 'rgba(2, 6, 23, 0.7)',
    edgeFadeTint: 'rgba(248, 250, 252, 0.9)',
  },
} as const;
export const themeColors: AppThemeColors = lightThemeColors;
