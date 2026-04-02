import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { schoolsApi, type School } from '../../api/schools';
import { ApiClientError } from '../../api/client/apiClient';
import { AppLoader, FoodDoodleBackdrop } from '../../components/ui';
import { useAppTheme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SchoolList'>;

const PAGE_SIZE = 10;

const getOperatingDays = (operatingDays: School['operatingDays']): string => {
  if (Array.isArray(operatingDays)) {
    return operatingDays.join(', ');
  }

  return operatingDays;
};

export const SchoolListScreen = ({ navigation }: Props) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [cityFilteredSchools, setCityFilteredSchools] = useState<School[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceAvailableOnly, setServiceAvailableOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const loadInitialSchools = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const schools = await schoolsApi.getSchools();
      setAllSchools(schools);
      setCityFilteredSchools(schools);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to load schools right now.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const applyCityFilter = useCallback(
    async (city: string | null) => {
      setSelectedCity(city);
      setVisibleCount(PAGE_SIZE);
      setCityModalVisible(false);
      setError(null);

      if (!city) {
        setCityFilteredSchools(allSchools);
        return;
      }

      try {
        const schools = await schoolsApi.getSchools(city);
        setCityFilteredSchools(schools);
      } catch (requestError) {
        if (requestError instanceof ApiClientError) {
          setError(requestError.message);
        } else {
          setError('Unable to filter schools by city.');
        }
      }
    },
    [allSchools],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const [all, filtered] = await Promise.all([
        schoolsApi.getSchools(),
        selectedCity ? schoolsApi.getSchools(selectedCity) : schoolsApi.getSchools(),
      ]);

      setAllSchools(all);
      setCityFilteredSchools(filtered);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError('Unable to refresh schools.');
      }
    } finally {
      setRefreshing(false);
    }
  }, [selectedCity]);

  useEffect(() => {
    void loadInitialSchools();
  }, [loadInitialSchools]);

  const cityOptions = useMemo(() => {
    return Array.from(
      new Set(
        allSchools.map(school => school.city).filter((city): city is string => Boolean(city)),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [allSchools]);

  const filteredSchools = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return cityFilteredSchools.filter(school => {
      if (serviceAvailableOnly && !school.isServiceAvailable) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return school.name.toLowerCase().includes(normalizedSearch);
    });
  }, [cityFilteredSchools, searchQuery, serviceAvailableOnly]);

  const visibleSchools = useMemo(
    () => filteredSchools.slice(0, visibleCount),
    [filteredSchools, visibleCount],
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, serviceAvailableOnly, selectedCity]);

  const loadMore = () => {
    if (visibleCount >= filteredSchools.length) {
      return;
    }

    setVisibleCount(previousCount => previousCount + PAGE_SIZE);
  };

  const renderSchoolCard = ({ item }: { item: School }) => (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('SchoolDetail', { schoolId: item.id })}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={styles.thumbnailFallback}>
          <Text style={styles.thumbnailText}>{item.name.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.nameRow}>
          <Text style={styles.schoolName}>{item.name}</Text>
          <View
            style={[
              styles.badge,
              item.isServiceAvailable ? styles.availableBadge : styles.unavailableBadge,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                item.isServiceAvailable ? styles.availableBadgeText : styles.unavailableBadgeText,
              ]}
            >
              {item.isServiceAvailable ? 'Service available' : 'Service unavailable'}
            </Text>
          </View>
        </View>

        <Text style={styles.locationText}>
          {item.city ? `${item.city} • ${item.address}` : item.address}
        </Text>
        <Text style={styles.operatingDaysText}>Days: {getOperatingDays(item.operatingDays)}</Text>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <AppLoader label="Loading schools..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FoodDoodleBackdrop />
      <FlatList
        data={visibleSchools}
        keyExtractor={item => item.id}
        renderItem={renderSchoolCard}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshing={refreshing}
        onRefresh={() => void onRefresh()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.filtersContainer}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by school name"
              style={styles.searchInput}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <View style={styles.filterRow}>
              <Pressable style={styles.cityDropdown} onPress={() => setCityModalVisible(true)}>
                <Text style={styles.cityDropdownText}>
                  {selectedCity ? `City: ${selectedCity}` : 'City: All'}
                </Text>
                <Text style={styles.cityDropdownArrow}>v</Text>
              </Pressable>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Service available only</Text>
              <Switch
                value={serviceAvailableOnly}
                onValueChange={setServiceAvailableOnly}
                trackColor={{
                  false: colors.neutral.slate300,
                  true: colors.border.infoSoft,
                }}
                thumbColor={serviceAvailableOnly ? colors.intent.info : colors.neutral.white}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {!error && filteredSchools.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No schools found</Text>
                <Text style={styles.emptySubtitle}>Try changing search text or filters.</Text>
              </View>
            ) : null}
          </View>
        }
        ListFooterComponent={
          visibleCount < filteredSchools.length ? (
            <View style={styles.footerLoader}>
              <AppLoader compact label="Loading more schools..." />
            </View>
          ) : null
        }
      />

      <Modal
        visible={cityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCityModalVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Filter by City</Text>
            <Pressable style={styles.modalOption} onPress={() => void applyCityFilter(null)}>
              <Text style={styles.modalOptionText}>All Cities</Text>
            </Pressable>
            {cityOptions.map(city => (
              <Pressable
                key={city}
                style={styles.modalOption}
                onPress={() => void applyCityFilter(city)}
              >
                <Text style={styles.modalOptionText}>{city}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    listContent: {
      padding: 16,
      paddingBottom: 24,
    },
    filtersContainer: {
      marginBottom: 12,
    },
    searchInput: {
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate300,
      backgroundColor: colors.neutral.white,
      paddingHorizontal: 12,
      marginBottom: 10,
      color: colors.text.primary,
    },
    filterRow: {
      marginBottom: 10,
    },
    cityDropdown: {
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate300,
      backgroundColor: colors.neutral.white,
      paddingHorizontal: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cityDropdownText: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    cityDropdownArrow: {
      color: colors.text.subtle,
      fontSize: 13,
    },
    toggleRow: {
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate300,
      backgroundColor: colors.neutral.white,
      paddingHorizontal: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    toggleLabel: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    errorText: {
      marginTop: 4,
      color: colors.intent.danger,
      fontSize: 13,
    },
    emptyState: {
      marginTop: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      padding: 14,
    },
    emptyTitle: {
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 4,
    },
    emptySubtitle: {
      color: colors.text.muted,
      fontSize: 13,
    },
    card: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      padding: 12,
      flexDirection: 'row',
      marginBottom: 10,
    },
    thumbnail: {
      width: 56,
      height: 56,
      borderRadius: 10,
    },
    thumbnailFallback: {
      width: 56,
      height: 56,
      borderRadius: 10,
      backgroundColor: colors.surface.infoSoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    thumbnailText: {
      color: colors.intent.infoStrong,
      fontWeight: '700',
      fontSize: 20,
    },
    cardContent: {
      marginLeft: 10,
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    schoolName: {
      flex: 1,
      color: colors.text.primary,
      fontSize: 15,
      fontWeight: '700',
      marginRight: 8,
    },
    badge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    availableBadge: {
      backgroundColor: colors.surface.successSubtle,
    },
    unavailableBadge: {
      backgroundColor: colors.surface.dangerSubtle,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    availableBadgeText: {
      color: colors.text.success,
    },
    unavailableBadgeText: {
      color: colors.text.danger,
    },
    locationText: {
      color: colors.text.secondary,
      fontSize: 13,
      marginBottom: 3,
    },
    operatingDaysText: {
      color: colors.text.muted,
      fontSize: 12,
    },
    footerLoader: {
      paddingVertical: 10,
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay.scrim,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    modalCard: {
      borderRadius: 14,
      backgroundColor: colors.neutral.white,
      padding: 14,
      maxHeight: '70%',
    },
    modalTitle: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 10,
    },
    modalOption: {
      minHeight: 42,
      borderRadius: 10,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      paddingHorizontal: 12,
      marginBottom: 8,
    },
    modalOptionText: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '500',
    },
  });
