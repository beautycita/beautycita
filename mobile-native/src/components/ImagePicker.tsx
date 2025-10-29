/**
 * ImagePicker Component
 * Reusable image selection component with preview
 * Supports single and multiple image selection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import imagePickerService, { PickedImage } from '../services/imagePickerService';
import { PillButton } from './design-system';

interface ImagePickerProps {
  /**
   * Allow multiple image selection
   */
  multiple?: boolean;

  /**
   * Maximum number of images (only for multiple mode)
   */
  maxImages?: number;

  /**
   * Maximum file size in MB
   */
  maxSizeMB?: number;

  /**
   * Initial images (for edit mode)
   */
  initialImages?: string[];

  /**
   * Callback when images change
   */
  onImagesChange: (images: PickedImage[]) => void;

  /**
   * Show image count label
   */
  showCount?: boolean;

  /**
   * Custom label text
   */
  label?: string;

  /**
   * Show preview thumbnails
   */
  showPreview?: boolean;
}

/**
 * ImagePicker Component
 */
export const ImagePickerComponent: React.FC<ImagePickerProps> = ({
  multiple = false,
  maxImages = 10,
  maxSizeMB = 5,
  initialImages = [],
  onImagesChange,
  showCount = true,
  label,
  showPreview = true,
}) => {
  const [selectedImages, setSelectedImages] = useState<PickedImage[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddImage = async () => {
    setLoading(true);
    try {
      if (multiple) {
        // Select multiple images
        const remainingSlots = maxImages - selectedImages.length;
        const images = await imagePickerService.selectMultiplePhotos(
          remainingSlots,
          {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.8,
          }
        );

        if (images.length > 0) {
          // Validate each image size
          const validImages = images.filter((img) =>
            imagePickerService.validateImageSize(img, maxSizeMB)
          );

          const newImages = [...selectedImages, ...validImages];
          setSelectedImages(newImages);
          onImagesChange(newImages);
        }
      } else {
        // Select single image
        const image = await imagePickerService.pickImage({
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.8,
        });

        if (image && imagePickerService.validateImageSize(image, maxSizeMB)) {
          const newImages = [image];
          setSelectedImages(newImages);
          onImagesChange(newImages);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    onImagesChange(newImages);
  };

  const canAddMore = multiple ? selectedImages.length < maxImages : selectedImages.length === 0;

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Image Count */}
      {showCount && multiple && (
        <Text style={styles.count}>
          {selectedImages.length} / {maxImages} images selected
        </Text>
      )}

      {/* Preview Grid */}
      {showPreview && selectedImages.length > 0 && (
        <ScrollView
          horizontal={!multiple}
          contentContainerStyle={[
            styles.previewContainer,
            multiple && styles.previewGrid,
          ]}
          showsHorizontalScrollIndicator={false}>
          {selectedImages.map((image, index) => (
            <View key={index} style={styles.previewItem}>
              <Image source={{ uri: image.uri }} style={styles.previewImage} />

              {/* Remove Button */}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveImage(index)}>
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>

              {/* Image Info */}
              <View style={styles.imageInfo}>
                <Text style={styles.imageName} numberOfLines={1}>
                  {image.name}
                </Text>
                <Text style={styles.imageSize}>
                  {imagePickerService.formatFileSize(image.fileSize)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add Image Button */}
      {canAddMore && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddImage}
          disabled={loading}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.pink500} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <>
              <View style={styles.addIconContainer}>
                <Text style={styles.addIcon}>📷</Text>
              </View>
              <Text style={styles.addText}>
                {selectedImages.length === 0
                  ? multiple
                    ? 'Add Photos'
                    : 'Add Photo'
                  : 'Add More Photos'}
              </Text>
              <Text style={styles.addHint}>
                {multiple
                  ? `Select up to ${maxImages - selectedImages.length} more`
                  : 'Take photo or choose from gallery'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* No Images Selected State */}
      {!loading && selectedImages.length === 0 && !showPreview && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyText}>No images selected</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  // Label
  label: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  count: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
    marginBottom: spacing.md,
  },

  // Preview
  previewContainer: {
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  previewItem: {
    position: 'relative',
    width: 150,
    marginRight: spacing.md,
    marginBottom: spacing.md,
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: colors.gray100,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 9999,
    backgroundColor: colors.red500,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  removeIcon: {
    color: colors.white,
    fontSize: 16,
    fontFamily: typography.fontFamilies.bodyBold,
  },
  imageInfo: {
    marginTop: spacing.xs,
  },
  imageName: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  imageSize: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
  },

  // Add Button
  addButton: {
    borderWidth: 2,
    borderColor: colors.gray300,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray50,
    minHeight: 200,
  },
  addIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 9999,
    backgroundColor: colors.pink50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addIcon: {
    fontSize: 32,
  },
  addText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  addHint: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    textAlign: 'center',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },
});

export default ImagePickerComponent;
