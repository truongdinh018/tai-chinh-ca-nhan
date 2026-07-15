import { Card, Tag, Title } from 'animal-island-ui'
import { useEffect, useMemo, useState } from 'react'
import { api, formatVnd, type Summary } from '../api/client'
import { Hint } from '../components/Hint'
import { useI18n } from '../i18n/I18nContext'
import { TOOL_META, type ToolCategoryKey } from '../tools/meta'

type Props = {
  onOpenTool?: (toolId: string) => void
}

export function Dashboard({ onOpenTool }: Props) {
  const { t } = useI18n()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<ToolCategoryKey | 'all'>('all')

  async function load() {
    setError('')
    try {
      setSummary(await api.summary())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const categories = useMemo(() => {
    const keys = [...new Set(TOOL_META.map((m) => m.categoryKey))]
    return keys
  }, [])

  const cards = useMemo(() => {
    if (filter === 'all') return TOOL_META
    return TOOL_META.filter((m) => m.categoryKey === filter)
  }, [filter])

  return (
    <div className="page">
      <Title size="middle">{t('dash.title')}</Title>
      {error && <p className="error">{error}</p>}
      <div className="stat-grid">
        <Card color="app-teal" pattern="app-teal">
          <div className="stat-head">
            <Tag color="app-teal">{t('dash.netWorth')}</Tag>
            <Hint title={t('tip.dash.netWorth')} />
          </div>
          <p className="stat-value">{formatVnd(summary?.net_worth_vnd ?? 0)}</p>
        </Card>
        <Card color="app-green" pattern="app-green">
          <div className="stat-head">
            <Tag color="app-green">{t('dash.assets')}</Tag>
            <Hint title={t('tip.dash.assets')} />
          </div>
          <p className="stat-value">{formatVnd(summary?.assets_total_vnd ?? 0)}</p>
          <p className="muted">{t('dash.items', { n: summary?.asset_count ?? 0 })}</p>
        </Card>
        <Card color="app-orange" pattern="app-orange">
          <div className="stat-head">
            <Tag color="app-orange">{t('dash.debts')}</Tag>
            <Hint title={t('tip.dash.debts')} />
          </div>
          <p className="stat-value">{formatVnd(summary?.debts_total_vnd ?? 0)}</p>
          <p className="muted">{t('dash.debtItems', { n: summary?.debt_count ?? 0 })}</p>
        </Card>
        <Card color="app-blue" pattern="app-blue">
          <div className="stat-head">
            <Tag color="app-blue">{t('dash.activity')}</Tag>
            <Hint title={t('tip.dash.activity')} />
          </div>
          <p className="muted">
            {t('dash.activityLine', {
              tx: summary?.transaction_count ?? 0,
              salary: summary?.salary_count ?? 0,
            })}
          </p>
        </Card>
      </div>

      <section className="tool-picker">
        <h2 className="tools-heading">
          <span className="tools-heading-icon" aria-hidden>
            🧮
          </span>
          <span>{t('dash.toolsTitle')}</span>
        </h2>
        <p className="muted">{t('dash.toolsLead')}</p>
        <div className="tool-filter-row" role="tablist" aria-label={t('dash.toolsTitle')}>
          <button
            type="button"
            className={`tool-filter${filter === 'all' ? ' is-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('dash.allCategories')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`tool-filter${filter === cat ? ' is-active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {t(cat)}
            </button>
          ))}
        </div>
        <div className="tool-card-grid">
          {cards.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={`tool-card accent-${tool.accent}`}
              onClick={() => onOpenTool?.(tool.id)}
            >
              <span className="tool-card-icon" aria-hidden>
                {tool.icon}
              </span>
              <span className="tool-card-body">
                <span className="tool-card-name">{t(`tool.${tool.id}`)}</span>
                <span className="tool-card-cat">{t(tool.categoryKey)}</span>
              </span>
              <span
                className="tool-card-tip"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Hint title={t(`tip.tool.${tool.id}`)} />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
