import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/auth';

export const HomeScreen = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to School Tiffin</Text>
      <Text style={styles.subtitle}>{user?.email ?? 'You are logged in.'}</Text>
      <AppButton title="Logout" onPress={() => void dispatch(logout())} style={styles.button} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop: 4,
  },
});
