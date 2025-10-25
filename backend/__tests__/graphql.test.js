const { describe, it, expect, beforeAll, jest } = require('@jest/globals');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { graphql } = require('graphql');
const { readFileSync } = require('fs');
const { join } = require('path');

// Mock database
const mockDb = {
  query: jest.fn(),
};

// Mock cache service
const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  getUserProfile: jest.fn(),
  invalidateStylistCache: jest.fn(),
};

describe('GraphQL API Tests', () => {
  let schema;
  let resolvers;

  beforeAll(() => {
    // Load GraphQL schema
    const typeDefs = `
      scalar DateTime

      type User {
        id: ID!
        email: String!
        fullName: String
        role: UserRole!
        stylistProfile: StylistProfile
      }

      enum UserRole {
        CLIENT
        STYLIST
        ADMIN
      }

      type StylistProfile {
        id: ID!
        businessName: String!
        bio: String
        averageRating: Float
        totalReviews: Int
        services: [Service!]!
      }

      type Service {
        id: ID!
        name: String!
        price: Float!
        duration: Int!
        category: String
      }

      type Booking {
        id: ID!
        clientId: ID!
        stylistId: ID!
        serviceId: ID!
        bookingDate: DateTime!
        bookingTime: String!
        status: BookingStatus!
        client: User!
        stylist: StylistProfile!
        service: Service!
        events: [BookingEvent!]!
      }

      enum BookingStatus {
        PENDING
        VERIFY_ACCEPTANCE
        CONFIRMED
        IN_PROGRESS
        COMPLETED
        CANCELLED
        NO_SHOW
        EXPIRED
      }

      type BookingEvent {
        id: ID!
        bookingId: ID!
        eventType: String!
        eventData: String!
        userId: ID!
        timestamp: DateTime!
      }

      input CreateBookingInput {
        stylistId: ID!
        serviceId: ID!
        bookingDate: String!
        bookingTime: String!
        notes: String
      }

      type BookingPayload {
        success: Boolean!
        booking: Booking
        event: BookingEvent
      }

      type Query {
        me: User
        booking(id: ID!): Booking
        bookingEvents(bookingId: ID!): [BookingEvent!]!
      }

      type Mutation {
        createBooking(input: CreateBookingInput!): BookingPayload!
        confirmBooking(bookingId: ID!): BookingPayload!
        cancelBooking(bookingId: ID!, reason: String): BookingPayload!
      }
    `;

    resolvers = {
      DateTime: {
        parseValue(value) {
          return new Date(value);
        },
        serialize(value) {
          return value.toISOString();
        },
      },

      Query: {
        me: async (_, __, { user }) => {
          if (!user) throw new Error('Not authenticated');
          return {
            id: user.userId,
            email: user.email,
            role: user.role,
          };
        },

        booking: async (_, { id }, { user }) => {
          if (!user) throw new Error('Not authenticated');

          mockDb.query.mockResolvedValueOnce({
            rows: [{
              id,
              client_id: 1,
              stylist_id: 2,
              service_id: 1,
              booking_date: new Date('2025-10-25'),
              booking_time: '14:00',
              status: 'CONFIRMED',
            }]
          });

          const result = await mockDb.query('SELECT...');
          return result.rows[0];
        },

        bookingEvents: async (_, { bookingId }, { user }) => {
          if (!user) throw new Error('Not authenticated');

          mockDb.query.mockResolvedValueOnce({
            rows: [
              {
                id: 1,
                booking_id: bookingId,
                event_type: 'CREATED',
                event_data: JSON.stringify({ bookingDate: '2025-10-25' }),
                user_id: 1,
                timestamp: new Date(),
              }
            ]
          });

          const result = await mockDb.query('SELECT...');
          return result.rows;
        },
      },

      Mutation: {
        createBooking: async (_, { input }, { user }) => {
          if (!user) throw new Error('Not authenticated');

          mockDb.query.mockResolvedValueOnce({
            rows: [{
              id: 1,
              client_id: user.userId,
              stylist_id: input.stylistId,
              service_id: input.serviceId,
              booking_date: input.bookingDate,
              booking_time: input.bookingTime,
              status: 'PENDING',
            }]
          });

          mockDb.query.mockResolvedValueOnce({
            rows: [{
              id: 1,
              booking_id: 1,
              event_type: 'CREATED',
              event_data: JSON.stringify(input),
              user_id: user.userId,
              timestamp: new Date(),
            }]
          });

          const bookingResult = await mockDb.query('INSERT...');
          const eventResult = await mockDb.query('INSERT...');

          return {
            success: true,
            booking: bookingResult.rows[0],
            event: eventResult.rows[0],
          };
        },

        confirmBooking: async (_, { bookingId }, { user }) => {
          if (!user) throw new Error('Not authenticated');

          mockDb.query.mockResolvedValueOnce({
            rows: [{
              id: bookingId,
              status: 'CONFIRMED',
            }]
          });

          mockDb.query.mockResolvedValueOnce({
            rows: [{
              id: 2,
              booking_id: bookingId,
              event_type: 'CONFIRMED',
              event_data: JSON.stringify({ confirmedAt: new Date() }),
              user_id: user.userId,
              timestamp: new Date(),
            }]
          });

          const bookingResult = await mockDb.query('UPDATE...');
          const eventResult = await mockDb.query('INSERT...');

          return {
            success: true,
            booking: bookingResult.rows[0],
            event: eventResult.rows[0],
          };
        },

        cancelBooking: async (_, { bookingId, reason }, { user }) => {
          if (!user) throw new Error('Not authenticated');

          mockDb.query.mockResolvedValueOnce({
            rows: [{
              id: bookingId,
              status: 'CANCELLED',
            }]
          });

          mockDb.query.mockResolvedValueOnce({
            rows: [{
              id: 3,
              booking_id: bookingId,
              event_type: 'CANCELLED',
              event_data: JSON.stringify({ reason, cancelledAt: new Date() }),
              user_id: user.userId,
              timestamp: new Date(),
            }]
          });

          const bookingResult = await mockDb.query('UPDATE...');
          const eventResult = await mockDb.query('INSERT...');

          return {
            success: true,
            booking: bookingResult.rows[0],
            event: eventResult.rows[0],
          };
        },
      },

      Booking: {
        client: async (booking) => {
          mockDb.query.mockResolvedValueOnce({
            rows: [{
              id: booking.client_id,
              email: 'client@test.com',
              role: 'CLIENT',
            }]
          });

          const result = await mockDb.query('SELECT...');
          return result.rows[0];
        },

        stylist: async (booking) => {
          mockDb.query.mockResolvedValueOnce({
            rows: [{
              id: booking.stylist_id,
              business_name: 'Test Stylist',
            }]
          });

          const result = await mockDb.query('SELECT...');
          return result.rows[0];
        },

        service: async (booking) => {
          mockDb.query.mockResolvedValueOnce({
            rows: [{
              id: booking.service_id,
              name: 'Haircut',
              price: 50.00,
              duration: 60,
            }]
          });

          const result = await mockDb.query('SELECT...');
          return result.rows[0];
        },

        events: async (booking) => {
          mockDb.query.mockResolvedValueOnce({
            rows: [{
              id: 1,
              booking_id: booking.id,
              event_type: 'CREATED',
              event_data: '{}',
              user_id: 1,
              timestamp: new Date(),
            }]
          });

          const result = await mockDb.query('SELECT...');
          return result.rows;
        },
      },
    };

    schema = makeExecutableSchema({ typeDefs, resolvers });
  });

  beforeEach(() => {
    mockDb.query.mockClear();
    mockCacheService.get.mockClear();
    mockCacheService.set.mockClear();
  });

  describe('Schema Validation', () => {
    it('should have valid schema', () => {
      expect(schema).toBeDefined();
      expect(schema.getTypeMap()).toHaveProperty('Query');
      expect(schema.getTypeMap()).toHaveProperty('Mutation');
    });

    it('should define User type', () => {
      const userType = schema.getType('User');
      expect(userType).toBeDefined();
      expect(userType.getFields()).toHaveProperty('id');
      expect(userType.getFields()).toHaveProperty('email');
      expect(userType.getFields()).toHaveProperty('role');
    });

    it('should define Booking type', () => {
      const bookingType = schema.getType('Booking');
      expect(bookingType).toBeDefined();
      expect(bookingType.getFields()).toHaveProperty('id');
      expect(bookingType.getFields()).toHaveProperty('status');
      expect(bookingType.getFields()).toHaveProperty('events');
    });

    it('should define BookingEvent type', () => {
      const eventType = schema.getType('BookingEvent');
      expect(eventType).toBeDefined();
      expect(eventType.getFields()).toHaveProperty('eventType');
      expect(eventType.getFields()).toHaveProperty('eventData');
    });
  });

  describe('Query Resolvers', () => {
    it('should query current user', async () => {
      const query = `
        query {
          me {
            id
            email
            role
          }
        }
      `;

      const context = {
        user: { userId: 1, email: 'test@example.com', role: 'CLIENT' },
      };

      const result = await graphql({ schema, source: query, contextValue: context });

      expect(result.errors).toBeUndefined();
      expect(result.data.me).toEqual({
        id: '1',
        email: 'test@example.com',
        role: 'CLIENT',
      });
    });

    it('should require authentication for me query', async () => {
      const query = `
        query {
          me {
            id
          }
        }
      `;

      const context = { user: null };

      const result = await graphql({ schema, source: query, contextValue: context });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain('Not authenticated');
    });

    it('should query booking with events', async () => {
      const query = `
        query {
          booking(id: "1") {
            id
            status
            events {
              eventType
              timestamp
            }
          }
        }
      `;

      const context = {
        user: { userId: 1, email: 'test@example.com', role: 'CLIENT' },
      };

      const result = await graphql({ schema, source: query, contextValue: context });

      expect(result.errors).toBeUndefined();
      expect(result.data.booking).toBeDefined();
      expect(result.data.booking.status).toBe('CONFIRMED');
      expect(result.data.booking.events).toBeDefined();
    });

    it('should query booking events', async () => {
      const query = `
        query {
          bookingEvents(bookingId: "1") {
            id
            eventType
            eventData
          }
        }
      `;

      const context = {
        user: { userId: 1, email: 'test@example.com', role: 'CLIENT' },
      };

      const result = await graphql({ schema, source: query, contextValue: context });

      expect(result.errors).toBeUndefined();
      expect(result.data.bookingEvents).toBeDefined();
      expect(result.data.bookingEvents.length).toBeGreaterThan(0);
      expect(result.data.bookingEvents[0].eventType).toBe('CREATED');
    });
  });

  describe('Mutation Resolvers', () => {
    it('should create booking with event', async () => {
      const mutation = `
        mutation {
          createBooking(input: {
            stylistId: "2"
            serviceId: "1"
            bookingDate: "2025-10-25"
            bookingTime: "14:00"
          }) {
            success
            booking {
              id
              status
            }
            event {
              eventType
            }
          }
        }
      `;

      const context = {
        user: { userId: 1, email: 'test@example.com', role: 'CLIENT' },
      };

      const result = await graphql({ schema, source: mutation, contextValue: context });

      expect(result.errors).toBeUndefined();
      expect(result.data.createBooking.success).toBe(true);
      expect(result.data.createBooking.booking.status).toBe('PENDING');
      expect(result.data.createBooking.event.eventType).toBe('CREATED');
    });

    it('should confirm booking with event', async () => {
      const mutation = `
        mutation {
          confirmBooking(bookingId: "1") {
            success
            booking {
              status
            }
            event {
              eventType
            }
          }
        }
      `;

      const context = {
        user: { userId: 1, email: 'test@example.com', role: 'CLIENT' },
      };

      const result = await graphql({ schema, source: mutation, contextValue: context });

      expect(result.errors).toBeUndefined();
      expect(result.data.confirmBooking.success).toBe(true);
      expect(result.data.confirmBooking.booking.status).toBe('CONFIRMED');
      expect(result.data.confirmBooking.event.eventType).toBe('CONFIRMED');
    });

    it('should cancel booking with reason', async () => {
      const mutation = `
        mutation {
          cancelBooking(bookingId: "1", reason: "Client request") {
            success
            booking {
              status
            }
            event {
              eventType
              eventData
            }
          }
        }
      `;

      const context = {
        user: { userId: 1, email: 'test@example.com', role: 'CLIENT' },
      };

      const result = await graphql({ schema, source: mutation, contextValue: context });

      expect(result.errors).toBeUndefined();
      expect(result.data.cancelBooking.success).toBe(true);
      expect(result.data.cancelBooking.booking.status).toBe('CANCELLED');
      expect(result.data.cancelBooking.event.eventType).toBe('CANCELLED');
      expect(result.data.cancelBooking.event.eventData).toContain('Client request');
    });

    it('should require authentication for mutations', async () => {
      const mutation = `
        mutation {
          createBooking(input: {
            stylistId: "2"
            serviceId: "1"
            bookingDate: "2025-10-25"
            bookingTime: "14:00"
          }) {
            success
          }
        }
      `;

      const context = { user: null };

      const result = await graphql({ schema, source: mutation, contextValue: context });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain('Not authenticated');
    });
  });

  describe('Field Resolvers', () => {
    it('should resolve booking.client field', async () => {
      const query = `
        query {
          booking(id: "1") {
            id
            client {
              id
              email
            }
          }
        }
      `;

      const context = {
        user: { userId: 1, email: 'test@example.com', role: 'CLIENT' },
      };

      const result = await graphql({ schema, source: query, contextValue: context });

      expect(result.errors).toBeUndefined();
      expect(result.data.booking.client).toBeDefined();
      expect(result.data.booking.client.email).toBe('client@test.com');
    });

    it('should resolve booking.stylist field', async () => {
      const query = `
        query {
          booking(id: "1") {
            id
            stylist {
              id
              businessName
            }
          }
        }
      `;

      const context = {
        user: { userId: 1, email: 'test@example.com', role: 'CLIENT' },
      };

      const result = await graphql({ schema, source: query, contextValue: context });

      expect(result.errors).toBeUndefined();
      expect(result.data.booking.stylist).toBeDefined();
      expect(result.data.booking.stylist.businessName).toBe('Test Stylist');
    });

    it('should resolve booking.service field', async () => {
      const query = `
        query {
          booking(id: "1") {
            id
            service {
              name
              price
              duration
            }
          }
        }
      `;

      const context = {
        user: { userId: 1, email: 'test@example.com', role: 'CLIENT' },
      };

      const result = await graphql({ schema, source: query, contextValue: context });

      expect(result.errors).toBeUndefined();
      expect(result.data.booking.service).toBeDefined();
      expect(result.data.booking.service.name).toBe('Haircut');
      expect(result.data.booking.service.price).toBe(50);
    });

    it('should resolve booking.events field', async () => {
      const query = `
        query {
          booking(id: "1") {
            id
            events {
              eventType
            }
          }
        }
      `;

      const context = {
        user: { userId: 1, email: 'test@example.com', role: 'CLIENT' },
      };

      const result = await graphql({ schema, source: query, contextValue: context });

      expect(result.errors).toBeUndefined();
      expect(result.data.booking.events).toBeDefined();
      expect(result.data.booking.events.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const query = `
        query {
          booking(id: "1") {
            id
          }
        }
      `;

      const context = {
        user: { userId: 1, email: 'test@example.com', role: 'CLIENT' },
      };

      const result = await graphql({ schema, source: query, contextValue: context });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain('Database connection failed');
    });

    it('should validate required fields', async () => {
      const mutation = `
        mutation {
          createBooking(input: {
            stylistId: "2"
          }) {
            success
          }
        }
      `;

      const context = {
        user: { userId: 1, email: 'test@example.com', role: 'CLIENT' },
      };

      const result = await graphql({ schema, source: mutation, contextValue: context });

      expect(result.errors).toBeDefined();
    });
  });
});
