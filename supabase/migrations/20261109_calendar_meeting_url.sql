-- Store the real video meeting link (Google Meet, Zoom, etc.) from Cal.com.
alter table public.calendar_bookings
  add column if not exists meeting_url text,
  add column if not exists attendee_phone text;

comment on column public.calendar_bookings.meeting_url is
  'Video meeting link from Cal.com (Google Meet, Zoom, etc.).';

comment on column public.calendar_bookings.attendee_phone is
  'Optional phone for the guest when Cal.com provides one.';
