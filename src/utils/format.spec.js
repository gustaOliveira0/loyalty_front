import { describe, it, expect } from 'vitest'
import { onlyDigits, formatCPF, formatPhone } from './format.js'

describe('onlyDigits', () => {
  it('removes every non-digit character', () => {
    expect(onlyDigits('123.456.789-00')).toBe('12345678900')
    expect(onlyDigits('(11) 99999-8888')).toBe('11999998888')
  })

  it('handles null/undefined safely', () => {
    expect(onlyDigits(null)).toBe('')
    expect(onlyDigits(undefined)).toBe('')
  })
})

describe('formatCPF', () => {
  it('masks a full CPF as 000.000.000-00', () => {
    expect(formatCPF('12345678900')).toBe('123.456.789-00')
  })

  it('masks progressively while typing', () => {
    expect(formatCPF('123')).toBe('123')
    expect(formatCPF('1234')).toBe('123.4')
    expect(formatCPF('1234567')).toBe('123.456.7')
  })

  it('ignores non-digits in the input', () => {
    expect(formatCPF('abc123!!456')).toBe('123.456')
  })

  it('never exceeds 14 characters', () => {
    expect(formatCPF('123456789001234').length).toBeLessThanOrEqual(14)
  })
})

describe('formatPhone', () => {
  it('masks a mobile number as (11) 99999-9999', () => {
    expect(formatPhone('11999998888')).toBe('(11) 99999-8888')
  })

  it('masks progressively while typing', () => {
    expect(formatPhone('11')).toBe('11')
    expect(formatPhone('119')).toBe('(11) 9')
    expect(formatPhone('1199999')).toBe('(11) 99999')
  })

  it('never exceeds 15 characters', () => {
    expect(formatPhone('11999998888777').length).toBeLessThanOrEqual(15)
  })
})
