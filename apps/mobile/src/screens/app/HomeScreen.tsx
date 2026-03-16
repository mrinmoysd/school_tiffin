import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/auth';
import { studentsApi, type Student } from '../../api/students';
import { subscriptionsApi, type Subscription } from '../../api/subscriptions';
import { ApiClientError } from '../../api/client/apiClient';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const getGreetingName = (fullName: string | null | undefined, email: string | null | undefined) => {
  if (fullName && fullName.trim().length > 0) {
    return fullName.trim().split(' ')[0];
  }

  if (email && email.includes('@')) {
    return email.split('@')[0];
  }

  return 'there';
};

export const HomeScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  const [students, setStudents] = useState<Student[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentSelectorVisible, setStudentSelectorVisible] = useState(false);
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

  const greetingName = getGreetingName(user?.fullName, user?.email);

  if (initialLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <Text style={styles.greeting}>Hello, {greetingName}</Text>
        <Text style={styles.headerHint}>Manage subscriptions and explore meal plans.</Text>
      </View>

      {students.length > 1 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Student</Text>
          <Pressable style={styles.dropdownButton} onPress={() => setStudentSelectorVisible(true)}>
            <Text style={styles.dropdownText}>
              {selectedStudent
                ? `${selectedStudent.fullName} (Grade ${selectedStudent.grade})`
                : 'Choose student'}
            </Text>
            <Text style={styles.dropdownArrow}>v</Text>
          </Pressable>
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

      <AppButton
        title="Browse Schools"
        onPress={() => navigation.navigate('SchoolList')}
        style={styles.primaryAction}
      />

      <Pressable style={styles.ordersLink} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.ordersLinkText}>Profile</Text>
      </Pressable>

      <Pressable style={styles.ordersLink} onPress={() => navigation.navigate('Notifications')}>
        <Text style={styles.ordersLinkText}>Notifications</Text>
      </Pressable>

      <Pressable style={styles.ordersLink} onPress={() => navigation.navigate('Orders')}>
        <Text style={styles.ordersLinkText}>My Orders</Text>
      </Pressable>

      <Pressable style={styles.ordersLink} onPress={() => navigation.navigate('SubscriptionsList')}>
        <Text style={styles.ordersLinkText}>My Subscriptions</Text>
      </Pressable>

      <Pressable style={styles.logoutLink} onPress={() => void dispatch(logout())}>
        <Text style={styles.logoutLinkText}>Logout</Text>
      </Pressable>

      <Modal
        visible={studentSelectorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStudentSelectorVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setStudentSelectorVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Student</Text>
            {students.map(student => (
              <Pressable
                key={student.id}
                style={[
                  styles.modalOption,
                  selectedStudentId === student.id && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setSelectedStudentId(student.id);
                  setStudentSelectorVisible(false);
                }}
              >
                <Text style={styles.modalOptionText}>
                  {student.fullName} (Grade {student.grade})
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerHint: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
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
    color: '#0F172A',
    marginBottom: 10,
  },
  linkText: {
    color: '#0369A1',
    fontWeight: '600',
    fontSize: 14,
  },
  dropdownButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownArrow: {
    color: '#334155',
    marginLeft: 8,
    fontSize: 13,
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 10,
    fontSize: 13,
  },
  emptyCard: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
  },
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  subscriptionMeta: {
    color: '#475569',
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
    backgroundColor: '#FEF3C7',
    marginRight: 8,
  },
  detailsButton: {
    backgroundColor: '#DBEAFE',
  },
  pauseButtonLabel: {
    color: '#92400E',
    fontWeight: '600',
    fontSize: 13,
  },
  detailsButtonLabel: {
    color: '#1D4ED8',
    fontWeight: '600',
    fontSize: 13,
  },
  primaryAction: {
    marginTop: 4,
  },
  ordersLink: {
    marginTop: 16,
    alignSelf: 'center',
  },
  ordersLinkText: {
    fontSize: 15,
    color: '#0369A1',
    fontWeight: '600',
  },
  logoutLink: {
    marginTop: 16,
    alignSelf: 'center',
  },
  logoutLinkText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  modalOption: {
    minHeight: 44,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: '#E0F2FE',
  },
  modalOptionText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
});
