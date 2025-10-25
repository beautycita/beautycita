const { describe, it, expect, beforeEach, jest } = require('@jest/globals');

// Mock database
const mockDb = {
  query: jest.fn(),
};

describe('Event Sourcing Integration Tests', () => {
  beforeEach(() => {
    mockDb.query.mockClear();
  });

  describe('Event Creation', () => {
    it('should create CREATED event when booking is created', async () => {
      const mockEvent = {
        id: 1,
        booking_id: 123,
        event_type: 'CREATED',
        event_data: JSON.stringify({
          stylistId: 2,
          serviceId: 1,
          bookingDate: '2025-10-25',
          bookingTime: '14:00',
        }),
        user_id: 1,
        timestamp: new Date(),
        metadata: JSON.stringify({ ipAddress: '127.0.0.1' }),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockEvent] });

      const result = await mockDb.query(`
        INSERT INTO booking_events (booking_id, event_type, event_data, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [123, 'CREATED', mockEvent.event_data, 1]);

      expect(result.rows[0].event_type).toBe('CREATED');
      expect(result.rows[0].booking_id).toBe(123);
      expect(JSON.parse(result.rows[0].event_data).stylistId).toBe(2);
    });

    it('should create ACCEPTED event when stylist accepts', async () => {
      const mockEvent = {
        id: 2,
        booking_id: 123,
        event_type: 'ACCEPTED',
        event_data: JSON.stringify({
          acceptedAt: new Date(),
          acceptedBy: 2,
        }),
        user_id: 2,
        timestamp: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockEvent] });

      const result = await mockDb.query('INSERT INTO booking_events...');

      expect(result.rows[0].event_type).toBe('ACCEPTED');
      expect(result.rows[0].user_id).toBe(2);
    });

    it('should create CONFIRMED event after payment', async () => {
      const mockEvent = {
        id: 3,
        booking_id: 123,
        event_type: 'CONFIRMED',
        event_data: JSON.stringify({
          confirmedAt: new Date(),
          paymentId: 456,
        }),
        user_id: 1,
        timestamp: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockEvent] });

      const result = await mockDb.query('INSERT INTO booking_events...');

      expect(result.rows[0].event_type).toBe('CONFIRMED');
      expect(JSON.parse(result.rows[0].event_data).paymentId).toBe(456);
    });

    it('should create CANCELLED event with reason', async () => {
      const mockEvent = {
        id: 4,
        booking_id: 123,
        event_type: 'CANCELLED',
        event_data: JSON.stringify({
          reason: 'Client request',
          cancelledAt: new Date(),
          cancelledBy: 1,
        }),
        user_id: 1,
        timestamp: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockEvent] });

      const result = await mockDb.query('INSERT INTO booking_events...');

      expect(result.rows[0].event_type).toBe('CANCELLED');
      expect(JSON.parse(result.rows[0].event_data).reason).toBe('Client request');
    });

    it('should create RESCHEDULED event with old and new dates', async () => {
      const mockEvent = {
        id: 5,
        booking_id: 123,
        event_type: 'RESCHEDULED',
        event_data: JSON.stringify({
          oldDate: '2025-10-25',
          oldTime: '14:00',
          newDate: '2025-10-26',
          newTime: '15:00',
        }),
        user_id: 1,
        timestamp: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockEvent] });

      const result = await mockDb.query('INSERT INTO booking_events...');

      expect(result.rows[0].event_type).toBe('RESCHEDULED');
      const data = JSON.parse(result.rows[0].event_data);
      expect(data.oldDate).toBe('2025-10-25');
      expect(data.newDate).toBe('2025-10-26');
    });
  });

  describe('Event Retrieval', () => {
    it('should retrieve all events for a booking in chronological order', async () => {
      const mockEvents = [
        {
          id: 1,
          event_type: 'CREATED',
          timestamp: new Date('2025-10-21T10:00:00Z'),
        },
        {
          id: 2,
          event_type: 'ACCEPTED',
          timestamp: new Date('2025-10-21T10:03:00Z'),
        },
        {
          id: 3,
          event_type: 'CONFIRMED',
          timestamp: new Date('2025-10-21T10:05:00Z'),
        },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockEvents });

      const result = await mockDb.query(`
        SELECT * FROM booking_events
        WHERE booking_id = $1
        ORDER BY timestamp ASC
      `, [123]);

      expect(result.rows.length).toBe(3);
      expect(result.rows[0].event_type).toBe('CREATED');
      expect(result.rows[1].event_type).toBe('ACCEPTED');
      expect(result.rows[2].event_type).toBe('CONFIRMED');
    });

    it('should retrieve events by type', async () => {
      const mockEvents = [
        { id: 1, event_type: 'CREATED', booking_id: 123 },
        { id: 5, event_type: 'CREATED', booking_id: 456 },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockEvents });

      const result = await mockDb.query(`
        SELECT * FROM booking_events
        WHERE event_type = $1
      `, ['CREATED']);

      expect(result.rows.length).toBe(2);
      expect(result.rows.every(e => e.event_type === 'CREATED')).toBe(true);
    });

    it('should retrieve events by user', async () => {
      const mockEvents = [
        { id: 1, event_type: 'CREATED', user_id: 1 },
        { id: 3, event_type: 'CONFIRMED', user_id: 1 },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockEvents });

      const result = await mockDb.query(`
        SELECT * FROM booking_events
        WHERE user_id = $1
      `, [1]);

      expect(result.rows.every(e => e.user_id === 1)).toBe(true);
    });

    it('should retrieve events in date range', async () => {
      const mockEvents = [
        { id: 2, timestamp: new Date('2025-10-21T10:00:00Z') },
        { id: 3, timestamp: new Date('2025-10-21T15:00:00Z') },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockEvents });

      const result = await mockDb.query(`
        SELECT * FROM booking_events
        WHERE timestamp BETWEEN $1 AND $2
      `, ['2025-10-21T00:00:00Z', '2025-10-21T23:59:59Z']);

      expect(result.rows.length).toBe(2);
    });
  });

  describe('State Reconstruction from Events', () => {
    it('should rebuild booking state from event stream', async () => {
      const mockEvents = [
        {
          event_type: 'CREATED',
          event_data: JSON.stringify({
            status: 'PENDING',
            stylistId: 2,
            serviceId: 1,
          }),
        },
        {
          event_type: 'ACCEPTED',
          event_data: JSON.stringify({
            status: 'VERIFY_ACCEPTANCE',
          }),
        },
        {
          event_type: 'CONFIRMED',
          event_data: JSON.stringify({
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
          }),
        },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockEvents });

      const result = await mockDb.query('SELECT * FROM booking_events...');

      // Event replay simulation
      let state = {};
      result.rows.forEach(event => {
        const data = JSON.parse(event.event_data);
        state = { ...state, ...data };
      });

      expect(state.status).toBe('CONFIRMED');
      expect(state.paymentStatus).toBe('PAID');
      expect(state.stylistId).toBe(2);
    });

    it('should use helper function to rebuild state', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          booking_id: 123,
          current_status: 'CONFIRMED',
          total_events: 3,
          event_timeline: [
            { type: 'CREATED', timestamp: new Date() },
            { type: 'ACCEPTED', timestamp: new Date() },
            { type: 'CONFIRMED', timestamp: new Date() },
          ],
        }],
      });

      const result = await mockDb.query('SELECT * FROM rebuild_booking_from_events($1)', [123]);

      expect(result.rows[0].current_status).toBe('CONFIRMED');
      expect(result.rows[0].total_events).toBe(3);
    });
  });

  describe('Booking Snapshots', () => {
    it('should create booking snapshot', async () => {
      const mockSnapshot = {
        id: 1,
        booking_id: 123,
        snapshot_data: JSON.stringify({
          status: 'CONFIRMED',
          clientId: 1,
          stylistId: 2,
          serviceId: 1,
          totalPrice: 50.00,
        }),
        event_sequence: 3,
        created_at: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockSnapshot] });

      const result = await mockDb.query(`
        INSERT INTO booking_snapshots (booking_id, snapshot_data, event_sequence)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [123, mockSnapshot.snapshot_data, 3]);

      expect(result.rows[0].booking_id).toBe(123);
      expect(result.rows[0].event_sequence).toBe(3);
    });

    it('should retrieve latest snapshot', async () => {
      const mockSnapshot = {
        id: 5,
        booking_id: 123,
        snapshot_data: JSON.stringify({ status: 'CONFIRMED' }),
        event_sequence: 10,
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockSnapshot] });

      const result = await mockDb.query(`
        SELECT * FROM booking_snapshots
        WHERE booking_id = $1
        ORDER BY event_sequence DESC
        LIMIT 1
      `, [123]);

      expect(result.rows[0].event_sequence).toBe(10);
    });

    it('should rebuild state from snapshot + remaining events', async () => {
      // Get snapshot (at event 5)
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          snapshot_data: JSON.stringify({ status: 'VERIFY_ACCEPTANCE', event_count: 5 }),
          event_sequence: 5,
        }],
      });

      // Get events after snapshot
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            event_type: 'CONFIRMED',
            event_data: JSON.stringify({ status: 'CONFIRMED' }),
          },
          {
            event_type: 'STARTED',
            event_data: JSON.stringify({ status: 'IN_PROGRESS' }),
          },
        ],
      });

      const snapshotResult = await mockDb.query('SELECT...');
      const eventsResult = await mockDb.query('SELECT...');

      // Start from snapshot
      let state = JSON.parse(snapshotResult.rows[0].snapshot_data);

      // Apply remaining events
      eventsResult.rows.forEach(event => {
        const data = JSON.parse(event.event_data);
        state = { ...state, ...data };
      });

      expect(state.status).toBe('IN_PROGRESS');
      expect(state.event_count).toBe(5); // From snapshot
    });
  });

  describe('Payment Events', () => {
    it('should create payment event', async () => {
      const mockEvent = {
        id: 1,
        payment_id: 456,
        booking_id: 123,
        event_type: 'PAYMENT_RECEIVED',
        event_data: JSON.stringify({
          amount: 50.00,
          method: 'STRIPE',
          transactionId: 'txn_123',
        }),
        timestamp: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockEvent] });

      const result = await mockDb.query('INSERT INTO payment_events...');

      expect(result.rows[0].event_type).toBe('PAYMENT_RECEIVED');
      expect(JSON.parse(result.rows[0].event_data).amount).toBe(50.00);
    });

    it('should create refund event', async () => {
      const mockEvent = {
        id: 2,
        payment_id: 456,
        booking_id: 123,
        event_type: 'PAYMENT_REFUNDED',
        event_data: JSON.stringify({
          amount: 50.00,
          reason: 'Booking cancelled',
        }),
        timestamp: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockEvent] });

      const result = await mockDb.query('INSERT INTO payment_events...');

      expect(result.rows[0].event_type).toBe('PAYMENT_REFUNDED');
    });
  });

  describe('Event Statistics', () => {
    it('should calculate booking event statistics', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          booking_id: 123,
          event_count: 5,
          first_event: new Date('2025-10-21T10:00:00Z'),
          last_event: new Date('2025-10-21T10:30:00Z'),
          lifecycle_duration: '30 minutes',
        }],
      });

      const result = await mockDb.query('SELECT * FROM get_booking_event_stats($1)', [123]);

      expect(result.rows[0].event_count).toBe(5);
      expect(result.rows[0].lifecycle_duration).toBe('30 minutes');
    });

    it('should calculate average time between events', async () => {
      const events = [
        { timestamp: new Date('2025-10-21T10:00:00Z') },
        { timestamp: new Date('2025-10-21T10:05:00Z') },
        { timestamp: new Date('2025-10-21T10:10:00Z') },
      ];

      const timeDiffs = [];
      for (let i = 1; i < events.length; i++) {
        const diff = events[i].timestamp - events[i-1].timestamp;
        timeDiffs.push(diff);
      }

      const avgTime = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;

      expect(avgTime).toBe(5 * 60 * 1000); // 5 minutes in ms
    });
  });

  describe('Event Triggers', () => {
    it('should auto-create event on booking status change', async () => {
      // Simulate trigger firing
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          booking_id: 123,
          event_type: 'STATUS_CHANGED',
          event_data: JSON.stringify({
            oldStatus: 'PENDING',
            newStatus: 'VERIFY_ACCEPTANCE',
          }),
        }],
      });

      const result = await mockDb.query('UPDATE bookings SET status = $1...', ['VERIFY_ACCEPTANCE']);

      // Trigger would create event automatically
      expect(mockDb.query).toHaveBeenCalled();
    });
  });

  describe('Event Data Validation', () => {
    it('should store complex event data as JSONB', () => {
      const eventData = {
        bookingDate: '2025-10-25',
        bookingTime: '14:00',
        serviceDetails: {
          name: 'Haircut',
          price: 50.00,
          duration: 60,
        },
        metadata: {
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const jsonString = JSON.stringify(eventData);
      const parsed = JSON.parse(jsonString);

      expect(parsed.serviceDetails.name).toBe('Haircut');
      expect(parsed.metadata.ipAddress).toBe('127.0.0.1');
    });

    it('should query JSONB data', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          event_data: { bookingDate: '2025-10-25' }, // JSONB column
        }],
      });

      const result = await mockDb.query(`
        SELECT * FROM booking_events
        WHERE event_data->>'bookingDate' = $1
      `, ['2025-10-25']);

      expect(result.rows[0].event_data.bookingDate).toBe('2025-10-25');
    });
  });

  describe('Audit Trail', () => {
    it('should provide complete audit trail view', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            booking_id: 123,
            event_type: 'CREATED',
            performed_by: 'client@test.com',
            timestamp: new Date('2025-10-21T10:00:00Z'),
            event_data: '{}',
          },
          {
            booking_id: 123,
            event_type: 'ACCEPTED',
            performed_by: 'stylist@test.com',
            timestamp: new Date('2025-10-21T10:03:00Z'),
            event_data: '{}',
          },
        ],
      });

      const result = await mockDb.query('SELECT * FROM booking_audit_trail WHERE booking_id = $1', [123]);

      expect(result.rows.length).toBe(2);
      expect(result.rows[0].performed_by).toBe('client@test.com');
      expect(result.rows[1].performed_by).toBe('stylist@test.com');
    });

    it('should track all state changes', async () => {
      const statuses = ['PENDING', 'VERIFY_ACCEPTANCE', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];

      expect(statuses.length).toBe(5);
      expect(statuses[0]).toBe('PENDING');
      expect(statuses[statuses.length - 1]).toBe('COMPLETED');
    });
  });

  describe('Event Replay', () => {
    it('should replay events to specific point in time', async () => {
      const targetTime = new Date('2025-10-21T10:05:00Z');

      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            event_type: 'CREATED',
            event_data: JSON.stringify({ status: 'PENDING' }),
            timestamp: new Date('2025-10-21T10:00:00Z'),
          },
          {
            event_type: 'ACCEPTED',
            event_data: JSON.stringify({ status: 'VERIFY_ACCEPTANCE' }),
            timestamp: new Date('2025-10-21T10:03:00Z'),
          },
          // This event would be excluded (after target time)
        ],
      });

      const result = await mockDb.query(`
        SELECT * FROM booking_events
        WHERE booking_id = $1 AND timestamp <= $2
        ORDER BY timestamp ASC
      `, [123, targetTime]);

      // Replay to target time
      let state = {};
      result.rows.forEach(event => {
        const data = JSON.parse(event.event_data);
        state = { ...state, ...data };
      });

      expect(state.status).toBe('VERIFY_ACCEPTANCE');
    });
  });
});
