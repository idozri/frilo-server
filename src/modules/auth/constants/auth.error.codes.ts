// ERROR CODES FOR OTP 1000 - 1099
export const OTP_ERROR_CODES = {
  OTP_EXPIRED: 1000,
  OTP_INVALID: 1001,
  OTP_BLOCKED: 1002,
  OTP_SENT: 1003,
  OTP_VERIFIED: 1004,
};

export const OTP_ERROR_MESSAGES = {
  OTP_EXPIRED: 'קוד אימות פג תוקף',
  OTP_INVALID: 'קוד אימות שגוי',
  OTP_BLOCKED: 'יותר מ-5 ניסיונות שגויים. נסו שוב בעוד',
  OTP_SENT: 'קוד אימות נשלח',
  OTP_VERIFIED: 'קוד אימות נכון',
};
