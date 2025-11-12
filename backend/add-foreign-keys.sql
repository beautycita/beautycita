-- Foreign Key Constraints for BeautyCita Database
-- Run this as the database owner (beautycita_app or postgres with GRANT)

BEGIN;

-- Services table - Link to stylists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'fk_services_stylist') THEN
    ALTER TABLE services
    ADD CONSTRAINT fk_services_stylist
    FOREIGN KEY (stylist_id) 
    REFERENCES stylists(id)
    ON DELETE CASCADE;
    RAISE NOTICE 'Added FK: services -> stylists';
  END IF;
END $$;

-- Stylists table - Link to users
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'fk_stylists_user') THEN
    ALTER TABLE stylists
    ADD CONSTRAINT fk_stylists_user
    FOREIGN KEY (user_id) 
    REFERENCES users(id)
    ON DELETE CASCADE;
    RAISE NOTICE 'Added FK: stylists -> users';
  END IF;
END $$;

-- Clients table - Link to users
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'fk_clients_user') THEN
    ALTER TABLE clients
    ADD CONSTRAINT fk_clients_user
    FOREIGN KEY (user_id) 
    REFERENCES users(id)
    ON DELETE CASCADE;
    RAISE NOTICE 'Added FK: clients -> users';
  END IF;
END $$;

-- Bookings table - Multiple FKs
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'fk_bookings_client') THEN
    ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_client
    FOREIGN KEY (client_id) 
    REFERENCES clients(id)
    ON DELETE RESTRICT;
    RAISE NOTICE 'Added FK: bookings -> clients';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'fk_bookings_stylist') THEN
    ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_stylist
    FOREIGN KEY (stylist_id) 
    REFERENCES stylists(id)
    ON DELETE RESTRICT;
    RAISE NOTICE 'Added FK: bookings -> stylists';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'fk_bookings_service') THEN
    ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_service
    FOREIGN KEY (service_id) 
    REFERENCES services(id)
    ON DELETE RESTRICT;
    RAISE NOTICE 'Added FK: bookings -> services';
  END IF;
END $$;

-- Reviews table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'fk_reviews_client') THEN
    ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_client
    FOREIGN KEY (client_id) 
    REFERENCES users(id)
    ON DELETE CASCADE;
    RAISE NOTICE 'Added FK: reviews -> users (client)';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'fk_reviews_stylist') THEN
    ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_stylist
    FOREIGN KEY (stylist_id) 
    REFERENCES stylists(id)
    ON DELETE CASCADE;
    RAISE NOTICE 'Added FK: reviews -> stylists';
  END IF;
END $$;

-- Payments table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'fk_payments_booking') THEN
    ALTER TABLE payments
    ADD CONSTRAINT fk_payments_booking
    FOREIGN KEY (booking_id) 
    REFERENCES bookings(id)
    ON DELETE RESTRICT;
    RAISE NOTICE 'Added FK: payments -> bookings';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'fk_payments_user') THEN
    ALTER TABLE payments
    ADD CONSTRAINT fk_payments_user
    FOREIGN KEY (user_id) 
    REFERENCES users(id)
    ON DELETE RESTRICT;
    RAISE NOTICE 'Added FK: payments -> users';
  END IF;
END $$;

COMMIT;

SELECT 'All foreign key constraints processed!' as result;
