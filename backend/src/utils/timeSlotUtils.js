/**
 * Utility functions for time slot conflict detection
 */

/**
 * Convert time string (HH:MM) to minutes since midnight
 * @param {string} timeStr - Time in format "HH:MM" or "HH:MM:SS"
 * @returns {number} Minutes since midnight
 */
function timeToMinutes(timeStr) {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * Check if a time slot represents a full day
 * Full day slots typically span from early morning (00:00) to late night (23:59)
 * @param {Object} slot - Time slot object with startTime and endTime
 * @returns {boolean}
 */
function isFullDaySlot(slot) {
  const startMinutes = timeToMinutes(slot.startTime);
  const endMinutes = timeToMinutes(slot.endTime);
  // Consider full day if it spans more than 20 hours (1200 minutes)
  // or starts at midnight and ends late
  return (endMinutes - startMinutes >= 1200) || 
         (startMinutes <= 60 && endMinutes >= 1380); // 00:00-01:00 to 23:00-23:59
}

/**
 * Check if two time slots overlap
 * @param {Object} slot1 - First time slot
 * @param {Object} slot2 - Second time slot
 * @returns {boolean} True if slots overlap
 */
function slotsOverlap(slot1, slot2) {
  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);

  // Handle full day slots
  if (isFullDaySlot(slot1) || isFullDaySlot(slot2)) {
    return true; // Full day overlaps with everything
  }

  // Check for overlap: slot1 starts before slot2 ends AND slot1 ends after slot2 starts
  return start1 < end2 && end1 > start2;
}

/**
 * Check if a slot conflicts with any booked slots
 * @param {Object} slot - The slot to check
 * @param {Array} bookedSlots - Array of booked slot objects with startTime and endTime
 * @returns {boolean} True if there's a conflict
 */
function hasConflict(slot, bookedSlots) {
  // If the slot itself is full day, it conflicts with any booked slot
  if (isFullDaySlot(slot)) {
    return bookedSlots.length > 0;
  }

  // Check if any booked slot conflicts with this slot
  return bookedSlots.some(bookedSlot => {
    // If booked slot is full day, it conflicts with everything
    if (isFullDaySlot(bookedSlot)) {
      return true;
    }
    // Otherwise check for overlap
    return slotsOverlap(slot, bookedSlot);
  });
}

/**
 * Find all conflicting slot IDs for a given slot
 * @param {Object} slot - The slot to check
 * @param {Array} allSlots - All available slots
 * @param {Array} bookedSlots - Array of booked slot objects with id, startTime, endTime
 * @returns {Array} Array of conflicting slot IDs
 */
function findConflictingSlotIds(slot, allSlots, bookedSlots) {
  const conflictingIds = [];

  // If this slot is full day, all other slots conflict
  if (isFullDaySlot(slot)) {
    return allSlots.filter(s => s.id !== slot.id).map(s => s.id);
  }

  // Check each booked slot
  bookedSlots.forEach(bookedSlot => {
    // If booked slot is full day, this slot conflicts
    if (isFullDaySlot(bookedSlot)) {
      conflictingIds.push(slot.id);
      return;
    }

    // Check all slots that overlap with booked slot
    allSlots.forEach(otherSlot => {
      if (otherSlot.id === slot.id && slotsOverlap(slot, bookedSlot)) {
        conflictingIds.push(slot.id);
      } else if (otherSlot.id !== slot.id && slotsOverlap(otherSlot, bookedSlot)) {
        // If another slot overlaps with booked slot, it conflicts with our slot
        if (slotsOverlap(slot, otherSlot)) {
          conflictingIds.push(otherSlot.id);
        }
      }
    });
  });

  return [...new Set(conflictingIds)]; // Remove duplicates
}

/**
 * Get all conflicting slot IDs for a given date and utility
 * @param {Object} slot - The slot to check
 * @param {Array} allSlots - All available slots for the utility
 * @param {Array} existingBookings - Existing bookings for the date/utility with timeSlotId
 * @param {Object} slotMap - Map of slotId to slot object
 * @returns {Array} Array of conflicting slot IDs
 */
function getConflictingSlotIds(slot, allSlots, existingBookings, slotMap) {
  const conflictingIds = [];

  // Get booked slots for this date
  const bookedSlotIds = existingBookings
    .filter(b => b.status !== 'rejected' && b.status !== 'cancelled')
    .map(b => b.timeSlotId);

  // Convert booked slot IDs to slot objects
  const bookedSlots = bookedSlotIds
    .map(id => slotMap[id])
    .filter(Boolean);

  // If this slot is full day, all booked slots conflict
  if (isFullDaySlot(slot)) {
    return bookedSlotIds;
  }

  // Check each booked slot
  bookedSlots.forEach(bookedSlot => {
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

  // Also check: if this slot is booked, which other slots would conflict?
  // This is for the frontend to disable slots
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

export {
  timeToMinutes,
  isFullDaySlot,
  slotsOverlap,
  hasConflict,
  findConflictingSlotIds,
  getConflictingSlotIds
};

