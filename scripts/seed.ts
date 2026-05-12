/**
 * Seed the Coral Canyon 3rd Ward Supabase project with realistic dev data.
 *
 * Run with:  npm run seed
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local. Idempotent: re-running
 * upserts by email/slug rather than duplicating data.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import {
  addDays,
  addMonths,
  formatISO,
  setHours,
  setMinutes,
  startOfDay,
  startOfWeek,
} from "date-fns";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type SeedUser = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: "adult_leader" | "youth" | "general";
  birth_date?: string;
};

const PASSWORD = "CoralCanyon!23";

const SEED_USERS: SeedUser[] = [
  { email: "advisor1@coralcanyon.local", password: PASSWORD, first_name: "Brother", last_name: "Johnson", role: "adult_leader" },
  { email: "advisor2@coralcanyon.local", password: PASSWORD, first_name: "Brother", last_name: "Lee", role: "adult_leader" },
  { email: "advisor3@coralcanyon.local", password: PASSWORD, first_name: "Brother", last_name: "Garcia", role: "adult_leader" },
  { email: "youth1@coralcanyon.local", password: PASSWORD, first_name: "Aiden", last_name: "Parker", role: "youth", birth_date: birthdayInCurrentMonth(12, 1) },
  { email: "youth2@coralcanyon.local", password: PASSWORD, first_name: "Beckham", last_name: "Reed", role: "youth", birth_date: birthdayInCurrentMonth(13, 7) },
  { email: "youth3@coralcanyon.local", password: PASSWORD, first_name: "Caleb", last_name: "Stone", role: "youth", birth_date: birthdayNextMonth(11, 3) },
  { email: "youth4@coralcanyon.local", password: PASSWORD, first_name: "Dax", last_name: "Whitman", role: "youth", birth_date: birthdayInCurrentMonth(11, 22) },
  { email: "youth5@coralcanyon.local", password: PASSWORD, first_name: "Easton", last_name: "Vance", role: "youth", birth_date: birthdayNextMonth(12, 14) },
  { email: "youth6@coralcanyon.local", password: PASSWORD, first_name: "Finn", last_name: "Holloway", role: "youth", birth_date: birthdayNextMonth(13, 28) },
  { email: "parent1@coralcanyon.local", password: PASSWORD, first_name: "Sarah", last_name: "Parker", role: "general" },
  { email: "parent2@coralcanyon.local", password: PASSWORD, first_name: "Michael", last_name: "Reed", role: "general" },
];

function birthdayInCurrentMonth(age: number, day: number) {
  const birthYear = new Date().getFullYear() - age;
  const month = new Date().getMonth() + 1;
  return `${birthYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function birthdayNextMonth(age: number, day: number) {
  const birthYear = new Date().getFullYear() - age;
  const month = addMonths(new Date(), 1).getMonth() + 1;
  return `${birthYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

async function upsertUsers() {
  console.log("» Upserting users...");
  const idByEmail = new Map<string, string>();

  // Fetch all existing users once up front
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const existingByEmail = new Map<string, string>();
  for (const u of (list?.users ?? []) as { id: string; email?: string | null }[]) {
    if (u.email) existingByEmail.set(u.email, u.id);
  }

  for (const u of SEED_USERS) {
    const existing = existingByEmail.get(u.email);

    let userId: string;
    if (existing) {
      userId = existing;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { first_name: u.first_name, last_name: u.last_name },
      });
      if (error || !data.user) {
        throw new Error(`Failed to create ${u.email}: ${error?.message}`);
      }
      userId = data.user.id;
    }

    // Set role + name + birth_date via profile upsert
    const { error: profileErr } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        role: u.role,
        birth_date: u.birth_date ?? null,
      },
      { onConflict: "id" },
    );
    if (profileErr) throw new Error(`Profile upsert: ${profileErr.message}`);

    idByEmail.set(u.email, userId);
    console.log(`  ✓ ${u.email} [${u.role}]`);
  }
  return idByEmail;
}

async function upsertCallings() {
  console.log("» Upserting callings...");
  const callings = [
    { name: "President", slug: "president", sort_order: 1, description: "Deacons Quorum President" },
    { name: "First Counselor", slug: "first-counselor", sort_order: 2, description: "First Counselor in the Presidency" },
    { name: "Second Counselor", slug: "second-counselor", sort_order: 3, description: "Second Counselor in the Presidency" },
    { name: "Secretary", slug: "secretary", sort_order: 4, description: "Quorum Secretary" },
  ];
  const idBySlug = new Map<string, string>();
  for (const c of callings) {
    const { data, error } = await supabase
      .from("callings")
      .upsert(c, { onConflict: "slug" })
      .select("id, slug")
      .single();
    if (error || !data) throw new Error(`Callings upsert: ${error?.message}`);
    idBySlug.set(data.slug, data.id);
    console.log(`  ✓ ${data.slug}`);
  }
  return idBySlug;
}

async function assignCallings(
  userIds: Map<string, string>,
  callingIds: Map<string, string>,
) {
  console.log("» Assigning callings...");
  await supabase.from("calling_assignments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const assignments = [
    { email: "youth1@coralcanyon.local", slug: "president" },
    { email: "youth2@coralcanyon.local", slug: "first-counselor" },
    { email: "youth3@coralcanyon.local", slug: "second-counselor" },
    { email: "youth4@coralcanyon.local", slug: "secretary" },
  ];
  for (const a of assignments) {
    const profile_id = userIds.get(a.email);
    const calling_id = callingIds.get(a.slug);
    if (!profile_id || !calling_id) continue;
    const { error } = await supabase.from("calling_assignments").insert({
      profile_id,
      calling_id,
    });
    if (error) throw new Error(`Calling assignment: ${error.message}`);
    console.log(`  ✓ ${a.email} -> ${a.slug}`);
  }
}

function nextSundayAt(weeksAhead: number) {
  const today = new Date();
  const sunday = startOfWeek(addDays(today, weeksAhead * 7), { weekStartsOn: 0 });
  return setMinutes(setHours(sunday, 11), 0);
}

async function upsertEvents() {
  console.log("» Upserting events...");
  await supabase.from("events").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const sundays = [0, 1, 2, 3].map((w) => nextSundayAt(w));
  const sundayTypes = sundays.map((d) => {
    const ordinal = Math.ceil(d.getDate() / 7);
    return ordinal === 1 || ordinal === 3 ? "sunday_school" : "quorum_meeting";
  });

  const wednesdayActivity = setMinutes(
    setHours(addDays(startOfDay(new Date()), 5 - new Date().getDay() + 7), 19),
    0,
  );
  const campStart = addDays(startOfDay(new Date()), 21);
  const campEnd = addDays(campStart, 3);
  const serviceDate = setMinutes(setHours(addDays(startOfDay(new Date()), 14), 9), 0);

  const events = [
    ...sundays.map((d, i) => ({
      title: sundayTypes[i] === "quorum_meeting" ? "Quorum Meeting" : "Sunday School",
      type: sundayTypes[i],
      start_at: formatISO(d),
      end_at: formatISO(setMinutes(setHours(d, 12), 0)),
      location: "Chapel",
      rsvp_required: sundayTypes[i] !== "sunday_school",
    })),
    {
      title: "Mid-week Activity: Service Knot-Tying",
      type: "activity",
      start_at: formatISO(wednesdayActivity),
      end_at: formatISO(setMinutes(setHours(wednesdayActivity, 20), 30)),
      location: "Cultural Hall",
      rsvp_required: true,
    },
    {
      title: "Summer Camp",
      type: "camp",
      start_at: formatISO(campStart),
      end_at: formatISO(campEnd),
      location: "Pine Valley",
      description: "Wed-Sat camp with hiking, service, and devotionals.",
      rsvp_required: true,
    },
    {
      title: "Community Service Project",
      type: "service",
      start_at: formatISO(serviceDate),
      end_at: formatISO(setMinutes(setHours(serviceDate, 12), 0)),
      location: "Stake Center",
      rsvp_required: true,
    },
  ];

  const { data, error } = await supabase
    .from("events")
    .insert(events)
    .select("id, title, start_at, type");
  if (error) throw new Error(`Events insert: ${error.message}`);
  console.log(`  ✓ ${data?.length ?? 0} events`);
  return data ?? [];
}

async function seedLeaderRsvps(
  events: { id: string; type: string }[],
  userIds: Map<string, string>,
) {
  console.log("» Seeding leader RSVPs...");
  await supabase
    .from("leader_rsvps")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  const sundays = events.filter((e) => e.type === "sunday_school" || e.type === "quorum_meeting");
  const advisor1 = userIds.get("advisor1@coralcanyon.local")!;
  const advisor2 = userIds.get("advisor2@coralcanyon.local")!;
  const advisor3 = userIds.get("advisor3@coralcanyon.local")!;

  const rsvps: { event_id: string; leader_id: string; status: "attending" | "unavailable" | "undecided" }[] = [];
  sundays.forEach((s, idx) => {
    if (idx === 1) {
      // intentional under-staffed Sunday: only one attending
      rsvps.push({ event_id: s.id, leader_id: advisor1, status: "attending" });
      rsvps.push({ event_id: s.id, leader_id: advisor2, status: "unavailable" });
      rsvps.push({ event_id: s.id, leader_id: advisor3, status: "unavailable" });
    } else {
      rsvps.push({ event_id: s.id, leader_id: advisor1, status: "attending" });
      rsvps.push({ event_id: s.id, leader_id: advisor2, status: "attending" });
      rsvps.push({
        event_id: s.id,
        leader_id: advisor3,
        status: idx === 0 ? "attending" : "undecided",
      });
    }
  });
  const { error } = await supabase.from("leader_rsvps").insert(rsvps);
  if (error) throw new Error(`Leader RSVPs: ${error.message}`);
  console.log(`  ✓ ${rsvps.length} RSVPs (Sunday #2 intentionally under-staffed)`);
}

async function seedAnnouncements(userIds: Map<string, string>) {
  console.log("» Seeding announcements...");
  await supabase
    .from("announcements")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  const advisor1 = userIds.get("advisor1@coralcanyon.local")!;
  const advisor2 = userIds.get("advisor2@coralcanyon.local")!;
  const announcements = [
    {
      author_id: advisor1,
      body: "Welcome to the new Deacons Quorum dashboard! Sign up, mark your Sundays, and let's have a great quarter.",
    },
    {
      author_id: advisor2,
      body: "Reminder: bring closed-toe shoes for Wednesday's service knot-tying activity.",
    },
    {
      author_id: advisor1,
      body: "Summer camp registration packets are due by the end of the month. Talk to your parents tonight.",
    },
  ];
  const { error } = await supabase.from("announcements").insert(announcements);
  if (error) throw new Error(`Announcements: ${error.message}`);
  console.log(`  ✓ ${announcements.length} announcements`);
}

async function seedSundayProgram(
  events: { id: string; title: string; type: string; start_at: string }[],
  userIds: Map<string, string>,
) {
  console.log("» Seeding sample sunday program...");
  const quorum = events.find((e) => e.type === "quorum_meeting");
  if (!quorum) {
    console.log("  (no quorum meeting in seeded events; skipping)");
    return;
  }
  await supabase
    .from("sunday_programs")
    .delete()
    .eq("event_id", quorum.id);
  const { data: program, error: progErr } = await supabase
    .from("sunday_programs")
    .insert({
      event_id: quorum.id,
      theme: "Hearts knit together in love",
      hymn: "Hymn 220 - Lord, I Would Follow Thee",
      notes: "Plan to wrap up by 12:50. President will introduce.",
    })
    .select("id")
    .single();
  if (progErr || !program) throw new Error(`Program: ${progErr?.message}`);

  const advisor1 = userIds.get("advisor1@coralcanyon.local")!;
  const advisor2 = userIds.get("advisor2@coralcanyon.local")!;
  const youth1 = userIds.get("youth1@coralcanyon.local")!;
  const youth2 = userIds.get("youth2@coralcanyon.local")!;
  const youth3 = userIds.get("youth3@coralcanyon.local")!;
  const youth4 = userIds.get("youth4@coralcanyon.local")!;

  const blocks = [
    { type: "presiding", label: "Presiding", assignee_id: advisor1, position: 1 },
    { type: "conducting", label: "Conducting", assignee_id: youth1, position: 2 },
    { type: "opening_prayer", label: "Opening Prayer", assignee_id: youth3, position: 3 },
    { type: "youth_theme", label: "Youth Theme", assignee_id: youth4, position: 4 },
    { type: "announcements", label: "Announcements", assignee_id: youth2, position: 5 },
    { type: "lesson", label: "Lesson: Becoming True Disciples", assignee_id: advisor2, position: 6, notes: "From the Come, Follow Me manual." },
    { type: "musical_number", label: "Closing Hymn", position: 7 },
  ].map((b) => ({ ...b, sunday_program_id: program.id }));

  const { error: blockErr } = await supabase.from("program_blocks").insert(blocks);
  if (blockErr) throw new Error(`Program blocks: ${blockErr.message}`);
  console.log(`  ✓ ${blocks.length} program blocks`);
}

async function main() {
  console.log("Seeding Coral Canyon 3rd Ward...\n");
  const users = await upsertUsers();
  const callings = await upsertCallings();
  await assignCallings(users, callings);
  const events = await upsertEvents();
  await seedLeaderRsvps(events, users);
  await seedAnnouncements(users);
  await seedSundayProgram(events, users);
  console.log("\nDone. Sign in at /login with advisor1@coralcanyon.local / CoralCanyon!23");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
