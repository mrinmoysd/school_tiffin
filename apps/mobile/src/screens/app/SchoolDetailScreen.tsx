import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ApiClientError } from '../../api/client/apiClient';
import { schoolsApi, type SchoolDetails } from '../../api/schools';
import { mealPlansApi, type MealPlanSummary } from '../../api/meal-plans';
import { useAppTheme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SchoolDetail'>;

const formatOperatingDays = (operatingDays: string[] | string) => {
  if (Array.isArray(operatingDays)) {
    return operatingDays.join(', ');
  }

  return operatingDays.replace(/,/g, ', ');
};

const formatAmount = (value: number | string, currency: string) => `${currency} ${value}`;

export const SchoolDetailScreen = ({ route, navigation }: Props) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [school, setSchool] = useState<SchoolDetails | null>(null);
  const [mealPlans, setMealPlans] = useState<MealPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [schoolResponse, mealPlansResponse] = await Promise.all([
        schoolsApi.getSchoolDetails(route.params.schoolId),
        mealPlansApi.getMealPlansBySchool(route.params.schoolId),
      ]);

      setSchool(schoolResponse);
      setMealPlans(mealPlansResponse);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load school details right now.');
      }
    } finally {
      setLoading(false);
    }
  }, [route.params.schoolId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.action.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={() => void loadData()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.schoolCard}>
        <Text style={styles.title}>{school.name}</Text>
        <Text style={styles.metaText}>{school.address}</Text>
        <Text style={styles.metaText}>
          {school.city ?? 'N/A'}
          {school.state ? `, ${school.state}` : ''}
          {school.pincode ? ` - ${school.pincode}` : ''}
        </Text>
        <Text style={styles.metaText}>Contact: {school.contactPhone ?? 'N/A'}</Text>
        <Text style={styles.metaText}>Email: {school.contactEmail ?? 'N/A'}</Text>
        <Text style={styles.metaText}>
          Operating Days: {formatOperatingDays(school.operatingDays)}
        </Text>
        <Text style={styles.metaText}>
          Delivery Instructions: {school.deliveryInstructions?.trim() || 'Not provided'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Plans</Text>
        {mealPlans.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.helperText}>No active meal plans available for this school.</Text>
          </View>
        ) : (
          mealPlans.map(plan => (
            <View style={styles.planCard} key={plan.id}>
              {plan.imageUrl ? (
                <Image
                  source={{ uri: plan.imageUrl }}
                  style={styles.planImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.planImageFallback}>
                  <Text style={styles.planImageFallbackText}>
                    {plan.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.planBody}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planMeta}>Type: {plan.planType}</Text>
                <Text style={styles.planMeta}>Duration: {plan.durationDays} days</Text>
                <Text style={styles.planMeta}>
                  Price/day: {formatAmount(plan.pricePerDay, plan.currency)}
                </Text>

                <View style={styles.actionRow}>
                  <Pressable
                    style={[styles.actionButton, styles.menuButton]}
                    onPress={() => navigation.navigate('MealPlanDetail', { mealPlanId: plan.id })}
                  >
                    <Text style={styles.menuButtonLabel}>View Menu</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, styles.subscribeButton]}
                    onPress={() =>
                      navigation.navigate('SelectStudent', {
                        mealPlanId: plan.id,
                        schoolId: school.id,
                      })
                    }
                  >
                    <Text style={styles.subscribeButtonLabel}>Subscribe</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.neutral.slate50,
    },
    content: {
      padding: 16,
      paddingBottom: 24,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.neutral.slate50,
      paddingHorizontal: 24,
    },
    schoolCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      padding: 14,
    },
    title: {
      color: colors.text.primary,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 8,
    },
    metaText: {
      color: colors.text.secondary,
      fontSize: 13,
      marginBottom: 4,
    },
    section: {
      marginTop: 18,
    },
    sectionTitle: {
      color: colors.text.primary,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 10,
    },
    emptyCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      padding: 14,
    },
    helperText: {
      color: colors.text.muted,
      fontSize: 14,
    },
    errorText: {
      color: colors.intent.danger,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 10,
    },
    retryText: {
      color: colors.intent.infoStrong,
      fontSize: 14,
      fontWeight: '600',
    },
    planCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      padding: 12,
      marginBottom: 10,
      flexDirection: 'row',
    },
    planImage: {
      width: 64,
      height: 64,
      borderRadius: 10,
    },
    planImageFallback: {
      width: 64,
      height: 64,
      borderRadius: 10,
      backgroundColor: colors.surface.infoSoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    planImageFallbackText: {
      color: colors.intent.infoStrong,
      fontSize: 22,
      fontWeight: '700',
    },
    planBody: {
      marginLeft: 10,
      flex: 1,
    },
    planName: {
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 2,
    },
    planMeta: {
      color: colors.text.secondary,
      fontSize: 12,
      marginTop: 2,
    },
    actionRow: {
      marginTop: 10,
      flexDirection: 'row',
    },
    actionButton: {
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
    },
    menuButton: {
      backgroundColor: colors.surface.infoSubtle,
      marginRight: 8,
    },
    menuButtonLabel: {
      color: colors.intent.infoStrong,
      fontSize: 13,
      fontWeight: '600',
    },
    subscribeButton: {
      backgroundColor: colors.surface.successSubtle,
    },
    subscribeButtonLabel: {
      color: colors.text.success,
      fontSize: 13,
      fontWeight: '600',
    },
  });
