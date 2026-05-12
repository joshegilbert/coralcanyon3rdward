import {
  addDays,
  getDate,
  getDay,
  isSameDay,
  startOfDay,
} from "date-fns";
import type { EventType } from "@/lib/types";

/**
 * 1st/3rd Sundays of the month = Sunday School (no quorum meeting).
 * 2nd/4th/5th Sundays of the month = Quorum Meeting.
 */
export function classifySunday(
  date: Date,
): Extract<EventType, "sunday_school" | "quorum_meeting"> {
  const ordinal = Math.ceil(getDate(date) / 7);
  return ordinal === 1 || ordinal === 3 ? "sunday_school" : "quorum_meeting";
}

export function isSunday(date: Date) {
  return getDay(date) === 0;
}

export function nextSunday(from: Date = new Date()) {
  const start = startOfDay(from);
  if (isSunday(start)) return start;
  const daysUntilSunday = (7 - getDay(start)) % 7 || 7;
  return addDays(start, daysUntilSunday);
}

export function upcomingSundays(count: number, from: Date = new Date()) {
  const sundays: Date[] = [];
  let cursor = nextSunday(from);
  for (let i = 0; i < count; i++) {
    sundays.push(cursor);
    cursor = addDays(cursor, 7);
  }
  return sundays;
}

export function sundayMatches(a: Date, b: Date) {
  return isSameDay(startOfDay(a), startOfDay(b));
}
