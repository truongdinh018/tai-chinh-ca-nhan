/** Built-in sample finance JSON (assets / txs / salary / debts). */
import sample from './finance-sample.json'

export type ImportJsonBundle = {
  assets?: Array<Record<string, unknown>>
  transactions?: Array<Record<string, unknown>>
  salary?: Array<Record<string, unknown>>
  debts?: Array<Record<string, unknown>>
}

export const FINANCE_SAMPLE_JSON = sample as ImportJsonBundle

export function financeSampleText(pretty = true): string {
  return JSON.stringify(FINANCE_SAMPLE_JSON, null, pretty ? 2 : 0)
}
