import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import { AppLoader, FoodDoodleBackdrop, ProfileAvatar, useAppAlert } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';
import { useAppSelector } from '../../store/hooks';
import { useAppTheme } from '../../theme';
import { getStudentLimitReachedMessage, hasReachedStudentLimit } from '../../utils/studentLimit';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
type BottomNavItem = {
  label: 'Schools' | 'Students' | 'Orders' | 'Subscription';
  route: 'SchoolList' | 'Students' | 'Orders' | 'SubscriptionsList';
};

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: 'Schools', route: 'SchoolList' },
  { label: 'Students', route: 'Students' },
  { label: 'Orders', route: 'Orders' },
  { label: 'Subscription', route: 'SubscriptionsList' },
];

const TAB_BAR_BASE_HEIGHT = 66;

const getBottomTabIcon = (label: BottomNavItem['label']): keyof typeof Ionicons.glyphMap => {
  switch (label) {
    case 'Schools':
      return 'school-outline';
    case 'Students':
      return 'people-outline';
    case 'Orders':
      return 'receipt-outline';
    case 'Subscription':
      return 'calendar-outline';
    default:
      return 'ellipse-outline';
  }
};

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
  const { alert } = useAppAlert();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hasFocusedOnceRef = useRef(false);
  const user = useAppSelector(state => state.auth.user);
  const [greetingName, setGreetingName] = useState(() =>
    getGreetingName(user?.fullName, user?.email),
  );
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentsViewportWidth, setStudentsViewportWidth] = useState(0);
  const [studentsContentWidth, setStudentsContentWidth] = useState(0);
  const [studentsScrollX, setStudentsScrollX] = useState(0);
  const [maxStudents, setMaxStudents] = useState<number | null>(
    typeof user?.maxStudents === 'number' ? user.maxStudents : null,
  );

  const loadHomeData = useCallback(async () => {
    try {
      setError(null);
      const [studentsResponse, subscriptionsResponse] = await Promise.all([
        studentsApi.getStudents(),
        subscriptionsApi.getSubscriptions('ACTIVE'),
      ]);

      setStudents(studentsResponse);
      setSubscriptions(subscriptionsResponse);

      setSelectedStudentId(currentSelectedStudentId => {
        if (studentsResponse.length === 0) {
          return null;
        }

        if (
          !currentSelectedStudentId ||
          !studentsResponse.some(student => student.id === currentSelectedStudentId)
        ) {
          return studentsResponse[0].id;
        }

        return currentSelectedStudentId;
      });
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
        return;
      }

      setError('Unable to load home data right now. Please try again.');
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);
      await loadHomeData();
      setInitialLoading(false);
    };

    void fetchInitialData();
  }, [loadHomeData]);

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedOnceRef.current) {
        void loadHomeData();
      } else {
        hasFocusedOnceRef.current = true;
      }
    }, [loadHomeData]),
  );

  useEffect(() => {
    setGreetingName(getGreetingName(user?.fullName, user?.email));
  }, [user?.email, user?.fullName]);

  useEffect(() => {
    const loadGreetingName = async () => {
      try {
        const profile = await usersApi.getCurrentUserProfile();
        setGreetingName(getGreetingName(profile.fullName, profile.email));
        setProfileImageUrl(profile.profileImageUrl ?? null);
        setMaxStudents(typeof profile.maxStudents === 'number' ? profile.maxStudents : null);
      } catch {
        // Keep best available local user name if profile call fails.
      }
    };

    void loadGreetingName();
  }, []);

  useEffect(() => {
    if (typeof user?.maxStudents === 'number') {
      setMaxStudents(user.maxStudents);
    }
  }, [user?.maxStudents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  }, [loadHomeData]);

  const handleAddStudentPress = useCallback(() => {
    const studentLimit = typeof maxStudents === 'number' ? maxStudents : null;
    if (studentLimit !== null && hasReachedStudentLimit(students.length, studentLimit)) {
      alert('Student limit reached', getStudentLimitReachedMessage(students.length, studentLimit), [
        { text: 'OK' },
      ]);
      return;
    }

    navigation.navigate('AddStudent', {
      mealPlanId: undefined,
      schoolId: undefined,
      studentId: undefined,
    });
  }, [alert, maxStudents, navigation, students.length]);

  const selectedStudent = useMemo(
    () => students.find(student => student.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  const filteredSubscriptions = useMemo(() => {
    if (!selectedStudentId) {
      return [];
    }

    return subscriptions.filter(subscription => subscription.studentId === selectedStudentId);
  }, [selectedStudentId, subscriptions]);

  const handleCreateSubscription = useCallback(() => {
    if (selectedStudent?.school?.id) {
      navigation.navigate('SchoolDetail', { schoolId: selectedStudent.school.id });
      return;
    }

    navigation.navigate('SchoolList');
  }, [navigation, selectedStudent]);

  const hasHorizontalOverflow = studentsContentWidth - studentsViewportWidth > 1;
  const showLeftScrollHint = hasHorizontalOverflow && studentsScrollX > 4;
  const showRightScrollHint =
    hasHorizontalOverflow && studentsContentWidth - (studentsViewportWidth + studentsScrollX) > 4;

  const onStudentsScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setStudentsScrollX(event.nativeEvent.contentOffset.x);
  }, []);

  if (initialLoading) {
    return (
      <View style={styles.loaderContainer}>
        <AppLoader label="Loading home menu..." />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FoodDoodleBackdrop />
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
            <View style={styles.welcomeBlock}>
              <Text style={styles.welcomeInlineText}>
                Welcome <Text style={styles.welcomeNameText}>{greetingName}</Text>,
              </Text>
              <Text style={styles.taglineText}>Where Mom’s Taste Meets Convenience.</Text>
            </View>

            <Pressable
              style={styles.profileIconButton}
              onPress={() => navigation.navigate('Profile')}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <View style={styles.profileAvatarRing}>
                <ProfileAvatar imageUrl={profileImageUrl} name={greetingName} size={56} />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.mainSectionHeader}>
            <Text style={styles.sectionTitle}>Students</Text>
            <Pressable
              style={styles.addButton}
              onPress={handleAddStudentPress}
              accessibilityRole="button"
              accessibilityLabel="Add student"
            >
              <Text style={styles.addButtonText}>+</Text>
            </Pressable>
          </View>

          {students.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No students added yet</Text>
              <Text style={styles.emptySubtitle}>Tap + to add a student first.</Text>
            </View>
          ) : (
            <View
              style={styles.studentsScrollerWrap}
              onLayout={event => setStudentsViewportWidth(event.nativeEvent.layout.width)}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.studentsRow}
                onContentSizeChange={width => setStudentsContentWidth(width)}
                onScroll={onStudentsScroll}
                scrollEventThrottle={16}
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
                    <View style={styles.studentAvatarWrap}>
                      <ProfileAvatar
                        imageUrl={student.profileImageUrl}
                        name={student.fullName}
                        size={32}
                      />
                    </View>
                    <Text style={styles.studentName}>
                      {getStudentDisplayName(student.fullName)}
                    </Text>
                    <Text style={styles.studentSchool} numberOfLines={1} ellipsizeMode="tail">
                      {student.school?.name
                        ? getCompactLabel(student.school.name, 22)
                        : 'School not set'}
                    </Text>
                    <Text style={styles.studentGrade}>Grade {student.grade}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {showLeftScrollHint ? (
                <View style={[styles.scrollHintEdge, styles.scrollHintLeft]} pointerEvents="none">
                  <View style={[styles.scrollHintBand, styles.scrollHintBandStrong]} />
                  <View style={[styles.scrollHintBand, styles.scrollHintBandLight]} />
                </View>
              ) : null}

              {showRightScrollHint ? (
                <View style={[styles.scrollHintEdge, styles.scrollHintRight]} pointerEvents="none">
                  <View style={[styles.scrollHintBand, styles.scrollHintBandLight]} />
                  <View style={[styles.scrollHintBand, styles.scrollHintBandStrong]} />
                </View>
              ) : null}
            </View>
          )}
          <View style={styles.subSection}>
            <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>Subscriptions</Text>
              <Pressable
                style={styles.addButton}
                onPress={handleCreateSubscription}
                accessibilityRole="button"
                accessibilityLabel="Create subscription"
              >
                <Text style={styles.addButtonText}>+</Text>
              </Pressable>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {!error && filteredSubscriptions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  {selectedStudent
                    ? `No active subscription for ${selectedStudent.fullName}`
                    : 'No active subscription'}
                </Text>
                <Text style={styles.emptySubtitle}>No active plan yet.</Text>
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
                      navigation.navigate('SubscriptionDetail', {
                        subscriptionId: subscription.id,
                      })
                    }
                  >
                    <Text style={styles.detailsButtonLabel}>View Details</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { minHeight: TAB_BAR_BASE_HEIGHT + insets.bottom }]}>
        <View style={styles.bottomBarRow}>
          {BOTTOM_NAV_ITEMS.map(item => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [styles.bottomTab, pressed && styles.bottomTabPressed]}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={styles.bottomTabBadge}>
                <Ionicons
                  name={getBottomTabIcon(item.label)}
                  size={18}
                  color={colors.text.secondary}
                />
              </View>
              <Text style={styles.bottomTabLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ height: insets.bottom }} />
      </View>
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
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
    welcomeBlock: {
      flex: 1,
      marginRight: 12,
    },
    welcomeInlineText: {
      fontSize: 20,
      fontWeight: '400',
      color: colors.text.primary,
    },
    welcomeNameText: {
      fontSize: 22,
      fontWeight: '700',
    },
    taglineText: {
      marginTop: 4,
      color: colors.text.muted,
      fontSize: 12,
      fontWeight: '500',
    },
    profileIconButton: {
      width: 60,
      height: 60,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileAvatarRing: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: colors.action.primary,
      backgroundColor: colors.surface.infoSofter,
      alignItems: 'center',
      justifyContent: 'center',
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
    },
    mainSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    subSection: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.neutral.slate200,
    },
    subSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    subSectionTitle: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '700',
    },
    addButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.neutral.slate300,
      backgroundColor: colors.neutral.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
      color: colors.text.primary,
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 20,
      marginTop: -1,
    },
    studentsRow: {
      paddingRight: 8,
    },
    studentsScrollerWrap: {
      position: 'relative',
    },
    scrollHintEdge: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 5,
      flexDirection: 'row',
    },
    scrollHintLeft: {
      left: 0,
    },
    scrollHintRight: {
      right: 0,
    },
    scrollHintBand: {
      flex: 1,
      backgroundColor: colors.overlay.edgeFadeTint,
    },
    scrollHintBandStrong: {
      opacity: 0.1,
    },
    scrollHintBandLight: {
      opacity: 0.06,
    },
    studentCard: {
      width: 130,
      minHeight: 84,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate300,
      backgroundColor: colors.neutral.white,
      paddingHorizontal: 10,
      paddingVertical: 10,
      marginRight: 8,
      justifyContent: 'center',
    },
    studentAvatarWrap: {
      marginBottom: 6,
      alignItems: 'flex-start',
    },
    studentCardSelected: {
      borderColor: colors.action.primary,
      backgroundColor: colors.surface.infoSoft,
    },
    studentName: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 2,
    },
    studentSchool: {
      color: colors.text.muted,
      fontSize: 11,
      fontWeight: '500',
      marginBottom: 2,
    },
    studentGrade: {
      color: colors.text.secondary,
      fontSize: 11,
      fontWeight: '600',
    },
    errorText: {
      color: colors.intent.danger,
      marginBottom: 10,
      fontSize: 13,
    },
    emptyCard: {
      borderRadius: 12,
      padding: 14,
      backgroundColor: colors.neutral.white,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
    },
    emptyTitle: {
      color: colors.text.primary,
      fontWeight: '600',
      fontSize: 15,
      marginBottom: 4,
    },
    emptySubtitle: {
      color: colors.text.muted,
      fontSize: 13,
    },
    subscriptionCard: {
      backgroundColor: colors.neutral.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      padding: 14,
      marginBottom: 10,
    },
    planName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 2,
    },
    subscriptionMeta: {
      color: colors.text.secondary,
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
      backgroundColor: colors.surface.warningSoft,
      marginRight: 8,
    },
    detailsButton: {
      backgroundColor: colors.surface.infoSubtle,
    },
    pauseButtonLabel: {
      color: colors.text.warning,
      fontWeight: '600',
      fontSize: 13,
    },
    detailsButtonLabel: {
      color: colors.intent.infoStrong,
      fontWeight: '600',
      fontSize: 13,
    },
    bottomBar: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 0,
      backgroundColor: colors.neutral.white,
      borderTopWidth: 1,
      borderTopColor: colors.neutral.slate200,
      borderRadius: 18,
      shadowColor: colors.neutral.slate400,
      shadowOpacity: 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 2 },
      elevation: 6,
    },
    bottomBarRow: {
      minHeight: TAB_BAR_BASE_HEIGHT,
      flexDirection: 'row',
      paddingHorizontal: 8,
      paddingTop: 6,
    },
    bottomTab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      borderRadius: 12,
      marginHorizontal: 2,
      paddingVertical: 4,
    },
    bottomTabPressed: {
      backgroundColor: colors.neutral.slate100,
    },
    bottomTabBadge: {
      minWidth: 38,
      height: 30,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.neutral.slate300,
      backgroundColor: colors.neutral.slate50,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
      paddingHorizontal: 8,
    },
    bottomTabLabel: {
      color: colors.text.primary,
      fontSize: 11,
      fontWeight: '700',
    },
  });
