import React, { useState, useCallback } from 'react';
import { ThemedAlert, AlertButton } from '@/src/components/ThemedAlert';

interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

export const useThemedAlert = () => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
    setIsVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setIsVisible(false);
    setAlertConfig(null);
  }, []);

  const AlertComponent = useCallback(() => {
    if (!alertConfig) return null;

    return (
      <ThemedAlert
        visible={isVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />
    );
  }, [alertConfig, isVisible, hideAlert]);

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  };
};

// Utility function to replace Alert.alert with themed version
export const createThemedAlert = (showAlert: (config: AlertConfig) => void) => ({
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert({
      title,
      message,
      buttons: buttons || [{ text: 'OK' }],
    });
  },
});
