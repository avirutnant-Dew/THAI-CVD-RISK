export const normalizePhone = (phone: string) => phone.replace(/[\s-]/g, '')
export const isValidThaiMobile = (phone: string) => /^0\d{9}$/.test(normalizePhone(phone))
export const isValidEmail = (email: string) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
export const isInRange = (value: string, min: number, max: number) => value !== '' && Number(value) >= min && Number(value) <= max
export const sanitizeText = (value: string) => value.replace(/[<>]/g, '').trim().slice(0, 500)
