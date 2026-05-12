-- Backfill rsvp_required for existing events.
-- Default policy: Sunday School never needs two-deep coverage; everything else does.
-- The column default stays at false; leaders explicitly toggle the flag in the
-- event editor and the seed script picks the right value per type.

update public.events
   set rsvp_required = (type <> 'sunday_school')
 where true;
