import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['schooltiffin://', 'https://schooltiffin.app'],
  config: {
    screens: {
      Login: 'login',
      ResetPassword: {
        path: 'reset-password',
        parse: {
          token: (value: string) => value,
        },
      },
    },
  },
};
