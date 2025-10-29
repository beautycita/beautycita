/**
 * Avatar Component
 * User profile image with fallback initials
 * 
 * Features:
 * - Circular shape
 * - Multiple sizes: xs, sm, md, lg, xl
 * - Fallback with user initials
 * - Status indicator dot (online/offline)
 * - Optional border
 */

import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { fontSize } from '../theme/typography';

export interface AvatarProps {
  /** Image URI */
  source?: string;
  
  /** Fallback name for initials */
  name?: string;
  
  /** Avatar size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Show status indicator */
  status?: 'online' | 'offline' | null;
  
  /** Show border */
  bordered?: boolean;
  
  /** Custom style */
  style?: ViewStyle;
}

const sizeMap = {
  xs: 32,
  sm: 40,
  md: 56,
  lg: 80,
  xl: 120,
};

const fontSizeMap = {
  xs: 12,
  sm: 14,
  md: 20,
  lg: 28,
  xl: 42,
};

const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  status,
  bordered = false,
  style,
}) => {
  const theme = useTheme();
  const avatarSize = sizeMap[size];
  const statusSize = avatarSize * 0.25;

  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: theme.colors.pink500,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...(bordered && {
      borderWidth: 2,
      borderColor: theme.colors.pink500,
    }),
  };

  const statusStyle: ViewStyle = {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: statusSize,
    height: statusSize,
    borderRadius: statusSize / 2,
    backgroundColor: status === 'online' ? theme.colors.success : theme.colors.gray400,
    borderWidth: 2,
    borderColor: theme.colors.background,
  };

  return (
    <View style={[containerStyle, style]}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={{ width: avatarSize, height: avatarSize }}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={{
            color: '#ffffff',
            fontSize: fontSizeMap[size],
            fontWeight: '700',
          }}
        >
          {getInitials(name)}
        </Text>
      )}
      
      {status && <View style={statusStyle} />}
    </View>
  );
};

export default Avatar;
