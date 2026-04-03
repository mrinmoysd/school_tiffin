import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme';

type ProfileAvatarProps = {
  imageUrl?: string | null;
  name?: string | null;
  size?: number;
};

const getInitials = (value?: string | null) => {
  if (!value) {
    return 'U';
  }

  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return 'U';
  }

  if (words.length === 1) {
    return words[0].slice(0, 1).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

export const ProfileAvatar = ({ imageUrl, name, size = 72 }: ProfileAvatarProps) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [failedImage, setFailedImage] = useState(false);

  useEffect(() => {
    setFailedImage(false);
  }, [imageUrl]);

  const shouldShowImage = Boolean(imageUrl && !failedImage);
  const initials = getInitials(name);
  const textSize = Math.max(16, Math.floor(size * 0.32));

  return (
    <View
      style={[
        styles.avatarContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {shouldShowImage ? (
        <Image
          source={{ uri: imageUrl as string }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setFailedImage(true)}
        />
      ) : (
        <Text style={[styles.initialsText, { fontSize: textSize }]}>{initials}</Text>
      )}
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    avatarContainer: {
      borderWidth: 1,
      borderColor: colors.neutral.slate300,
      backgroundColor: colors.surface.infoSoft,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    initialsText: {
      color: colors.text.primary,
      fontWeight: '700',
    },
  });
