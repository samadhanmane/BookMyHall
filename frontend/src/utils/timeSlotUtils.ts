import { TimeSlot, Utility } from '@/types/utility';

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * Check if a time slot represents a full day
 * Full day slots typically span from early morning (00:00) to late night (23:59)
 * 
 * A slot is considered "full day" if:
 * - It spans 20 hours or more (1200 minutes), OR
 * - It starts at or before 1:00 AM (60 minutes) and ends at or after 11:00 PM (1380 minutes)
 * 
 * This works dynamically for any slot configuration, not hardcoded
 */
export function isFullDaySlot(slot: TimeSlot): boolean {
  const startMinutes = timeToMinutes(slot.startTime);
  const endMinutes = timeToMinutes(slot.endTime);
  
  // Calculate duration (handle wrap-around for slots that span midnight)
  let duration = endMinutes - startMinutes;
  if (duration < 0) {
    duration += 24 * 60; // Add 24 hours in minutes for wrap-around
  }
  
  // Consider full day if:
  // 1. Duration is 20 hours or more (1200 minutes), OR
  // 2. Starts early (before 1:00 AM) and ends late (after 11:00 PM)
  return duration >= 1200 || (startMinutes <= 60 && endMinutes >= 1380);
}

/**
 * Check if two time slots overlap
 * 
 * Core Principle: If two slots overlap (even partially), they cannot both be available.
 * 
 * Overlap Detection Formula (exact specification):
 * Two slots A and B overlap if: A.start < B.end AND B.start < A.end
 * 
 * This formula works for any time ranges dynamically - not hardcoded.
 * 
 * Examples:
 * - 10:00 AM - 1:00 PM and 2:00 PM - 5:00 PM: No overlap (10:00 < 17:00 ✓, 14:00 < 13:00 ✗) → No overlap ✓
 * - 10:00 AM - 2:00 PM and 1:00 PM - 3:00 PM: Overlap (10:00 < 15:00 ✓, 13:00 < 14:00 ✓) → Overlap ✓
 * - 10:00 AM - 1:00 PM and 1:00 PM - 2:00 PM: No overlap (10:00 < 14:00 ✓, 13:00 < 13:00 ✗) → Contiguous, not overlapping ✓
 * 
 * Full day slots overlap with everything.
 */
export function slotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);

  // Handle full day slots - they overlap with everything
  if (isFullDaySlot(slot1) || isFullDaySlot(slot2)) {
    return true;
  }

  // Exact overlap formula: A.start < B.end AND B.start < A.end
  // This detects any overlap, even partial (e.g., 1 minute overlap)
  return start1 < end2 && start2 < end1;
}

/**
 * Check if a slot conflicts with any booked slots
 */
export function hasSlotConflict(
  slot: TimeSlot,
  allSlots: TimeSlot[],
  bookedSlotIds: string[]
): boolean {
  if (bookedSlotIds.length === 0) return false;

  // Create a map of slotId to slot object
  const slotMap: Record<string, TimeSlot> = {};
  allSlots.forEach(s => {
    slotMap[s.id] = s;
  });

  // If this slot is full day, it conflicts with any booked slot
  if (isFullDaySlot(slot)) {
    return bookedSlotIds.length > 0;
  }

  // Check if any booked slot conflicts with this slot
  return bookedSlotIds.some(bookedSlotId => {
    const bookedSlot = slotMap[bookedSlotId];
    if (!bookedSlot) return false;

    // If booked slot is full day, it conflicts with everything
    if (isFullDaySlot(bookedSlot)) {
      return true;
    }
    // Otherwise check for overlap
    return slotsOverlap(slot, bookedSlot);
  });
}

/**
 * Get all conflicting slot IDs for a given slot
 */
export function getConflictingSlotIds(
  slot: TimeSlot,
  allSlots: TimeSlot[],
  bookedSlotIds: string[]
): string[] {
  const conflictingIds: string[] = [];
  const slotMap: Record<string, TimeSlot> = {};
  allSlots.forEach(s => {
    slotMap[s.id] = s;
  });

  // If this slot is full day, all booked slots conflict
  if (isFullDaySlot(slot)) {
    return bookedSlotIds;
  }

  // Check each booked slot
  bookedSlotIds.forEach(bookedSlotId => {
    const bookedSlot = slotMap[bookedSlotId];
    if (!bookedSlot) return;

    // If booked slot is full day, this slot conflicts
    if (isFullDaySlot(bookedSlot)) {
      conflictingIds.push(slot.id);
      return;
    }

    // Check if this slot overlaps with booked slot
    if (slotsOverlap(slot, bookedSlot)) {
      conflictingIds.push(slot.id);
    }
  });

  // Also check: if this slot would be booked, which other slots would conflict?
  // This helps disable slots that would conflict
  if (bookedSlotIds.includes(slot.id)) {
    // This slot is already booked, find all slots that would conflict
    allSlots.forEach(otherSlot => {
      if (otherSlot.id !== slot.id && slotsOverlap(slot, otherSlot)) {
        conflictingIds.push(otherSlot.id);
      }
    });
  }

  return [...new Set(conflictingIds)]; // Remove duplicates
}

/**
 * Check if a date falls within any disabled date range
 */
export function isDateInDisabledRange(date: Date, disabledDateRanges?: Array<{ startDate: string; endDate: string }>): boolean {
  if (!disabledDateRanges || disabledDateRanges.length === 0) return false;

  const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD

  return disabledDateRanges.some(range => {
    const startDate = new Date(range.startDate);
    const endDate = new Date(range.endDate);
    const checkDate = new Date(dateStr);

    // Set time to midnight for accurate comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate >= startDate && checkDate <= endDate;
  });
}

/**
 * Check if a date falls on a disabled day of week
 */
export function isDateDisabledDayOfWeek(date: Date, disabledDaysOfWeek?: number[]): boolean {
  if (!disabledDaysOfWeek || disabledDaysOfWeek.length === 0) return false;

  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return disabledDaysOfWeek.includes(dayOfWeek);
}

/**
 * Check if a utility is disabled for a specific date
 * Returns true if the utility should not be available for booking on this date
 */
export function isUtilityDisabledForDate(utility: Utility, date: Date): boolean {
  // Check if date falls in any disabled date range
  if (isDateInDisabledRange(date, utility.disabledDateRanges)) {
    return true;
  }

  // Check if date falls on a disabled day of week
  if (isDateDisabledDayOfWeek(date, utility.disabledDaysOfWeek)) {
    return true;
  }

  return false;
}

