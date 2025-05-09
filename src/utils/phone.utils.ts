/**
 * Normalizes a phone number to E.164 format.
 * Primarily handles common Israeli formats (05x -> +9725x).
 * @param phone The phone number string to normalize.
 * @returns The normalized phone number string (E.164 format) or the cleaned input if normalization rules don't apply.
 */
export const normalizePhoneNumber = (phone: string): string => {
  // Remove any non-digit characters except for the leading +
  let cleaned = phone.replace(/[^+\d]/g, '');

  // If it starts with 0 and has 10 digits (local Israeli mobile format)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+972${cleaned.substring(1)}`; // Replace leading 0 with +972
  }

  // If it doesn't start with +, add it (assuming it might be international without the +)
  if (!cleaned.startsWith('+')) {
    // Basic check: If it looks like an Israeli number without +972, add it.
    if (cleaned.length === 9 || cleaned.length === 10) {
      if (cleaned.length === 9 && !cleaned.startsWith('0')) {
        return `+972${cleaned}`; // Handle 5xxxxxxxx format
      }
      // The case (cleaned.startsWith('0') && cleaned.length === 10) is handled above
    } else {
      // If not an obvious Israeli length, just prepend + as a best guess for international
      // More robust international handling might be needed depending on requirements
      return `+${cleaned}`;
    }
  }

  // Return the cleaned/potentially partially normalized number if no specific rules applied
  return cleaned;
};
