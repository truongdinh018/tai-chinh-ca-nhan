import { Button, Title } from 'animal-island-ui'
import { useEffect, useMemo, useState } from 'react'
import { api, formatVnd, type Transaction } from '../api/client'
import { useI18n } from '../i18n/I18nContext'

function ymOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

type DayCell = { date: string; day: number; inSum: number; outSum: number; count: number }

export function CalendarPage() {
  const { t, locale } = useI18n()
  const [items, setItems] = useState<Transaction[]>([])
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void api
      .listTransactions()
      .then(setItems)
      .catch((e) => setError(String(e)))
  }, [])

  const ym = ymOf(cursor)
  const monthTx = useMemo(() => items.filter((tx) => tx.date.startsWith(ym)), [items, ym])

  const byDay = useMemo(() => {
    const m = new Map<string, DayCell>()
    for (const tx of monthTx) {
      const day = Number(tx.date.slice(8, 10))
      const cell = m.get(tx.date) ?? { date: tx.date, day, inSum: 0, outSum: 0, count: 0 }
      if (tx.direction === 'in') cell.inSum += tx.amount_vnd
      else if (tx.direction === 'out') cell.outSum += tx.amount_vnd
      cell.count += 1
      m.set(tx.date, cell)
    }
    return m
  }, [monthTx])

  const grid = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    // Monday-first offset.
    const lead = (first.getDay() + 6) % 7
    const cells: Array<DayCell | null> = []
    for (let i = 0; i < lead; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${ym}-${String(d).padStart(2, '0')}`
      cells.push(byDay.get(date) ?? { date, day: d, inSum: 0, outSum: 0, count: 0 })
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [cursor, ym, byDay])

  const monthLabel = cursor.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'long',
    year: 'numeric',
  })
  const weekdays =
    locale === 'vi'
      ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const totals = monthTx.reduce(
    (acc, tx) => {
      if (tx.direction === 'in') acc.in += tx.amount_vnd
      else if (tx.direction === 'out') acc.out += tx.amount_vnd
      return acc
    },
    { in: 0, out: 0 },
  )

  const selectedTx = selected ? monthTx.filter((tx) => tx.date === selected) : []

  function shift(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
    setSelected(null)
  }

  return (
    <div className="page">
      <div className="page-toolbar">
        <Title size="middle">{t('tab.calendar')}</Title>
        <div className="cal-nav">
          <button type="button" className="pager-btn" onClick={() => shift(-1)}>
            ‹
          </button>
          <span className="cal-month">{monthLabel}</span>
          <button type="button" className="pager-btn" onClick={() => shift(1)}>
            ›
          </button>
          <Button size="small" onClick={() => setCursor(new Date())}>
            {t('cal.today')}
          </Button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <p className="muted">
        {t('cal.summary', { in: formatVnd(totals.in), out: formatVnd(totals.out) })}
      </p>

      <div className="calendar">
        <div className="calendar-head">
          {weekdays.map((w) => (
            <span key={w} className="calendar-weekday">
              {w}
            </span>
          ))}
        </div>
        <div className="calendar-grid">
          {grid.map((cell, i) =>
            cell ? (
              <button
                key={cell.date}
                type="button"
                className={`calendar-cell${cell.count ? ' has-tx' : ''}${
                  selected === cell.date ? ' is-selected' : ''
                }`}
                onClick={() => setSelected(selected === cell.date ? null : cell.date)}
              >
                <span className="calendar-day">{cell.day}</span>
                {cell.inSum > 0 ? (
                  <span className="calendar-in">+{formatVnd(cell.inSum)}</span>
                ) : null}
                {cell.outSum > 0 ? (
                  <span className="calendar-out">-{formatVnd(cell.outSum)}</span>
                ) : null}
              </button>
            ) : (
              <span key={`e${i}`} className="calendar-cell is-empty" />
            ),
          )}
        </div>
      </div>

      {selected ? (
        <div className="cal-day-detail">
          <Title size="small">{selected}</Title>
          {selectedTx.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('tx.dir')}</th>
                    <th>{t('tx.amount')}</th>
                    <th>{t('tx.category')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTx.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        {tx.direction === 'in'
                          ? t('tx.in')
                          : tx.direction === 'out'
                            ? t('tx.out')
                            : t('tx.transfer')}
                      </td>
                      <td>{formatVnd(tx.amount_vnd)}</td>
                      <td>{tx.category || tx.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">{t('cal.noTx')}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
