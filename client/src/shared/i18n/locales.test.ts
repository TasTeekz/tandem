import en from './locales/en.json'
import kk from './locales/kk.json'
import ru from './locales/ru.json'

const flatten = (o: object, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && v !== null ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`]))

const keys = { en: flatten(en).sort(), ru: flatten(ru).sort(), kk: flatten(kk).sort() }
const sources = import.meta.glob<string>('../../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true })

describe('locales', () => {
  it('ru has exactly the keys of en', () => expect(keys.ru).toEqual(keys.en))
  it('kk has exactly the keys of en', () => expect(keys.kk).toEqual(keys.en))
  it('has no empty strings', () => {
    for (const l of [en, ru, kk]) expect(JSON.stringify(l)).not.toContain('""')
  })

  it('every literal t("key") used in src exists', () => {
    const known = new Set(keys.en)
    const missing = Object.entries(sources)
      .filter(([path]) => !path.includes('/kit/') && !path.includes('.test.'))
      .flatMap(([, code]) => [...code.matchAll(/\bt\(\s*'([\w.]+)'/g)].map((m) => m[1]).filter((k): k is string => !!k && !known.has(k)))
    expect(missing).toEqual([])
  })
})
