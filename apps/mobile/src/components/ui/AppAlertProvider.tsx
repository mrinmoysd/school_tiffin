import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme';

type AppAlertActionStyle = 'default' | 'cancel' | 'destructive';

type AppAlertAction = {
  text: string;
  style?: AppAlertActionStyle;
  onPress?: () => void;
};

type AppAlertOptions = {
  dismissible?: boolean;
};

type AppAlertConfig = {
  title: string;
  message?: string;
  actions: AppAlertAction[];
  dismissible: boolean;
};

type AppAlertContextValue = {
  alert: (
    title: string,
    message?: string,
    actions?: AppAlertAction[],
    options?: AppAlertOptions,
  ) => void;
};

const AppAlertContext = createContext<AppAlertContextValue | undefined>(undefined);

export const AppAlertProvider = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [config, setConfig] = useState<AppAlertConfig | null>(null);

  const closeAlert = useCallback(() => {
    setConfig(null);
  }, []);

  const alert = useCallback<AppAlertContextValue['alert']>((title, message, actions, options) => {
    const normalizedActions = actions && actions.length > 0 ? actions : [{ text: 'OK' }];
    setConfig({
      title,
      message,
      actions: normalizedActions,
      dismissible: options?.dismissible ?? false,
    });
  }, []);

  const onActionPress = useCallback(
    (action: AppAlertAction) => {
      closeAlert();
      if (action.onPress) {
        action.onPress();
      }
    },
    [closeAlert],
  );

  const value = useMemo<AppAlertContextValue>(() => ({ alert }), [alert]);

  return (
    <AppAlertContext.Provider value={value}>
      {children}

      <Modal
        visible={Boolean(config)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (config?.dismissible) {
            closeAlert();
          }
        }}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => {
            if (config?.dismissible) {
              closeAlert();
            }
          }}
        >
          <Pressable style={styles.card} onPress={() => undefined}>
            {config ? (
              <>
                <Text style={styles.title}>{config.title}</Text>
                {config.message ? <Text style={styles.message}>{config.message}</Text> : null}

                <View style={styles.actionsColumn}>
                  {config.actions.map((action, index) => (
                    <Pressable
                      key={`${action.text}-${index}`}
                      style={[
                        styles.actionButton,
                        action.style === 'cancel' && styles.actionButtonCancel,
                        action.style === 'destructive' && styles.actionButtonDestructive,
                      ]}
                      onPress={() => onActionPress(action)}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          action.style === 'cancel' && styles.actionTextCancel,
                          action.style === 'destructive' && styles.actionTextDestructive,
                        ]}
                      >
                        {action.text}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </AppAlertContext.Provider>
  );
};

export const useAppAlert = () => {
  const context = useContext(AppAlertContext);

  if (!context) {
    throw new Error('useAppAlert must be used within AppAlertProvider.');
  }

  return context;
};

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay.scrim,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 22,
    },
    card: {
      width: '100%',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.neutral.slate200,
      backgroundColor: colors.neutral.white,
      padding: 16,
    },
    title: {
      color: colors.text.primary,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 6,
    },
    message: {
      color: colors.text.secondary,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 14,
    },
    actionsColumn: {
      marginTop: 2,
    },
    actionButton: {
      minHeight: 40,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border.info,
      backgroundColor: colors.surface.infoSubtle,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      paddingHorizontal: 12,
    },
    actionButtonCancel: {
      borderColor: colors.neutral.slate300,
      backgroundColor: colors.neutral.slate100,
    },
    actionButtonDestructive: {
      borderColor: colors.border.danger,
      backgroundColor: colors.surface.dangerSubtle,
    },
    actionText: {
      color: colors.intent.infoStrong,
      fontSize: 14,
      fontWeight: '700',
    },
    actionTextCancel: {
      color: colors.text.primary,
    },
    actionTextDestructive: {
      color: colors.text.dangerStrong,
    },
  });
