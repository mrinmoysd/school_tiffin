import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiClientError } from '../../api/client/apiClient';
import { studentsApi, type Student } from '../../api/students';
import { subscriptionsApi, type Subscription } from '../../api/subscriptions';
import { usersApi } from '../../api/users';
import { RootStackParamList } from '../../navigation/types';
import { useAppSelector } from '../../store/hooks';
import { themeColors } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
type BottomNavItem = {
  label: 'Schools' | 'Orders' | 'Subscription' | 'Profile';
  route: 'SchoolList' | 'Orders' | 'SubscriptionsList' | 'Profile';
};

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: 'Schools', route: 'SchoolList' },
  { label: 'Orders', route: 'Orders' },
  { label: 'Subscription', route: 'SubscriptionsList' },
  { label: 'Profile', route: 'Profile' },
];

const TAB_BAR_BASE_HEIGHT = 58;

const getGreetingName = (fullName: string | null | undefined, email: string | null | undefined) => {
  if (fullName && fullName.trim().length > 0) {
    return fullName.trim().split(' ')[0];
  }

  if (email && email.includes('@')) {
    return email.split('@')[0];
  }

  return 'User';
};

const getStudentDisplayName = (fullName: string) => {
  const normalized = fullName.trim().replace(/\s+/g, ' ');

  if (normalized.length <= 14) {
    return normalized;
  }

  const parts = normalized.split(' ');
  if (parts.length >= 2) {
    const firstName = parts[0];
    const surnameInitial = parts[parts.length - 1][0]?.toUpperCase() ?? '';
    return `${firstName} ${surnameInitial}...`;
  }

  return `${normalized.slice(0, 10)}...`;
};

const getCompactLabel = (value: string, maxLength = 16) => {
  const normalized = value.trim().replace(/\s+/g, ' ');

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const words = normalized.split(' ');
  let built = '';

  for (const word of words) {
    const separator = built.length > 0 ? ' ' : '';
    const fullCandidate = `${built}${separator}${word}`;

    if (fullCandidate.length <= maxLength) {
      built = fullCandidate;
      continue;
    }

    const remainingChars = maxLength - built.length - separator.length - 3;
    if (remainingChars > 0) {
      const partialWord = word.slice(0, remainingChars);
      return `${built}${separator}${partialWord}...`;
    }

    if (built.length > 0) {
      return `${built}...`;
    }

    return `${word.slice(0, Math.max(1, maxLength - 3))}...`;
  }

  return built;
};

