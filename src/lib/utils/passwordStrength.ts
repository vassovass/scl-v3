/** Password strength scoring (NIST-aligned: no forced complexity, length-based with variety bonus) */
export function getPasswordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  if (pw.length < 8) return { score: 0, label: "Too short", color: "hsl(var(--destructive))" };

  let score: 0 | 1 | 2 | 3 | 4 = 1;
  const hasMixedCase = /[A-Z]/.test(pw) && /[a-z]/.test(pw);
  const hasNumbersOrSymbols = /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw);

  if (pw.length >= 12 || hasMixedCase) score = 2;
  if (pw.length >= 12 && hasMixedCase) score = 3;
  if (pw.length >= 12 && hasMixedCase && hasNumbersOrSymbols) score = 4;

  const levels: Record<number, { label: string; color: string }> = {
    1: { label: "Weak", color: "hsl(var(--warning))" },
    2: { label: "Fair", color: "hsl(var(--warning))" },
    3: { label: "Good", color: "hsl(var(--success))" },
    4: { label: "Strong", color: "hsl(var(--success))" },
  };

  return { score, ...levels[score] };
}
