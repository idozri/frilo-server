const getRemainingTime = (date: Date) => {
  const remaining = Math.ceil((date.getTime() - Date.now()) / 60000);

  if (remaining <= 0) return '0';

  return remaining;
};

export default getRemainingTime;
