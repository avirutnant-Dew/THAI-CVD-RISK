import { describe, expect, it } from 'vitest'
import { getCompletedAge } from '../src/utils/age'
import { isValidThaiMobile, normalizePhone } from '../src/utils/validation'

describe('profile validation', () => {
  it('calculates completed years', () => expect(getCompletedAge('2000-08-22', new Date('2026-08-21T12:00:00+07:00'))).toBe(25))
  it('normalizes Thai phone numbers', () => { expect(normalizePhone('081-234 5678')).toBe('0812345678'); expect(isValidThaiMobile('081-234 5678')).toBe(true) })
})