export const HomeScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const user = useAppSelector(state => state.auth.user);
  const [greetingName, setGreetingName] = useState(() =>
    getGreetingName(user?.fullName, user?.email),
  );

  const [students, setStudents] = useState<Student[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHomeData = useCallback(async () => {
    try {
      setError(null);
      const [studentsResponse, subscriptionsResponse] = await Promise.all([
        studentsApi.getStudents(),
        subscriptionsApi.getSubscriptions('ACTIVE'),
      ]);

      setStudents(studentsResponse);
      setSubscriptions(subscriptionsResponse);

      if (studentsResponse.length === 0) {
        setSelectedStudentId(null);
      } else if (
        !selectedStudentId ||
        !studentsResponse.some(student => student.id === selectedStudentId)
      ) {
        setSelectedStudentId(studentsResponse[0].id);
      }
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
        return;
      }

      setError('Unable to load home data right now. Please try again.');
    }
  }, [selectedStudentId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);
      await loadHomeData();
      setInitialLoading(false);
    };

    void fetchInitialData();
  }, [loadHomeData]);

  useEffect(() => {
    setGreetingName(getGreetingName(user?.fullName, user?.email));
  }, [user?.email, user?.fullName]);

  useEffect(() => {
    const loadGreetingName = async () => {
      try {
        const profile = await usersApi.getCurrentUserProfile();
        setGreetingName(getGreetingName(profile.fullName, profile.email));
      } catch {
        // Keep best available local user name if profile call fails.
      }
    };

    void loadGreetingName();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  }, [loadHomeData]);

  const selectedStudent = useMemo(
    () => students.find(student => student.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  const filteredSubscriptions = useMemo(() => {
    if (!selectedStudentId) {
      return subscriptions;
    }

    return subscriptions.filter(subscription => subscription.studentId === selectedStudentId);
  }, [selectedStudentId, subscriptions]);

  if (initialLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={themeColors.action.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: TAB_BAR_BASE_HEIGHT + insets.bottom + 24 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <Text style={styles.welcomeInlineText}>Welcome {greetingName}</Text>
            <Pressable
              style={styles.profileIconButton}
              onPress={() => navigation.navigate('Profile')}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <Text style={styles.profileIconText}>{greetingName[0]}</Text>
            </Pressable>
          </View>
        </View>

        {students.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Students</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.studentsRow}
            >
              {students.map(student => (
                <Pressable
                  key={student.id}
                  style={[
                    styles.studentCard,
                    selectedStudentId === student.id && styles.studentCardSelected,
                  ]}
                  onPress={() => setSelectedStudentId(student.id)}
                >
                  <Text style={styles.studentName}>{getStudentDisplayName(student.fullName)}</Text>
                  <Text style={styles.studentSchool} numberOfLines={1} ellipsizeMode="tail">
                    {student.school?.name
                      ? getCompactLabel(student.school.name, 22)
                      : 'School not set'}
                  </Text>
                  <Text style={styles.studentGrade}>Grade {student.grade}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Subscriptions</Text>
            <Pressable onPress={() => void onRefresh()}>
              <Text style={styles.linkText}>Refresh</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {!error && filteredSubscriptions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No active subscriptions</Text>
              <Text style={styles.emptySubtitle}>
                {selectedStudent
                  ? `No active plan found for ${selectedStudent.fullName}.`
                  : 'Subscribe to a meal plan to get started.'}
              </Text>
            </View>
          ) : null}

          {filteredSubscriptions.map(subscription => (
            <View style={styles.subscriptionCard} key={subscription.id}>
              <Text style={styles.planName}>{subscription.mealPlan.name}</Text>
              <Text style={styles.subscriptionMeta}>{subscription.student.fullName}</Text>
              <Text style={styles.subscriptionMeta}>
                Deliveries: {subscription.remainingDays}/{subscription.totalDays} remaining
              </Text>

              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.actionButton, styles.pauseButton]}
                  onPress={() =>
                    navigation.navigate('PauseRequest', { subscriptionId: subscription.id })
                  }
                >
                  <Text style={styles.pauseButtonLabel}>Pause</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.detailsButton]}
                  onPress={() =>
                    navigation.navigate('SubscriptionDetail', { subscriptionId: subscription.id })
                  }
                >
                  <Text style={styles.detailsButtonLabel}>View Details</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { minHeight: TAB_BAR_BASE_HEIGHT + insets.bottom }]}>
        <View style={styles.bottomBarRow}>
          {BOTTOM_NAV_ITEMS.map(item => (
            <Pressable
              key={item.label}
              style={styles.bottomTab}
              onPress={() => navigation.navigate(item.route)}
            >
              <Text style={styles.bottomTabLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ height: insets.bottom }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: themeColors.neutral.slate50,
  },
  container: {
    flex: 1,
    backgroundColor: themeColors.neutral.slate50,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.neutral.slate50,
  },
  headerCard: {
    paddingHorizontal: 4,
    paddingTop: 6,
    marginBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  welcomeInlineText: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: themeColors.text.primary,
    marginRight: 12,
  },
  profileIconButton: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: themeColors.neutral.white,
    borderWidth: 1,
    borderColor: themeColors.neutral.slate300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: themeColors.text.primary,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.text.primary,
    marginBottom: 10,
  },
  linkText: {
    color: themeColors.intent.infoStrong,
    fontWeight: '600',
    fontSize: 14,
  },
  studentsRow: {
    paddingRight: 8,
  },
  studentCard: {
    width: 130,
    minHeight: 66,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.neutral.slate300,
    backgroundColor: themeColors.neutral.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    justifyContent: 'center',
  },
  studentCardSelected: {
    borderColor: themeColors.action.primary,
    backgroundColor: themeColors.surface.infoSoft,
  },
  studentName: {
    color: themeColors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  studentSchool: {
    color: themeColors.text.muted,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  studentGrade: {
    color: themeColors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  errorText: {
    color: themeColors.intent.danger,
    marginBottom: 10,
    fontSize: 13,
  },
  emptyCard: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: themeColors.neutral.white,
    borderWidth: 1,
    borderColor: themeColors.neutral.slate200,
  },
  emptyTitle: {
    color: themeColors.text.primary,
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 4,
  },
  emptySubtitle: {
    color: themeColors.text.muted,
    fontSize: 13,
  },
  subscriptionCard: {
    backgroundColor: themeColors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.neutral.slate200,
    padding: 14,
    marginBottom: 10,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: themeColors.text.primary,
    marginBottom: 2,
  },
  subscriptionMeta: {
    color: themeColors.text.secondary,
    fontSize: 13,
    marginTop: 2,
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
  },
  actionButton: {
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  pauseButton: {
    backgroundColor: themeColors.surface.warningSoft,
    marginRight: 8,
  },
  detailsButton: {
    backgroundColor: themeColors.surface.infoSubtle,
  },
  pauseButtonLabel: {
    color: themeColors.text.warning,
    fontWeight: '600',
    fontSize: 13,
  },
  detailsButtonLabel: {
    color: themeColors.intent.infoStrong,
    fontWeight: '600',
    fontSize: 13,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: themeColors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: themeColors.neutral.slate200,
  },
  bottomBarRow: {
    minHeight: TAB_BAR_BASE_HEIGHT,
    flexDirection: 'row',
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bottomTabLabel: {
    color: themeColors.text.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
