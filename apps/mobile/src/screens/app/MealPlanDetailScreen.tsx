import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { mealPlansApi, type MealPlanDetails } from '../../api/meal-plans';
import { ApiClientError } from '../../api/client/apiClient';

type Props = NativeStackScreenProps<RootStackParamList, 'MealPlanDetail'>;

const formatAmount = (value: number | string, currency: string) => `${currency} ${value}`;

export const MealPlanDetailScreen = ({ route }: Props) => {
  const [mealPlan, setMealPlan] = useState<MealPlanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMealPlan = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await mealPlansApi.getMealPlanById(route.params.mealPlanId);
      setMealPlan(response);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load meal plan details.');
      }
    } finally {
      setLoading(false);
    }
  }, [route.params.mealPlanId]);

  useEffect(() => {
    void loadMealPlan();
  }, [loadMealPlan]);

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

  if (!mealPlan) {
    return (
      <View style={styles.centered}>
        <Text style={styles.helperText}>Meal plan not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{mealPlan.name}</Text>
      <Text style={styles.metaText}>Type: {mealPlan.planType}</Text>
      <Text style={styles.metaText}>Duration: {mealPlan.durationDays} days</Text>
      <Text style={styles.metaText}>
        Price/day: {formatAmount(mealPlan.pricePerDay, mealPlan.currency)}
      </Text>
      <Text style={styles.metaText}>
        Total: {formatAmount(mealPlan.totalPrice, mealPlan.currency)}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Menu Items</Text>
        {mealPlan.menuItems.length === 0 ? (
          <Text style={styles.helperText}>No menu items available.</Text>
        ) : (
          mealPlan.menuItems.map(item => (
            <View style={styles.menuCard} key={item.id}>
              <Text style={styles.menuTitle}>{item.name}</Text>
              <Text style={styles.menuText}>{item.items}</Text>
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
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '700',
  },
  metaText: {
    marginTop: 6,
    color: '#475569',
    fontSize: 14,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  helperText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  menuCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 10,
  },
  menuTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuText: {
    color: '#475569',
    fontSize: 13,
  },
});
