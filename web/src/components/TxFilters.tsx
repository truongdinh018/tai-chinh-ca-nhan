import type { Account, Category, Transaction } from '../api/client'

export type TxFilterState = {
  text: string
  category: string
  accountId: number | 'all'
  direction: 'all' | 'in' | 'out' | 'transfer'
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
}

export const EMPTY_TX_FILTER: TxFilterState = {
  text: '',
  category: 'all',
  accountId: 'all',
  direction: 'all',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
}

export function isFilterActive(f: TxFilterState): boolean {
  return (
    f.text.trim() !== '' ||
    f.category !== 'all' ||
    f.accountId !== 'all' ||
    f.direction !== 'all' ||
    f.dateFrom !== '' ||
    f.dateTo !== '' ||
    f.amountMin !== '' ||
    f.amountMax !== ''
  )
}

export function applyTxFilters(rows: Transaction[], f: TxFilterState): Transaction[] {
  const text = f.text.trim().toLowerCase()
  const min = f.amountMin === '' ? null : Number(f.amountMin)
  const max = f.amountMax === '' ? null : Number(f.amountMax)
  return rows.filter((t) => {
    if (f.direction !== 'all' && t.direction !== f.direction) return false
    if (f.category !== 'all' && t.category !== f.category) return false
    if (f.accountId !== 'all' && t.account_id !== f.accountId && t.to_account_id !== f.accountId)
      return false
    if (f.dateFrom && t.date < f.dateFrom) return false
    if (f.dateTo && t.date > f.dateTo) return false
    if (min != null && t.amount_vnd < min) return false
    if (max != null && t.amount_vnd > max) return false
    if (text) {
      const hay = `${t.note} ${t.category}`.toLowerCase()
      if (!hay.includes(text)) return false
    }
    return true
  })
}

type Labels = {
  search: string
  all: string
  category: string
  account: string
  direction: string
  in: string
  out: string
  transfer: string
  from: string
  to: string
  amountMin: string
  amountMax: string
  clear: string
}

type Props = {
  filter: TxFilterState
  onChange: (next: TxFilterState) => void
  accounts: Account[]
  categories: Category[]
  labels: Labels
}

export function TxFilters({ filter, onChange, accounts, categories, labels }: Props) {
  const set = (patch: Partial<TxFilterState>) => onChange({ ...filter, ...patch })
  const catNames = [...new Set(categories.map((c) => c.name))]

  return (
    <div className="tx-filters">
      <label className="tx-filter-search">
        {labels.search}
        <input
          value={filter.text}
          onChange={(e) => set({ text: e.target.value })}
          placeholder={labels.search}
        />
      </label>
      <label>
        {labels.direction}
        <select
          value={filter.direction}
          onChange={(e) => set({ direction: e.target.value as TxFilterState['direction'] })}
        >
          <option value="all">{labels.all}</option>
          <option value="in">{labels.in}</option>
          <option value="out">{labels.out}</option>
          <option value="transfer">{labels.transfer}</option>
        </select>
      </label>
      <label>
        {labels.category}
        <select value={filter.category} onChange={(e) => set({ category: e.target.value })}>
          <option value="all">{labels.all}</option>
          {catNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {labels.account}
        <select
          value={String(filter.accountId)}
          onChange={(e) =>
            set({ accountId: e.target.value === 'all' ? 'all' : Number(e.target.value) })
          }
        >
          <option value="all">{labels.all}</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {labels.from}
        <input type="date" value={filter.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} />
      </label>
      <label>
        {labels.to}
        <input type="date" value={filter.dateTo} onChange={(e) => set({ dateTo: e.target.value })} />
      </label>
      <label>
        {labels.amountMin}
        <input
          type="number"
          value={filter.amountMin}
          onChange={(e) => set({ amountMin: e.target.value })}
        />
      </label>
      <label>
        {labels.amountMax}
        <input
          type="number"
          value={filter.amountMax}
          onChange={(e) => set({ amountMax: e.target.value })}
        />
      </label>
      {isFilterActive(filter) ? (
        <button type="button" className="pager-btn tx-filter-clear" onClick={() => onChange(EMPTY_TX_FILTER)}>
          {labels.clear}
        </button>
      ) : null}
    </div>
  )
}
