export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
}

export function validatePassword(value: string) {
  return value.length >= 8;
}

const invalidHabitPatterns = [
  /porn/i,
  /pornografia/i,
  /drog/i,
  /cocaina/i,
  /crack/i,
  /heroina/i,
  /auto(?:-| )?destru/i,
  /suic/i,
  /machucar/i,
  /viol[eê]ncia/i,
  /crime/i,
  /apost/i,
  /beber todos os dias/i,
  /alcool/i,
  /dormir o dia todo/i,
  /ficar o dia todo/i,
  /roubar/i,
  /enganar/i
];

export function parseHabitList(value: unknown) {
  const source = Array.isArray(value) ? value.join("\n") : String(value || "");
  return source
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function validatePersonalDevelopmentHabits(habits: string[]) {
  return habits.every((habit) => habit.length >= 3 && habit.length <= 80 && !invalidHabitPatterns.some((pattern) => pattern.test(habit)));
}
