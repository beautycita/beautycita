/**
 * Image Picker Service
 * Handles camera and gallery access for photo uploads
 * Used for portfolios, profile pictures, and evidence uploads
 */

import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  CameraOptions,
  ImageLibraryOptions,
  Asset,
} from 'react-native-image-picker';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

export interface PickedImage {
  uri: string;
  type: string;
  name: string;
  fileSize: number;
  width?: number;
  height?: number;
}

/**
 * Request camera permission (Android only)
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    // iOS permissions handled via Info.plist
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'BeautyCita Camera Permission',
        message:
          'BeautyCita needs access to your camera to take photos for your portfolio.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error('Error requesting camera permission:', err);
    return false;
  }
};

/**
 * Request gallery permission (Android only)
 */
export const requestGalleryPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    // iOS permissions handled via Info.plist
    return true;
  }

  if (Platform.Version >= 33) {
    // Android 13+ uses READ_MEDIA_IMAGES
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        {
          title: 'BeautyCita Photo Library Permission',
          message:
            'BeautyCita needs access to your photo library to select images for your portfolio.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Error requesting gallery permission:', err);
      return false;
    }
  } else {
    // Android 12 and below uses READ_EXTERNAL_STORAGE
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'BeautyCita Storage Permission',
          message:
            'BeautyCita needs access to your storage to select images for your portfolio.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Error requesting storage permission:', err);
      return false;
    }
  }
};

/**
 * Default camera options
 */
const defaultCameraOptions: CameraOptions = {
  mediaType: 'photo',
  quality: 0.8, // 80% quality for balance between size and clarity
  maxWidth: 1920,
  maxHeight: 1920,
  includeBase64: false,
  saveToPhotos: true,
};

/**
 * Default gallery options
 */
const defaultGalleryOptions: ImageLibraryOptions = {
  mediaType: 'photo',
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1920,
  includeBase64: false,
  selectionLimit: 1, // Single selection by default
};

/**
 * Parse image picker response to PickedImage format
 */
const parseImageAsset = (asset: Asset): PickedImage | null => {
  if (!asset.uri) {
    return null;
  }

  return {
    uri: asset.uri,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || `photo_${Date.now()}.jpg`,
    fileSize: asset.fileSize || 0,
    width: asset.width,
    height: asset.height,
  };
};

/**
 * Take photo from camera
 */
export const takePhoto = async (
  options?: CameraOptions
): Promise<PickedImage | null> => {
  try {
    // Request permission first
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos. Please enable it in settings.',
        [{ text: 'OK' }]
      );
      return null;
    }

    // Launch camera
    const response: ImagePickerResponse = await launchCamera({
      ...defaultCameraOptions,
      ...options,
    });

    // Handle response
    if (response.didCancel) {
      console.log('User cancelled camera');
      return null;
    }

    if (response.errorCode) {
      console.error('Camera error:', response.errorMessage);
      Alert.alert('Error', response.errorMessage || 'Failed to take photo');
      return null;
    }

    if (response.assets && response.assets.length > 0) {
      return parseImageAsset(response.assets[0]);
    }

    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    Alert.alert('Error', 'Failed to take photo. Please try again.');
    return null;
  }
};

/**
 * Select photo from gallery
 */
export const selectPhoto = async (
  options?: ImageLibraryOptions
): Promise<PickedImage | null> => {
  try {
    // Request permission first
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Gallery permission is required to select photos. Please enable it in settings.',
        [{ text: 'OK' }]
      );
      return null;
    }

    // Launch gallery
    const response: ImagePickerResponse = await launchImageLibrary({
      ...defaultGalleryOptions,
      ...options,
    });

    // Handle response
    if (response.didCancel) {
      console.log('User cancelled gallery');
      return null;
    }

    if (response.errorCode) {
      console.error('Gallery error:', response.errorMessage);
      Alert.alert('Error', response.errorMessage || 'Failed to select photo');
      return null;
    }

    if (response.assets && response.assets.length > 0) {
      return parseImageAsset(response.assets[0]);
    }

    return null;
  } catch (error) {
    console.error('Error selecting photo:', error);
    Alert.alert('Error', 'Failed to select photo. Please try again.');
    return null;
  }
};

/**
 * Select multiple photos from gallery
 */
export const selectMultiplePhotos = async (
  maxPhotos: number = 10,
  options?: ImageLibraryOptions
): Promise<PickedImage[]> => {
  try {
    // Request permission first
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Gallery permission is required to select photos. Please enable it in settings.',
        [{ text: 'OK' }]
      );
      return [];
    }

    // Launch gallery with multiple selection
    const response: ImagePickerResponse = await launchImageLibrary({
      ...defaultGalleryOptions,
      ...options,
      selectionLimit: maxPhotos,
    });

    // Handle response
    if (response.didCancel) {
      console.log('User cancelled gallery');
      return [];
    }

    if (response.errorCode) {
      console.error('Gallery error:', response.errorMessage);
      Alert.alert('Error', response.errorMessage || 'Failed to select photos');
      return [];
    }

    if (response.assets && response.assets.length > 0) {
      const pickedImages = response.assets
        .map(parseImageAsset)
        .filter((img): img is PickedImage => img !== null);

      return pickedImages;
    }

    return [];
  } catch (error) {
    console.error('Error selecting photos:', error);
    Alert.alert('Error', 'Failed to select photos. Please try again.');
    return [];
  }
};

/**
 * Show action sheet to choose between camera and gallery
 */
export const showImageSourceActionSheet = (): Promise<'camera' | 'gallery' | null> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Choose Photo Source',
      'Select where you want to get the photo from',
      [
        {
          text: 'Take Photo',
          onPress: () => resolve('camera'),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => resolve('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(null) }
    );
  });
};

/**
 * Pick image with source selection
 * Shows action sheet, then launches camera or gallery
 */
export const pickImage = async (
  options?: CameraOptions | ImageLibraryOptions
): Promise<PickedImage | null> => {
  const source = await showImageSourceActionSheet();

  if (!source) {
    return null;
  }

  if (source === 'camera') {
    return await takePhoto(options as CameraOptions);
  } else {
    return await selectPhoto(options as ImageLibraryOptions);
  }
};

/**
 * Validate image file size
 * Returns true if file size is within limit
 */
export const validateImageSize = (
  image: PickedImage,
  maxSizeMB: number = 5
): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (image.fileSize > maxSizeBytes) {
    Alert.alert(
      'File Too Large',
      `Image size must be less than ${maxSizeMB}MB. Please select a smaller image or reduce quality.`
    );
    return false;
  }
  return true;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
};

export default {
  requestCameraPermission,
  requestGalleryPermission,
  takePhoto,
  selectPhoto,
  selectMultiplePhotos,
  showImageSourceActionSheet,
  pickImage,
  validateImageSize,
  formatFileSize,
};
