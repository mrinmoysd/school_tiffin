import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiClientError } from '../../api/client/apiClient';
import { studentsApi } from '../../api/students';
import { usersApi, type UserProfile } from '../../api/users';
import {
  AppButton,
  AppLoader,
  FoodDoodleBackdrop,
  ProfileAvatar,
  useAppAlert,
} from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';
import { logout } from '../../store/auth';
import { useAppDispatch } from '../../store/hooks';
import { ThemePreference, useAppTheme } from '../../theme';

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
  const { alert } = useAppAlert();
  const { colors, preference, setPreference } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
    alert('Logout', 'Are you sure you want to logout?', [
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

  const themeOptions: { key: ThemePreference; label: string }[] = [
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
    { key: 'system', label: 'System Default' },
  ];

  if (loading) {
    return (
      <View style={styles.centered}>
        <AppLoader label="Loading profile..." />
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
    <View style={styles.container}>
      <FoodDoodleBackdrop />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>User Information</Text>
          <View style={styles.avatarRow}>
            <ProfileAvatar imageUrl={profile.profileImageUrl} name={profile.fullName} size={76} />
          </View>
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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Theme</Text>
          <View style={styles.themeOptionsRow}>
            {themeOptions.map(option => (
              <Pressable
                key={option.key}
                onPress={() => setPreference(option.key)}
                style={[
                  styles.themeOption,
                  preference === option.key && styles.themeOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.themeOptionText,
                    preference === option.key && styles.themeOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.quickActions}>
          <Pressable
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('EditProfile')}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Text style={styles.quickActionTitle}>Edit Profile</Text>
            <Text style={styles.quickActionMeta}>Update your name and phone</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('ChangePassword')}
            accessibilityRole="button"
            accessibilityLabel="Change password"
          >
            <Text style={styles.quickActionTitle}>Password</Text>
            <Text style={styles.quickActionMeta}>Change account password</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Students')}
            accessibilityRole="button"
            accessibilityLabel="Manage students"
          >
            <Text style={styles.quickActionTitle}>Students</Text>
            <Text style={styles.quickActionMeta}>Manage student profiles</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
          >
            <Text style={styles.quickActionTitle}>Notifications</Text>
            <Text style={styles.quickActionMeta}>View recent updates</Text>
          </Pressable>
        </View>

        <AppButton
          title="Logout"
          onPress={handleLogout}
          loading={logoutLoading}
          style={styles.logoutButton}
        />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
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
      backgroundColor: 'transparent',
    },
    card: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      padding: 14,
      marginBottom: 10,
    },
    cardTitle: {
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 8,
    },
    line: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    avatarRow: {
      marginBottom: 12,
      alignItems: 'center',
    },
    muted: {
      color: colors.text.subtle,
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
      backgroundColor: colors.surface.successSubtle,
    },
    badgeMuted: {
      backgroundColor: colors.neutral.slate200,
    },
    badgeText: {
      color: colors.text.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    themeOptionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    themeOption: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.neutral.slate300,
      backgroundColor: 'transparent',
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      marginBottom: 8,
    },
    themeOptionSelected: {
      borderColor: colors.action.primary,
      backgroundColor: colors.surface.infoSoft,
    },
    themeOptionText: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    themeOptionTextSelected: {
      color: colors.text.primary,
    },
    errorText: {
      color: colors.intent.danger,
      fontSize: 13,
      marginBottom: 10,
    },
    quickActions: {
      marginTop: 4,
      marginBottom: 2,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    quickActionCard: {
      width: '48.5%',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 10,
    },
    quickActionTitle: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 3,
    },
    quickActionMeta: {
      color: colors.text.muted,
      fontSize: 12,
      lineHeight: 16,
    },
    logoutButton: {
      marginTop: 10,
      backgroundColor: colors.intent.danger,
    },
  });
