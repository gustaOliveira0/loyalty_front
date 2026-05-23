// Pure formatting/masking helpers — no DOM, no side effects, easy to unit test.

/** Strips everything that is not a digit. */
export function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

/** Masks a CPF progressively: 000.000.000-00 (max 14 chars). */
export function formatCPF(value) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .substring(0, 14)
}

/** Masks a BR phone progressively: (11) 99999-9999 (max 15 chars). */
export function formatPhone(value) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 15)
}
