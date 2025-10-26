import React, { useState, useEffect, useRef } from 'react';
import {
  ScheduleComponent,
  Day,
  Week,
  Month,
  Agenda,
  Inject,
  ViewsDirective,
  ViewDirective,
  DragAndDrop,
  Resize,
  EventSettingsModel,
  EventRenderedArgs
} from '@syncfusion/ej2-react-schedule';
import { toast } from 'react-hot-toast';
import { Download, Calendar, RefreshCw, Plus } from 'lucide-react';

interface Booking {
  id: number;
  title: string;
  start_time: Date;
  end_time: Date;
  client_name?: string;
  client_email?: string;
  service_name?: string;
  status: string;
  total_price?: number;
  notes?: string;
}

interface SyncfusionBookingCalendarProps {
  stylistId?: number;
  onBookingUpdate?: (booking: any) => void;
  onBookingCreate?: (booking: any) => void;
}

const SyncfusionBookingCalendar: React.FC<SyncfusionBookingCalendarProps> = ({
  stylistId,
  onBookingUpdate,
  onBookingCreate
}) => {
  const scheduleRef = useRef<ScheduleComponent>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recurringEnabled, setRecurringEnabled] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [stylistId]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bookings/calendar${stylistId ? `?stylistId=${stylistId}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();

        // Transform bookings to Syncfusion format
        const events = data.bookings.map((booking: Booking) => ({
          Id: booking.id,
          Subject: `${booking.service_name || 'Booking'} - ${booking.client_name || 'Client'}`,
          StartTime: new Date(booking.start_time),
          EndTime: new Date(booking.end_time),
          Description: booking.notes || '',
          IsAllDay: false,
          CategoryColor: getStatusColor(booking.status),
          Status: booking.status,
          ClientName: booking.client_name,
          ClientEmail: booking.client_email,
          ServiceName: booking.service_name,
          Price: booking.total_price
        }));

        setBookings(events);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      'CONFIRMED': '#10B981',
      'PENDING': '#F59E0B',
      'CANCELLED': '#EF4444',
      'COMPLETED': '#3B82F6',
      'NO_SHOW': '#6B7280'
    };
    return colors[status] || '#8B5CF6';
  };

  const handleDragStop = async (args: any) => {
    const { data } = args;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bookings/${data.Id}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          start_time: data.StartTime,
          end_time: data.EndTime
        })
      });

      if (response.ok) {
        toast.success('Booking rescheduled successfully');
        if (onBookingUpdate) {
          onBookingUpdate(data);
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to reschedule booking');
        // Revert the change
        fetchBookings();
      }
    } catch (error) {
      console.error('Reschedule error:', error);
      toast.error('Failed to reschedule booking');
      fetchBookings();
    }
  };

  const handleResizeStop = async (args: any) => {
    const { data } = args;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bookings/${data.Id}/update-duration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          end_time: data.EndTime
        })
      });

      if (response.ok) {
        toast.success('Booking duration updated');
        if (onBookingUpdate) {
          onBookingUpdate(data);
        }
      } else {
        toast.error('Failed to update duration');
        fetchBookings();
      }
    } catch (error) {
      console.error('Resize error:', error);
      toast.error('Failed to update duration');
      fetchBookings();
    }
  };

  const handleEventClick = (args: any) => {
    const { event } = args;

    // Custom popup with booking details
    const popup = document.createElement('div');
    popup.innerHTML = `
      <div style="padding: 16px; max-width: 300px;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">
          ${event.Subject}
        </h3>

        <div style="margin-bottom: 8px;">
          <strong>Client:</strong> ${event.ClientName || 'N/A'}
        </div>

        <div style="margin-bottom: 8px;">
          <strong>Service:</strong> ${event.ServiceName || 'N/A'}
        </div>

        <div style="margin-bottom: 8px;">
          <strong>Time:</strong><br/>
          ${event.StartTime.toLocaleString()} -<br/>
          ${event.EndTime.toLocaleString()}
        </div>

        ${event.Price ? `
          <div style="margin-bottom: 8px;">
            <strong>Price:</strong> $${event.Price}
          </div>
        ` : ''}

        <div style="margin-bottom: 12px;">
          <strong>Status:</strong>
          <span style="
            padding: 2px 8px;
            background: ${event.CategoryColor};
            color: white;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 8px;
          ">
            ${event.Status}
          </span>
        </div>

        ${event.Description ? `
          <div style="margin-bottom: 12px;">
            <strong>Notes:</strong><br/>
            ${event.Description}
          </div>
        ` : ''}

        <button
          onclick="window.location.href='/dashboard/bookings/${event.Id}'"
          style="
            width: 100%;
            padding: 8px 16px;
            background: linear-gradient(to right, #EC4899, #8B5CF6);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          "
        >
          View Details
        </button>
      </div>
    `;
  };

  const onEventRendered = (args: EventRenderedArgs) => {
    const { data } = args;

    // Style events based on status
    args.element.style.backgroundColor = data.CategoryColor;
    args.element.style.borderLeft = `4px solid ${data.CategoryColor}`;
  };

  const onActionBegin = (args: any) => {
    if (args.requestType === 'eventCreate') {
      // Handle new event creation
      if (onBookingCreate) {
        onBookingCreate(args.data[0]);
      }
    }
  };

  const exportToICS = () => {
    if (scheduleRef.current) {
      const icsData = generateICSFile(bookings);
      const blob = new Blob([icsData], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-${new Date().toISOString().split('T')[0]}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Calendar exported successfully');
    }
  };

  const generateICSFile = (events: any[]): string => {
    let ics = 'BEGIN:VCALENDAR\r\n';
    ics += 'VERSION:2.0\r\n';
    ics += 'PRODID:-//BeautyCita//Booking Calendar//EN\r\n';
    ics += 'CALSCALE:GREGORIAN\r\n';
    ics += 'METHOD:PUBLISH\r\n';
    ics += 'X-WR-CALNAME:BeautyCita Bookings\r\n';
    ics += 'X-WR-TIMEZONE:UTC\r\n';

    events.forEach(event => {
      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:booking-${event.Id}@beautycita.com\r\n`;
      ics += `DTSTAMP:${formatICSDate(new Date())}\r\n`;
      ics += `DTSTART:${formatICSDate(event.StartTime)}\r\n`;
      ics += `DTEND:${formatICSDate(event.EndTime)}\r\n`;
      ics += `SUMMARY:${event.Subject}\r\n`;
      ics += `DESCRIPTION:${event.Description || ''}\r\n`;
      ics += `STATUS:${event.Status}\r\n`;
      ics += 'END:VEVENT\r\n';
    });

    ics += 'END:VCALENDAR\r\n';
    return ics;
  };

  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const addToGoogleCalendar = () => {
    const events = bookings.slice(0, 10); // Limit to 10 events for URL length
    if (events.length === 0) {
      toast.error('No bookings to add');
      return;
    }

    const event = events[0]; // Add first event for now
    const startDate = event.StartTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = event.EndTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.Subject)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.Description || '')}&location=BeautyCita`;

    window.open(googleCalendarUrl, '_blank');
  };

  const eventSettings: EventSettingsModel = {
    dataSource: bookings,
    fields: {
      id: 'Id',
      subject: { name: 'Subject' },
      startTime: { name: 'StartTime' },
      endTime: { name: 'EndTime' },
      description: { name: 'Description' }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-pink-500" />
          <h2 className="text-lg font-semibold text-white">Booking Calendar</h2>
          <span className="px-3 py-1 bg-pink-600 text-white text-sm font-medium rounded-full">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchBookings}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={exportToICS}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export .ics</span>
          </button>

          <button
            onClick={addToGoogleCalendar}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add to Google</span>
          </button>
        </div>
      </div>

      {/* Syncfusion Scheduler */}
      <div className="bg-white rounded-xl overflow-hidden shadow-lg">
        <ScheduleComponent
          ref={scheduleRef}
          height="650px"
          selectedDate={new Date()}
          eventSettings={eventSettings}
          dragStop={handleDragStop}
          resizeStop={handleResizeStop}
          eventClick={handleEventClick}
          eventRendered={onEventRendered}
          actionBegin={onActionBegin}
          readonly={false}
          allowDragAndDrop={true}
          allowResizing={true}
          showQuickInfo={true}
          cssClass="e-custom-schedule"
        >
          <ViewsDirective>
            <ViewDirective option="Day" />
            <ViewDirective option="Week" />
            <ViewDirective option="Month" />
            <ViewDirective option="Agenda" />
          </ViewsDirective>
          <Inject services={[Day, Week, Month, Agenda, DragAndDrop, Resize]} />
        </ScheduleComponent>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
        <h3 className="text-white font-semibold mb-3">Status Legend</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Confirmed', color: '#10B981' },
            { label: 'Pending', color: '#F59E0B' },
            { label: 'Completed', color: '#3B82F6' },
            { label: 'Cancelled', color: '#EF4444' },
            { label: 'No Show', color: '#6B7280' }
          ].map((status) => (
            <div key={status.label} className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: status.color }}
              ></div>
              <span className="text-sm text-gray-300">{status.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SyncfusionBookingCalendar;
