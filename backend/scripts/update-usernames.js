const { query } = require('../src/db');

async function generateUsernameFromEmail(email) {
  // Extract part before @ and clean it
  const baseUsername = email.split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

  // Check if username is available
  const existingUser = await query('SELECT id FROM users WHERE username = $1', [baseUsername]);

  if (existingUser.rows.length === 0) {
    return baseUsername;
  }

  // If taken, append numbers until we find available one
  let counter = 1;
  let username = `${baseUsername}${counter}`;

  while (counter < 1000) { // Safety limit
    const check = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (check.rows.length === 0) {
      return username;
    }
    counter++;
    username = `${baseUsername}${counter}`;
  }

  // Fallback to random suffix
  const randomSuffix = Math.floor(Math.random() * 10000);
  return `${baseUsername}_${randomSuffix}`;
}

async function updateUsernames() {
  try {
    console.log('Starting username update for existing users...');

    // Get all users without usernames
    const usersResult = await query('SELECT id, email FROM users WHERE username IS NULL');
    const users = usersResult.rows;

    console.log(`Found ${users.length} users without usernames`);

    for (const user of users) {
      const username = await generateUsernameFromEmail(user.email);

      await query(
        'UPDATE users SET username = $1, username_last_changed = $2 WHERE id = $3',
        [username, new Date(), user.id]
      );

      console.log(`✓ Updated user ${user.id} (${user.email}) -> ${username}`);
    }

    console.log('\nUsername update complete!');
    process.exit(0);

  } catch (error) {
    console.error('Error updating usernames:', error);
    process.exit(1);
  }
}

updateUsernames();
