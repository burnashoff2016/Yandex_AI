import { useState, useCallback, useEffect } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { ResultCard } from '@/components/ResultCard'
import { generateApi } from '@/services/api'
import { Channel, CHANNELS, CHANNEL_INFO, Goal, Tone, PostFormat, GOALS, TONES, FORMATS, ChannelResult, GenerateRequest } from '@/types'

const STORAGE_KEY = 'generator_state'

interface GeneratorState {
  description: string
  channels: Channel[]
  numVariants: number
  goal: Goal
  tone: Tone
  format: PostFormat
  audience: string
  offer: string
  results: Record<string, ChannelResult[]> | null
}

export function GeneratorPage() {
  const [description, setDescription] = useState('')
  const [channels, setChannels] = useState<Channel[]>([])
  const [numVariants, setNumVariants] = useState(1)
  const [goal, setGoal] = useState<Goal>('продажа')
  const [tone, setTone] = useState<Tone>('дружелюбный')
  const [format, setFormat] = useState<PostFormat>('short')
  const [audience, setAudience] = useState('')
  const [offer, setOffer] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<string, ChannelResult[]> | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const state: GeneratorState = JSON.parse(saved)
        setDescription(state.description || '')
        setChannels(state.channels || [])
        setNumVariants(state.numVariants || 1)
        setGoal(state.goal || 'продажа')
        setTone(state.tone || 'дружелюбный')
        setFormat(state.format || 'short')
        setAudience(state.audience || '')
        setOffer(state.offer || '')
        setResults(state.results || null)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const state: GeneratorState = { description, channels, numVariants, goal, tone, format, audience, offer, results }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [description, channels, numVariants, goal, tone, format, audience, offer, results])

  const toggleChannel = (c: Channel) => {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  const onGenerate = async () => {
    setError(null)
    if (!description.trim()) {
      setError('Введите описание')
      return
    }
    if (channels.length === 0) {
      setError('Выберите канал')
      return
    }

    await generateNormal()
  }

  const generateNormal = async () => {
    setLoading(true)
    setResults(null)
    try {
      const request: GenerateRequest = {
        description,
        channels,
        num_variants: numVariants,
        goal,
        tone,
        audience: audience || undefined,
        offer: offer || undefined,
        format,
      }
      const resp = await generateApi.generate(request)
      setResults(resp.results)
    } catch {
      setError('Ошибка генерации')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (id: string) => {
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleResultUpdate = useCallback((channel: Channel, newResult: ChannelResult) => {
    setResults((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [channel]: prev[channel].map((r, i) => (i === 0 ? newResult : r)),
      }
    })
  }, [])

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] flex">
        <div className="w-96 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Параметры</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Описание</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={2}
                placeholder="Продукт, акция, новость..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div data-tour="goal">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Цель</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as Goal)}
                  className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {GOALS.map((g) => (
                    <option key={g.value} value={g.value}>{g.icon} {g.label}</option>
                  ))}
                </select>
              </div>

              <div data-tour="tone">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Тон</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div data-tour="channels">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Каналы</label>
              <div className="grid grid-cols-2 gap-1">
                {CHANNELS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleChannel(c)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-all ${
                      channels.includes(c)
                        ? `border-transparent bg-gradient-to-r ${CHANNEL_INFO[c].gradient} text-white`
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>{CHANNEL_INFO[c].icon}</span>
                    <span className="font-medium">{c}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Вариантов</label>
                <div className="flex gap-1">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => setNumVariants(n)}
                      className={`flex-1 py-1 rounded-lg text-sm font-medium transition-all ${
                        numVariants === n
                          ? 'bg-[#fc3f1d] text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Формат</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as PostFormat)}
                  className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>{f.icon} {f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">ЦА</label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="25-40 лет"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Оффер</label>
                <input
                  type="text"
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="-20%"
                />
              </div>
            </div>

            {error && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-xs">
                {error}
              </div>
            )}

            <button
              data-tour="generate-btn"
              onClick={onGenerate}
              disabled={loading || !description.trim() || channels.length === 0}
              className="w-full py-2 bg-gradient-to-r from-[#fc3f1d] to-[#ff6b4a] text-white rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-red-200 dark:hover:shadow-red-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Генерация...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Сгенерировать
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900" data-tour="results">
          {!results && !loading && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center max-w-md mx-auto mt-20">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#fc3f1d]/10 to-[#ff6b4a]/10 dark:from-[#fc3f1d]/20 dark:to-[#ff6b4a]/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-[#fc3f1d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Готовы к генерации</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Заполните параметры слева</p>
            </div>
          )}

          {loading && !results && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center max-w-md mx-auto mt-20">
              <div className="relative w-16 h-16 mx-auto mb-3">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#fc3f1d] to-[#ff6b4a] animate-pulse" />
                <div className="absolute inset-2 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#fc3f1d] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Генерируем контент...</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI создаёт тексты</p>
            </div>
          )}

          {results && (
            <div className="max-w-4xl mx-auto space-y-6">
              {channels.map((channel) => 
                results[channel] ? (
                  <div key={channel} className="space-y-4">
                    {results[channel].map((result, idx) => (
                      <ResultCard
                        key={`${channel}-${idx}`}
                        channel={channel}
                        result={result}
                        variantIndex={numVariants > 1 ? idx : -1}
                        onCopy={() => handleCopy(`${channel}-${idx}`)}
                        copied={copied === `${channel}-${idx}`}
                        onResultUpdate={handleResultUpdate}
                      />
                    ))}
                  </div>
                ) : loading ? (
                  <div key={channel} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-1/3" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                      </div>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
