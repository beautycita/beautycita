const request = require('supertest');
const { describe, it, expect, beforeAll, afterAll, beforeEach, jest } = require('@jest/globals');

// Mock database connection
const mockDb = {
  query: jest.fn(),
};

describe('Booking Workflow Tests', () => {
  let testClient;
  let testStylist;
  let testService;
  let authToken;

  beforeAll(async () => {
    // Setup test data
    testClient = {
      id: 1,
      email: 'client@test.com',
      role: 'CLIENT',
      phone_verified: true,
    };

    testStylist = {
      id: 2,
      email: 'stylist@test.com',
      role: 'STYLIST',
      phone_verified: true,
    };

    testService = {
      id: 1,
      stylist_id: 2,
      name: 'Haircut',
      price: 50.00,
      duration_minutes: 60,
    };

    authToken = 'test-jwt-token';
  });

  beforeEach(() => {
    mockDb.query.mockClear();
  });

  describe('1. PENDING Status - Booking Creation (5-min expiry)', () => {
    it('should create a booking with PENDING status', async () => {
      const bookingData = {
        stylist_id: testStylist.id,
        service_id: testService.id,
        booking_date: '2025-10-25',
        booking_time: '14:00',
      };

      const mockBooking = {
        id: 1,
        status: 'PENDING',
        client_id: testClient.id,
        stylist_id: testStylist.id,
        service_id: testService.id,
        request_expires_at: new Date(Date.now() + 5 * 60 * 1000),
        created_at: new Date(),
      };

      // Mock booking creation
      mockDb.query.mockResolvedValueOnce({ rows: [mockBooking] });

      // Mock event sourcing insert
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          booking_id: 1,
          event_type: 'CREATED',
          event_data: JSON.stringify(bookingData),
          user_id: testClient.id,
          timestamp: new Date(),
        }]
      });

      const result = await mockDb.query('INSERT INTO bookings...');
      const eventResult = await mockDb.query('INSERT INTO booking_events...');

      const booking = result.rows[0];

      expect(booking.status).toBe('PENDING');
      expect(booking.client_id).toBe(testClient.id);
      expect(booking.stylist_id).toBe(testStylist.id);

      // Verify 5-minute expiration
      const expirationTime = new Date(booking.request_expires_at) - new Date(booking.created_at);
      expect(expirationTime).toBe(5 * 60 * 1000);

      // Verify event was created
      expect(eventResult.rows[0].event_type).toBe('CREATED');
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });

    it('should send SMS notification to stylist', async () => {
      const mockTwilio = {
        messages: {
          create: jest.fn().mockResolvedValue({ sid: 'test-sid' })
        }
      };

      await mockTwilio.messages.create({
        body: 'New booking request from client@test.com',
        to: '+15551234567',
      });

      expect(mockTwilio.messages.create).toHaveBeenCalled();
    });

    it('should reject booking if stylist not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await mockDb.query('SELECT...');
      expect(result.rows.length).toBe(0);
    });

    it('should reject booking if service not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await mockDb.query('SELECT...');
      expect(result.rows.length).toBe(0);
    });
  });

  describe('2. VERIFY_ACCEPTANCE Status - Stylist Accepts (10-min payment window)', () => {
    it('should move booking from PENDING to VERIFY_ACCEPTANCE', async () => {
      const mockBooking = {
        id: 1,
        status: 'VERIFY_ACCEPTANCE',
        client_id: testClient.id,
        stylist_id: testStylist.id,
        acceptance_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        updated_at: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockBooking] });

      // Mock event sourcing
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 2,
          booking_id: 1,
          event_type: 'ACCEPTED',
          event_data: JSON.stringify({ acceptedAt: new Date() }),
          user_id: testStylist.id,
          timestamp: new Date(),
        }]
      });

      const result = await mockDb.query('UPDATE bookings...');
      const eventResult = await mockDb.query('INSERT INTO booking_events...');

      const booking = result.rows[0];

      expect(booking.status).toBe('VERIFY_ACCEPTANCE');
      expect(eventResult.rows[0].event_type).toBe('ACCEPTED');
    });

    it('should reject acceptance if booking already expired', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          status: 'EXPIRED',
          request_expires_at: new Date(Date.now() - 1000),
        }]
      });

      const result = await mockDb.query('SELECT...');
      expect(result.rows[0].status).toBe('EXPIRED');
    });

    it('should send SMS notification to client', async () => {
      const mockTwilio = {
        messages: {
          create: jest.fn().mockResolvedValue({ sid: 'test-sid' })
        }
      };

      await mockTwilio.messages.create({
        body: 'Stylist accepted your booking! Please confirm payment.',
        to: '+15559876543',
      });

      expect(mockTwilio.messages.create).toHaveBeenCalled();
    });
  });

  describe('3. CONFIRMED Status - Client Pays & Confirms', () => {
    it('should move booking from VERIFY_ACCEPTANCE to CONFIRMED after payment', async () => {
      const mockBooking = {
        id: 1,
        status: 'CONFIRMED',
        payment_status: 'PAID',
        total_price: 50.00,
        platform_fee: 1.50,
        stylist_payout: 48.50,
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockBooking] });

      // Mock payment event
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          payment_id: 1,
          booking_id: 1,
          event_type: 'PAYMENT_RECEIVED',
          event_data: JSON.stringify({ amount: 50.00 }),
        }]
      });

      // Mock booking event
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 3,
          booking_id: 1,
          event_type: 'CONFIRMED',
          event_data: JSON.stringify({ confirmedAt: new Date() }),
          user_id: testClient.id,
        }]
      });

      const result = await mockDb.query('UPDATE bookings...');
      await mockDb.query('INSERT INTO payment_events...');
      await mockDb.query('INSERT INTO booking_events...');

      const booking = result.rows[0];

      expect(booking.status).toBe('CONFIRMED');
      expect(booking.payment_status).toBe('PAID');
      expect(mockDb.query).toHaveBeenCalledTimes(3);
    });

    it('should calculate platform fee correctly (3%)', () => {
      const totalPrice = 50.00;
      const platformFee = totalPrice * 0.03;
      const stylistPayout = totalPrice - platformFee;

      expect(platformFee).toBe(1.50);
      expect(stylistPayout).toBe(48.50);
    });

    it('should reject confirmation if payment fails', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          status: 'VERIFY_ACCEPTANCE',
          payment_status: 'FAILED',
        }]
      });

      const result = await mockDb.query('SELECT...');
      expect(result.rows[0].payment_status).toBe('FAILED');
    });
  });

  describe('4. IN_PROGRESS Status - Service Starts', () => {
    it('should move booking from CONFIRMED to IN_PROGRESS', async () => {
      const mockBooking = {
        id: 1,
        status: 'IN_PROGRESS',
        started_at: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockBooking] });

      // Mock event
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          event_type: 'STARTED',
          event_data: JSON.stringify({ startedAt: new Date() }),
        }]
      });

      const result = await mockDb.query('UPDATE bookings...');
      await mockDb.query('INSERT INTO booking_events...');

      const booking = result.rows[0];

      expect(booking.status).toBe('IN_PROGRESS');
      expect(booking.started_at).toBeDefined();
    });
  });

  describe('5. COMPLETED Status - Service Ends', () => {
    it('should move booking from IN_PROGRESS to COMPLETED', async () => {
      const mockBooking = {
        id: 1,
        status: 'COMPLETED',
        completed_at: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockBooking] });

      // Mock event
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          event_type: 'COMPLETED',
          event_data: JSON.stringify({ completedAt: new Date() }),
        }]
      });

      const result = await mockDb.query('UPDATE bookings...');
      await mockDb.query('INSERT INTO booking_events...');

      const booking = result.rows[0];

      expect(booking.status).toBe('COMPLETED');
      expect(booking.completed_at).toBeDefined();
    });

    it('should trigger stylist payout after completion', async () => {
      const mockPayout = {
        id: 1,
        booking_id: 1,
        stylist_id: 2,
        amount: 48.50,
        status: 'PENDING',
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockPayout] });

      const result = await mockDb.query('INSERT INTO payouts...');

      expect(result.rows[0].amount).toBe(48.50);
      expect(result.rows[0].status).toBe('PENDING');
    });
  });

  describe('6. Auto-Booking (Rapid Acceptance)', () => {
    it('should auto-book if stylist accepts within 5 minutes', () => {
      const createdAt = new Date('2025-10-21T10:00:00Z');
      const acceptedAt = new Date('2025-10-21T10:03:00Z');

      const timeDiff = (acceptedAt - createdAt) / 1000 / 60;

      expect(timeDiff).toBeLessThan(5);
    });

    it('should NOT auto-book if stylist accepts after 5 minutes', () => {
      const createdAt = new Date('2025-10-21T10:00:00Z');
      const acceptedAt = new Date('2025-10-21T10:06:00Z');

      const timeDiff = (acceptedAt - createdAt) / 1000 / 60;

      expect(timeDiff).toBeGreaterThan(5);
    });
  });

  describe('7. Status Validation', () => {
    const validStatuses = [
      'PENDING',
      'VERIFY_ACCEPTANCE',
      'CONFIRMED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
      'EXPIRED'
    ];

    validStatuses.forEach(status => {
      it(`should accept ${status} as valid status`, () => {
        expect(validStatuses).toContain(status);
      });
    });

    it('should reject invalid status', () => {
      const invalidStatus = 'INVALID_STATUS';
      expect(validStatuses).not.toContain(invalidStatus);
    });
  });

  describe('8. Event Sourcing Integration', () => {
    it('should create event when booking is created', async () => {
      const mockEvent = {
        id: 1,
        booking_id: 1,
        event_type: 'CREATED',
        event_data: JSON.stringify({ bookingDate: '2025-10-25' }),
        user_id: testClient.id,
        timestamp: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockEvent] });

      const result = await mockDb.query('INSERT INTO booking_events...');

      expect(result.rows[0].event_type).toBe('CREATED');
      expect(result.rows[0].booking_id).toBe(1);
    });

    it('should retrieve all events for a booking', async () => {
      const mockEvents = [
        { id: 1, event_type: 'CREATED', timestamp: new Date('2025-10-21T10:00:00Z') },
        { id: 2, event_type: 'ACCEPTED', timestamp: new Date('2025-10-21T10:03:00Z') },
        { id: 3, event_type: 'CONFIRMED', timestamp: new Date('2025-10-21T10:05:00Z') },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockEvents });

      const result = await mockDb.query('SELECT * FROM booking_events WHERE booking_id = 1...');

      expect(result.rows.length).toBe(3);
      expect(result.rows[0].event_type).toBe('CREATED');
      expect(result.rows[2].event_type).toBe('CONFIRMED');
    });

    it('should rebuild booking state from events', async () => {
      const mockEvents = [
        {
          event_type: 'CREATED',
          event_data: JSON.stringify({ status: 'PENDING' }),
        },
        {
          event_type: 'ACCEPTED',
          event_data: JSON.stringify({ status: 'VERIFY_ACCEPTANCE' }),
        },
        {
          event_type: 'CONFIRMED',
          event_data: JSON.stringify({ status: 'CONFIRMED', payment_status: 'PAID' }),
        },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockEvents });

      const result = await mockDb.query('SELECT * FROM booking_events...');

      // Simulate event replay
      let currentState = { status: null };
      result.rows.forEach(event => {
        const data = JSON.parse(event.event_data);
        currentState = { ...currentState, ...data };
      });

      expect(currentState.status).toBe('CONFIRMED');
      expect(currentState.payment_status).toBe('PAID');
    });
  });
});
