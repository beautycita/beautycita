import secureStorage from "./secureStorage";

/**
 * Storage Migration Helper
 * 
 * Migrates existing localStorage data to secureStorage on first mobile app launch.
 * This ensures existing users are not logged out when upgrading to the secure version.
 */

const MIGRATION_KEY = "_storage_migrated_v1";

const KEYS_TO_MIGRATE = [
  "authToken",
  "beautycita-auth-token",
  "token",
  "user",
  "beautycita-auth",
  "language",
  "beautyCitaLanguage",
  "darkMode",
];

export async function migrateToSecureStorage(): Promise<void> {
  // Only run on native platforms
  if (!secureStorage.isNative()) {
    return;
  }

  // Check if migration already completed
  const migrated = await secureStorage.getItem(MIGRATION_KEY);
  if (migrated === "true") {
    console.log("✅ Storage migration already completed");
    return;
  }

  console.log("🔄 Starting localStorage to secureStorage migration...");

  let migratedCount = 0;

  // Migrate each key
  for (const key of KEYS_TO_MIGRATE) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      try {
        await secureStorage.setItem(key, value);
        migratedCount++;
        console.log(`✅ Migrated: ${key}`);
      } catch (error) {
        console.error(`❌ Failed to migrate ${key}:`, error);
      }
    }
  }

  // Mark migration as complete
  await secureStorage.setItem(MIGRATION_KEY, "true");

  console.log(`✅ Migration complete! ${migratedCount} items migrated.`);

  // Optional: Clear localStorage on mobile (data is now in secure storage)
  // Uncomment if you want to remove the old insecure data
  // KEYS_TO_MIGRATE.forEach(key => localStorage.removeItem(key));
}

export default migrateToSecureStorage;
