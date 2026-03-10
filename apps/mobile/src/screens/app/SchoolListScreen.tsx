import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const SchoolListScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Browse Schools</Text>
      <Text style={styles.subtitle}>School list implementation is part of task 3.2.2.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
});
