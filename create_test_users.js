/**
 * BeautyCita Test Users Creation Script
 * Creates test client and stylist accounts with full profiles
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');

// Database configuration from .env
const dbConfig = {
  user: 'beautycita_app',
  host: '127.0.0.1',
  database: 'beautycita',
  password: 'qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=',
  port: 5432,
};

async function createTestUsers() {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL database');

    // Hash password: Test1234!
    const passwordHash = await bcrypt.hash('Test1234!', 10);
    console.log('✓ Password hashed');

    // ============================================================================
    // 1. CREATE CLIENT USER
    // ============================================================================
    console.log('\n📝 Creating client user...');

    const clientResult = await client.query(`
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone, role,
        is_verified, is_onboarded, profile_image, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        is_verified = true,
        is_onboarded = true,
        updated_at = NOW()
      RETURNING id, email, first_name, last_name, role
    `, [
      'client1@beautycita.com',
      passwordHash,
      'Sarah',
      'Johnson',
      '+14155551234',
      'CLIENT',
      true,
      true,
      'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/avatars/client1.jpg'
    ]);

    console.log('✓ Client created:', clientResult.rows[0]);

    // ============================================================================
    // 2. CREATE STYLIST USER
    // ============================================================================
    console.log('\n📝 Creating stylist user...');

    const stylistResult = await client.query(`
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone, role,
        is_verified, is_onboarded, profile_image, bio, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        is_verified = true,
        is_onboarded = true,
        bio = EXCLUDED.bio,
        updated_at = NOW()
      RETURNING id, email, first_name, last_name, role
    `, [
      'stylist1@beautycita.com',
      passwordHash,
      'Maria',
      'Rodriguez',
      '+14155559876',
      'STYLIST',
      true,
      true,
      'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/avatars/stylist1.jpg',
      'Professional hair stylist with 10+ years of experience specializing in color treatments, balayage, and modern cuts. Passionate about helping clients find their perfect look!'
    ]);

    const stylistUserId = stylistResult.rows[0].id;
    console.log('✓ Stylist created:', stylistResult.rows[0]);

    // ============================================================================
    // 3. CREATE STYLIST PROFILE
    // ============================================================================
    console.log('\n📝 Creating stylist profile...');

    await client.query(`
      INSERT INTO stylist_profiles (
        user_id, business_name, specialties, years_experience,
        license_number, license_state, license_verified, service_radius_miles,
        accepts_cash, accepts_card, accepts_crypto, accepts_appointments,
        rating_average, total_reviews, total_bookings, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        specialties = EXCLUDED.specialties,
        years_experience = EXCLUDED.years_experience,
        license_verified = true,
        updated_at = NOW()
    `, [
      stylistUserId,
      'Maria\'s Mobile Salon',
      ['Hair Coloring', 'Balayage', 'Haircuts', 'Highlights', 'Hair Extensions', 'Bridal Hair'],
      10,
      'CA-COSMO-123456',
      'CA',
      true,
      25,
      true,
      true,
      true,
      true,
      4.8,
      127,
      856
    ]);

    console.log('✓ Stylist profile created');

    // ============================================================================
    // 4. CREATE SERVICE AREAS
    // ============================================================================
    console.log('\n📝 Creating service areas...');

    const serviceAreas = [
      { city: 'San Francisco', state: 'CA', zip: '94102', lat: 37.7749, lng: -122.4194, primary: true },
      { city: 'Oakland', state: 'CA', zip: '94601', lat: 37.8044, lng: -122.2712, primary: false },
      { city: 'San Jose', state: 'CA', zip: '95113', lat: 37.3382, lng: -121.8863, primary: false }
    ];

    for (const area of serviceAreas) {
      await client.query(`
        INSERT INTO stylist_service_areas (
          stylist_id, city, state, zip_code, latitude, longitude, is_primary, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT DO NOTHING
      `, [stylistUserId, area.city, area.state, area.zip, area.lat, area.lng, area.primary]);
    }

    console.log(`✓ Created ${serviceAreas.length} service areas`);

    // ============================================================================
    // 5. CREATE SERVICES
    // ============================================================================
    console.log('\n📝 Creating services...');

    const services = [
      { name: 'Women\'s Haircut', desc: 'Professional haircut with wash, cut, and style', cat: 'HAIRCUT', dur: 60, price: 75.00 },
      { name: 'Men\'s Haircut', desc: 'Classic or modern men\'s cut with styling', cat: 'HAIRCUT', dur: 45, price: 45.00 },
      { name: 'Full Balayage', desc: 'Hand-painted highlights for natural dimension', cat: 'COLORING', dur: 180, price: 250.00 },
      { name: 'Root Touch-Up', desc: 'Color refresh for root regrowth', cat: 'COLORING', dur: 90, price: 85.00 },
      { name: 'Full Highlights', desc: 'Traditional foil highlights', cat: 'COLORING', dur: 150, price: 180.00 },
      { name: 'Blowout & Style', desc: 'Professional blow dry and styling', cat: 'STYLING', dur: 45, price: 55.00 },
      { name: 'Hair Extensions Install', desc: 'Tape-in or clip-in extensions', cat: 'EXTENSIONS', dur: 120, price: 300.00 },
      { name: 'Bridal Hair Trial', desc: 'Wedding hairstyle consultation and trial', cat: 'BRIDAL', dur: 90, price: 150.00 },
      { name: 'Bridal Hair Service', desc: 'Wedding day hair styling', cat: 'BRIDAL', dur: 120, price: 200.00 }
    ];

    for (const service of services) {
      await client.query(`
        INSERT INTO services (
          stylist_id, name, description, category, duration_minutes, price, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [stylistUserId, service.name, service.desc, service.cat, service.dur, service.price]);
    }

    console.log(`✓ Created ${services.length} services`);

    // ============================================================================
    // 6. CREATE PORTFOLIO
    // ============================================================================
    console.log('\n📝 Creating portfolio items...');

    const portfolio = [
      { title: 'Beachy Waves Balayage', desc: 'Sun-kissed balayage with soft waves', cat: 'COLORING', featured: true },
      { title: 'Modern Bob Cut', desc: 'Sleek asymmetrical bob with precision cutting', cat: 'HAIRCUT', featured: true },
      { title: 'Bridal Updo', desc: 'Romantic updo for wedding day', cat: 'BRIDAL', featured: true },
      { title: 'Platinum Blonde', desc: 'Full platinum transformation', cat: 'COLORING', featured: false },
      { title: 'Textured Layers', desc: 'Long layers with face-framing highlights', cat: 'HAIRCUT', featured: false }
    ];

    for (let i = 0; i < portfolio.length; i++) {
      const item = portfolio[i];
      await client.query(`
        INSERT INTO portfolio_items (
          stylist_id, title, description, image_url, category, is_featured, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT DO NOTHING
      `, [
        stylistUserId,
        item.title,
        item.desc,
        `https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/portfolio/${item.cat.toLowerCase()}${i + 1}.jpg`,
        item.cat,
        item.featured
      ]);
    }

    console.log(`✓ Created ${portfolio.length} portfolio items`);

    // ============================================================================
    // 7. CREATE AVAILABILITY
    // ============================================================================
    console.log('\n📝 Creating availability schedule...');

    const availability = [
      { day: 0, start: '10:00', end: '18:00', available: false }, // Sunday: Closed
      { day: 1, start: '09:00', end: '19:00', available: true },  // Monday
      { day: 2, start: '09:00', end: '19:00', available: true },  // Tuesday
      { day: 3, start: '09:00', end: '19:00', available: true },  // Wednesday
      { day: 4, start: '09:00', end: '20:00', available: true },  // Thursday
      { day: 5, start: '09:00', end: '20:00', available: true },  // Friday
      { day: 6, start: '10:00', end: '17:00', available: true }   // Saturday
    ];

    for (const slot of availability) {
      await client.query(`
        INSERT INTO stylist_availability (
          stylist_id, day_of_week, start_time, end_time, is_available, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT DO NOTHING
      `, [stylistUserId, slot.day, slot.start, slot.end, slot.available]);
    }

    console.log(`✓ Created ${availability.length} availability slots`);

    // ============================================================================
    // 8. VERIFICATION
    // ============================================================================
    console.log('\n📊 Verifying test users...');

    const verification = await client.query(`
      SELECT
        u.id,
        u.email,
        u.first_name || ' ' || u.last_name as name,
        u.role,
        u.is_verified,
        u.is_onboarded,
        sp.business_name,
        sp.rating_average,
        sp.total_bookings,
        (SELECT COUNT(*) FROM services WHERE stylist_id = u.id) as service_count,
        (SELECT COUNT(*) FROM portfolio_items WHERE stylist_id = u.id) as portfolio_count
      FROM users u
      LEFT JOIN stylist_profiles sp ON u.id = sp.user_id
      WHERE u.email IN ('client1@beautycita.com', 'stylist1@beautycita.com')
      ORDER BY u.role
    `);

    console.log('\n✅ TEST USERS CREATED SUCCESSFULLY:\n');
    verification.rows.forEach(user => {
      console.log(`${user.role}: ${user.name} (${user.email})`);
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Verified: ${user.is_verified}`);
      console.log(`  - Onboarded: ${user.is_onboarded}`);
      if (user.business_name) {
        console.log(`  - Business: ${user.business_name}`);
        console.log(`  - Rating: ${user.rating_average}★ (${user.total_bookings} bookings)`);
        console.log(`  - Services: ${user.service_count}`);
        console.log(`  - Portfolio: ${user.portfolio_count} items`);
      }
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Client:  client1@beautycita.com  / Test1234!');
    console.log('Stylist: stylist1@beautycita.com / Test1234!');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✓ Database connection closed');
  }
}

// Run the script
createTestUsers();
