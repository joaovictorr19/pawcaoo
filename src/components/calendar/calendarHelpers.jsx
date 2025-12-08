import { format } from "date-fns";

/**
 * Generates a Google Calendar URL for a specific event
 */
export const getGoogleCalendarUrl = (event) => {
  const { title, description, location, start, end } = event;
  
  const formatDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    location: location || '',
    dates: `${formatDate(new Date(start))}/${formatDate(new Date(end))}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generates ICS file content for a single event
 */
export const generateICS = (event) => {
  const { title, description, location, start, end, uid } = event;
  
  const formatDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const now = formatDate(new Date());

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PawCão//PawCão App//EN',
    'BEGIN:VEVENT',
    `UID:${uid || new Date().getTime()}@pawcao.net`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatDate(new Date(start))}`,
    `DTEND:${formatDate(new Date(end))}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
};

/**
 * Generates ICS file content for multiple events
 */
export const generateMultiICS = (events) => {
  const formatDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  const now = formatDate(new Date());

  let content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PawCão//PawCão App//EN',
    'X-WR-CALNAME:PawCão Bookings'
  ];

  events.forEach(event => {
    const { title, description, location, start, end, uid } = event;
    content.push(
      'BEGIN:VEVENT',
      `UID:${uid || Math.random().toString(36).substr(2)}@pawcao.net`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatDate(new Date(start))}`,
      `DTEND:${formatDate(new Date(end))}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location || ''}`,
      'END:VEVENT'
    );
  });

  content.push('END:VCALENDAR');
  return content.join('\r\n');
};

/**
 * Downloads an ICS file
 */
export const downloadICS = (filename, content) => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Helper to convert a booking object to a calendar event object
 */
export const bookingToEvent = (booking) => {
  // Calculate end time based on duration
  const dateStr = booking.walk_date || booking.session_date;
  const timeStr = booking.walk_time || booking.session_time;
  
  if (!dateStr || !timeStr) return null;

  // Handle time formats like "10:00 - 11:00" or "10:00"
  let startTime = timeStr;
  if (timeStr.includes('-')) {
    startTime = timeStr.split('-')[0].trim();
  }

  const start = new Date(`${dateStr}T${startTime}`);
  const durationHours = booking.duration_hours || 1;
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  return {
    title: `${booking.type === 'training' ? 'Training' : 'Walk'} with ${booking.dog_name}`,
    description: `Service for ${booking.dog_name}. \nClient: ${booking.owner_name} \nPhone: ${booking.owner_phone || 'N/A'} \nNotes: ${booking.special_notes || 'None'}`,
    location: booking.pickup_address || booking.location || 'Location provided',
    start,
    end,
    uid: booking.id
  };
};