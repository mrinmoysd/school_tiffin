import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiClientError } from '../../api/client/apiClient';
import { studentsApi } from '../../api/students';
import { usersApi, type UserProfile } from '../../api/users';
import { AppButton } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';
import { logout } from '../../store/auth';
import { useAppDispatch } from '../../store/hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getDisplayPhone = (profile: UserProfile | null) =>
  profile?.phoneNumber || profile?.phone || '-';

const getVerificationStatus = (profile: UserProfile | null) => ({
  email: Boolean(profile?.emailVerified || profile?.emailVerifiedAt),
  phone: Boolean(profile?.phoneVerified || profile?.phoneVerifiedAt),
});

export const ProfileScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const hasFocusedOnceRef = useRef(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [studentsCount, setStudentsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verification = useMemo(() => getVerificationStatus(profile), [profile]);

  const loadProfileData = useCallback(async () => {
    setError(null);

    try {
      const [profileResponse, studentsResponse] = await Promise.all([
        usersApi.getCurrentUserProfile(),
        studentsApi.getStudents(),
      ]);

      setProfile(profileResponse);
      setStudentsCount(studentsResponse.length);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load profile right now.');
      }
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadProfileData();
      setLoading(false);
    };

    void run();
  }, [loadProfileData]);

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedOnceRef.current) {
        void loadProfileData();
      } else {
        hasFocusedOnceRef.current = true;
      }
    }, [loadProfileData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLogoutLoading(true);
          try {
            await dispatch(logout()).unwrap();
          } finally {
            setLogoutLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Unable to load profile.'}</Text>
        <AppButton title="Retry" onPress={() => void loadProfileData()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>User Information</Text>
        <Text style={styles.line}>Name: {profile.fullName || '-'}</Text>
        <Text style={styles.muted}>Email: {profile.email || '-'}</Text>
        <Text style={styles.muted}>Phone: {getDisplayPhone(profile)}</Text>
        <Text style={styles.muted}>Member Since: {formatDate(profile.createdAt)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Verification</Text>
        <View style={styles.badgesRow}>
          <View
            style={[styles.badge, verification.email ? styles.badgeSuccess : styles.badgeMuted]}
          >
            <Text style={styles.badgeText}>
              Email {verification.email ? 'Verified' : 'Not Verified'}
            </Text>
          </View>
          <View
            style={[styles.badge, verification.phone ? styles.badgeSuccess : styles.badgeMuted]}
          >
            <Text style={styles.badgeText}>
              Phone {verification.phone ? 'Verified' : 'Not Verified'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>My Students</Text>
        <Text style={styles.line}>Total Students: {studentsCount}</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AppButton title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
      <AppButton
        title="Change Password"
        onPress={() =>
          Alert.alert('Coming Soon', 'Change Password screen will be added in task 3.7.3.')
        }
        variant="secondary"
        style={styles.secondaryButton}
      />
      <AppButton
        title="Refresh"
        onPress={() => void onRefresh()}
        loading={refreshing}
        variant="secondary"
        style={styles.secondaryButton}
      />
      <AppButton
        title="Logout"
        onPress={handleLogout}
        loading={logoutLoading}
        style={styles.logoutButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 28,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  line: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  muted: {
    color: '#334155',
    fontSize: 13,
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  badgeMuted: {
    backgroundColor: '#E2E8F0',
  },
  badgeText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 10,
  },
  secondaryButton: {
    marginTop: 10,
  },
  logoutButton: {
    marginTop: 10,
    backgroundColor: '#DC2626',
  },
});
