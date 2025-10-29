/**
 * User Management Screen (Admin)
 * View and manage all platform users
 * Features:
 * - User list with search and filters
 * - User roles (Client, Stylist, Admin)
 * - Account status (Active, Suspended, Banned)
 * - Quick actions (View, Edit, Suspend, Ban)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { PillButton } from '../../components/design-system';

type UserRole = 'CLIENT' | 'STYLIST' | 'ADMIN' | 'SUPERADMIN';
type UserStatus = 'active' | 'suspended' | 'banned';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

/**
 * User Management Screen Component
 */
export const UserManagementScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | 'ALL'>('ALL');

  // Mock users (to be replaced with API call)
  const mockUsers: User[] = [
    {
      id: 1,
      name: 'Sarah Martinez',
      email: 'sarah.m@example.com',
      phone: '+1234567890',
      role: 'CLIENT',
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
      createdAt: '2025-01-15',
      lastLogin: '2 hours ago',
    },
    {
      id: 2,
      name: 'Maria Garcia',
      email: 'maria.g@example.com',
      phone: '+1234567891',
      role: 'STYLIST',
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
      createdAt: '2025-01-10',
      lastLogin: '1 day ago',
    },
    {
      id: 3,
      name: 'John Admin',
      email: 'john.admin@beautycita.com',
      role: 'ADMIN',
      status: 'active',
      emailVerified: true,
      phoneVerified: false,
      createdAt: '2024-12-01',
      lastLogin: '5 min ago',
    },
  ];

  const roles = ['ALL', 'CLIENT', 'STYLIST', 'ADMIN', 'SUPERADMIN'];
  const statuses = ['ALL', 'active', 'suspended', 'banned'];

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'ALL' || user.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'CLIENT':
        return colors.blue500;
      case 'STYLIST':
        return colors.purple600;
      case 'ADMIN':
        return colors.pink500;
      case 'SUPERADMIN':
        return colors.gray900;
      default:
        return colors.gray500;
    }
  };

  const getStatusBadgeColor = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return colors.green500;
      case 'suspended':
        return colors.yellow500;
      case 'banned':
        return colors.red500;
      default:
        return colors.gray500;
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userCard}>
      {/* User Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name[0]}</Text>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.name}</Text>
          <View style={styles.badges}>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: `${getRoleBadgeColor(item.role)}20` },
              ]}>
              <Text
                style={[styles.roleText, { color: getRoleBadgeColor(item.role) }]}>
                {item.role}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusBadgeColor(item.status)}20` },
              ]}>
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusBadgeColor(item.status) },
                ]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.userEmail}>{item.email}</Text>

        <View style={styles.userMeta}>
          <Text style={styles.metaText}>
            {item.emailVerified ? '✅' : '❌'} Email
          </Text>
          <Text style={styles.metaText}>
            {item.phoneVerified ? '✅' : '❌'} Phone
          </Text>
          {item.lastLogin && (
            <Text style={styles.metaText}>🕐 {item.lastLogin}</Text>
          )}
        </View>

        <View style={styles.actions}>
          <PillButton variant="outline" size="small" style={styles.actionBtn}>
            View
          </PillButton>
          <PillButton variant="outline" size="small" style={styles.actionBtn}>
            Edit
          </PillButton>
          {item.status === 'active' && (
            <PillButton variant="ghost" size="small" style={styles.actionBtn}>
              Suspend
            </PillButton>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {/* Role Filter */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Role:</Text>
          <View style={styles.filterChips}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.filterChip,
                  selectedRole === role && styles.filterChipActive,
                ]}
                onPress={() => setSelectedRole(role as UserRole | 'ALL')}>
                <Text
                  style={[
                    styles.filterChipText,
                    selectedRole === role && styles.filterChipTextActive,
                  ]}>
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status Filter */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Status:</Text>
          <View style={styles.filterChips}>
            {statuses.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  selectedStatus === status && styles.filterChipActive,
                ]}
                onPress={() => setSelectedStatus(status as UserStatus | 'ALL')}>
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStatus === status && styles.filterChipTextActive,
                  ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Results Count */}
      <Text style={styles.resultsCount}>
        {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
      </Text>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  title: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    marginBottom: spacing.md,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray900,
  },
  clearIcon: {
    fontSize: 20,
    color: colors.gray400,
    paddingHorizontal: spacing.xs,
  },

  // Filters
  filters: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  filterRow: {
    marginBottom: spacing.sm,
  },
  filterLabel: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray700,
    marginBottom: spacing.xs,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  filterChipActive: {
    backgroundColor: colors.pink50,
    borderColor: colors.pink500,
  },
  filterChipText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },
  filterChipTextActive: {
    color: colors.pink500,
  },

  // Results
  resultsCount: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // User Card
  userCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.pink100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.pink500,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyBold,
    color: colors.gray900,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyBold,
  },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyBold,
    textTransform: 'capitalize',
  },
  userEmail: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  userMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtn: {
    flex: 1,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.h4,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
    textAlign: 'center',
  },
});

export default UserManagementScreen;
