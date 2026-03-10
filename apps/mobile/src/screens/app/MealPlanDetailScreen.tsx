import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { mealPlansApi, type MealPlanDetails, type MealPlanMenuItem } from '../../api/meal-plans';
import { ApiClientError } from '../../api/client/apiClient';

type Props = NativeStackScreenProps<RootStackParamList, 'MealPlanDetail'>;

type MenuGroup = {
  title: string;
  items: MealPlanMenuItem[];
};

const { width: screenWidth } = Dimensions.get('window');
const carouselWidth = screenWidth - 32;

const formatAmount = (value: number | string, currency: string) => `${currency} ${value}`;

const getMenuGroupKey = (item: MealPlanMenuItem) => {
  if (item.dayNumber !== null) {
    return `day-${item.dayNumber}`;
  }

  if (item.dayOfWeek) {
    return `dow-${item.dayOfWeek}`;
  }

  return 'misc';
};

const getMenuGroupTitle = (item: MealPlanMenuItem) => {
  if (item.dayNumber !== null) {
    return `Day ${item.dayNumber}`;
  }

  if (item.dayOfWeek) {
    return item.dayOfWeek;
  }

  return 'General';
};

export const MealPlanDetailScreen = ({ route, navigation }: Props) => {
  const [mealPlan, setMealPlan] = useState<MealPlanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const loadMealPlan = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await mealPlansApi.getMealPlanById(route.params.mealPlanId);
      setMealPlan(response);
      setCarouselIndex(0);
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

  const carouselImages = useMemo(() => {
    if (!mealPlan) {
      return [];
    }

    const menuImages = mealPlan.menuItems
      .map(item => item.imageUrl)
      .filter((value): value is string => Boolean(value));

    if (mealPlan.imageUrl) {
      return [mealPlan.imageUrl, ...menuImages];
    }

    return menuImages;
  }, [mealPlan]);

  const groupedMenuItems = useMemo(() => {
    if (!mealPlan) {
      return [];
    }

    const groups = new Map<string, MenuGroup>();

    mealPlan.menuItems.forEach(item => {
      const key = getMenuGroupKey(item);
      const title = getMenuGroupTitle(item);
      const existing = groups.get(key);

      if (existing) {
        existing.items.push(item);
        return;
      }

      groups.set(key, {
        title,
        items: [item],
      });
    });

    return Array.from(groups.values());
  }, [mealPlan]);

  const onCarouselScrollEnd = (offsetX: number) => {
    if (carouselImages.length === 0) {
      return;
    }

    const index = Math.max(
      0,
      Math.min(carouselImages.length - 1, Math.round(offsetX / carouselWidth)),
    );
    setCarouselIndex(index);
  };

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
        <Pressable onPress={() => void loadMealPlan()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
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
      {mealPlan.description ? <Text style={styles.description}>{mealPlan.description}</Text> : null}

      <View style={styles.summaryCard}>
        <Text style={styles.metaText}>Type: {mealPlan.planType}</Text>
        <Text style={styles.metaText}>Duration: {mealPlan.durationDays} days</Text>
        <Text style={styles.metaText}>
          Price/day: {formatAmount(mealPlan.pricePerDay, mealPlan.currency)}
        </Text>
        <Text style={styles.metaText}>
          Total Price: {formatAmount(mealPlan.totalPrice, mealPlan.currency)}
        </Text>
      </View>

      {carouselImages.length > 0 ? (
        <View style={styles.carouselSection}>
          <Text style={styles.sectionTitle}>Meal Images</Text>
          <FlatList
            data={carouselImages}
            keyExtractor={(item, index) => `${item}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={event => onCarouselScrollEnd(event.nativeEvent.contentOffset.x)}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.carouselImage} resizeMode="cover" />
            )}
          />
          <View style={styles.dotsRow}>
            {carouselImages.map((_, index) => (
              <View key={index} style={[styles.dot, index === carouselIndex && styles.dotActive]} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Menu Items</Text>
        {groupedMenuItems.length === 0 ? (
          <Text style={styles.helperText}>No menu items available.</Text>
        ) : (
          groupedMenuItems.map(group => (
            <View key={group.title} style={styles.groupCard}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.items.map(item => (
                <View style={styles.menuItemCard} key={item.id}>
                  <Text style={styles.menuTitle}>{item.name}</Text>
                  <Text style={styles.menuText}>{item.items}</Text>
                  {item.description ? (
                    <Text style={styles.menuMeta}>Description: {item.description}</Text>
                  ) : null}
                  {item.calories !== null && item.calories !== undefined ? (
                    <Text style={styles.menuMeta}>Nutritional Info: {item.calories} kcal</Text>
                  ) : null}
                  {item.allergenInfo ? (
                    <Text style={styles.menuMeta}>Allergen Info: {item.allergenInfo}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ))
        )}
      </View>

      <Pressable
        style={[
          styles.subscribeNowButton,
          !mealPlan.school?.id && styles.subscribeNowButtonDisabled,
        ]}
        onPress={() =>
          navigation.navigate('SelectStudent', {
            mealPlanId: mealPlan.id,
            schoolId: mealPlan.school?.id ?? '',
          })
        }
        disabled={!mealPlan.school?.id}
      >
        <Text style={styles.subscribeNowLabel}>Subscribe Now</Text>
      </Pressable>
      {!mealPlan.school?.id ? (
        <Text style={styles.helperText}>
          Subscription unavailable because school information is missing for this plan.
        </Text>
      ) : null}
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
    paddingBottom: 28,
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
  description: {
    marginTop: 8,
    color: '#475569',
    fontSize: 14,
  },
  summaryCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  metaText: {
    marginTop: 6,
    color: '#334155',
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
  carouselSection: {
    marginTop: 18,
  },
  carouselImage: {
    width: carouselWidth,
    height: 190,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#E2E8F0',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#0EA5E9',
  },
  groupCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 10,
  },
  groupTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  menuItemCard: {
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    marginBottom: 8,
  },
  menuTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuText: {
    color: '#475569',
    fontSize: 13,
  },
  menuMeta: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
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
    marginBottom: 10,
  },
  retryText: {
    color: '#0369A1',
    fontSize: 14,
    fontWeight: '600',
  },
  subscribeNowButton: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeNowButtonDisabled: {
    opacity: 0.6,
  },
  subscribeNowLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
