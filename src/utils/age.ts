export function getCompletedAge(dob: string, now = new Date()): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return Number.NaN
  const [year, month, day] = dob.split('-').map(Number)
  const birth = new Date(Date.UTC(year, month - 1, day))
  if (birth.getUTCFullYear() !== year || birth.getUTCMonth() !== month - 1 || birth.getUTCDate() !== day) return Number.NaN
  let age = now.getFullYear() - year
  if ((now.getMonth() + 1) < month || ((now.getMonth() + 1) === month && now.getDate() < day)) age -= 1
  return age
}
