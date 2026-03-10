import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { schoolsApi, type SchoolDetails } from '../../api/schools';
import { ApiClientError } from '../../api/client/apiClient';

type Props = NativeStackScreenProps<RootStackParamList, 'SchoolDetail'>;

export const SchoolDetailScreen = ({ route }: Props) => {
  const [school, setSchool] = useState<SchoolDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchoolDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await schoolsApi.getSchoolDetails(route.params.schoolId);
      setSchool(response);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load school details.');
      }
    } finally {
      setLoading(false);
    }
  }, [route.params.schoolId]);

  useEffect(() => {
    void loadSchoolDetails();
  }, [loadSchoolDetails]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!school) {
    return (
      <View style={styles.centered}>
        <Text style={styles.helperText}>School not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{school.name}</Text>
      <Text style={styles.subtitle}>{school.address}</Text>
      <Text style={styles.metaText}>City: {school.city ?? 'N/A'}</Text>
      <Text style={styles.metaText}>
        Service: {school.isServiceAvailable ? 'Available' : 'Unavailable'}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Plans</Text>
        {school.mealPlans.length === 0 ? (
          <Text style={styles.helperText}>No active meal plans currently available.</Text>
        ) : (
          school.mealPlans.map(plan => (
            <View style={styles.planCard} key={plan.id}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planMeta}>
                {plan.currency} {plan.pricePerDay}/day
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#334155',
  },
  metaText: {
    marginTop: 8,
    fontSize: 14,
    color: '#475569',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  helperText: {
    color: '#64748B',
    fontSize: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  planCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 10,
  },
  planName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  planMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#475569',
  },
});
