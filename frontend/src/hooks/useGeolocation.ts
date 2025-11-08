import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  permission: PermissionState | null;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

const defaultOptions: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
  watch: false,
};

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    permission: null,
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  const mergedOptions = { ...defaultOptions, ...options };

  const updateLocation = useCallback((position: GeolocationPosition) => {
    setState(prev => ({
      ...prev,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      loading: false,
    }));
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    setState(prev => ({
      ...prev,
      error,
      loading: false,
    }));
  }, []);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      const error = {
        code: 2,
        message: 'Geolocation not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError;
      handleError(error);
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      updateLocation,
      handleError,
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: mergedOptions.maximumAge,
      }
    );
  }, [updateLocation, handleError, mergedOptions]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      const error = {
        code: 2,
        message: 'Geolocation not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError;
      handleError(error);
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const id = navigator.geolocation.watchPosition(
      updateLocation,
      handleError,
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: mergedOptions.maximumAge,
      }
    );

    setWatchId(id);
  }, [updateLocation, handleError, mergedOptions]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      return null;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setState(prev => ({ ...prev, permission: result.state }));
      return result.state;
    } catch (error) {
      console.warn('Permission query failed:', error);
      return null;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const permission = await checkPermission();

    if (permission === 'denied') {
      const error = {
        code: 1,
        message: 'Location permission denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError;
      handleError(error);
      return false;
    }

    if (permission === 'granted') {
      getCurrentPosition();
      return true;
    }

    // For 'prompt' state, calling getCurrentPosition will trigger permission request
    getCurrentPosition();
    return true;
  }, [checkPermission, getCurrentPosition, handleError]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  useEffect(() => {
    if (mergedOptions.watch && !watchId) {
      startWatching();
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [mergedOptions.watch, watchId, startWatching]);

  return {
    ...state,
    getCurrentPosition,
    startWatching,
    stopWatching,
    requestPermission,
    checkPermission,
    isSupported: !!navigator.geolocation,
  };
};

export default useGeolocation;