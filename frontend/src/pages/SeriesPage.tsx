import { useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { ResultCard } from '@/components/ResultCard'
import { seriesApi } from '@/services/api'
import { CHANNELS, CHANNEL_INFO, Goal, Tone, GOALS, TONES, Channel, ChannelResult } from '@/types'

export function SeriesPage() {
  const [topic, setTopic] = useState('')
  const [channel, setChannel] = useState<Channel>('Telegram')
  const [count, setCount] = useState(3)
  const [goal, setGoal] = useState<Goal>('продажа')
  const [tone, setTone] = useState<Tone>('дружелюбный')
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<ChannelResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const onGenerate = async () => {
    setError(null)
    if (!topic.trim()) {
      setError('Введите тему')
      return
    }

    setLoading(true)
    setPosts(null)
    try {
      const response = await seriesApi.generate({
        topic,
        channel,
        count,
        goal,
        tone,
      })
      setPosts(response.posts)
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

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Серия постов</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Генерация цепочки постов по одной теме</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Параметры</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Тема серии</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Например: преимущества нашего продукта для молодых родителей..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Канал</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as Channel)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {CHANNELS.filter(c => c !== 'Директ' && c !== 'Email').map((c) => (
                    <option key={c} value={c}>{CHANNEL_INFO[c].icon} {c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Количество постов</label>
                <div className="flex gap-2">
                  {[2, 3, 5, 7].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                        count === n
                          ? 'bg-[#fc3f1d] text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Цель</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as Goal)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {GOALS.map((g) => (
                      <option key={g.value} value={g.value}>{g.icon} {g.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Тон</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as Tone)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {TONES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={onGenerate}
                disabled={loading || !topic.trim()}
                className="w-full py-3 bg-gradient-to-r from-[#fc3f1d] to-[#ff6b4a] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-red-200 dark:hover:shadow-red-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Генерация...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Сгенерировать серию
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            {!posts && !loading && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#fc3f1d]/10 to-[#ff6b4a]/10 dark:from-[#fc3f1d]/20 dark:to-[#ff6b4a]/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-[#fc3f1d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Готовы к генерации</h3>
                <p className="text-gray-500 dark:text-gray-400">Укажите тему и параметры серии</p>
              </div>
            )}

            {loading && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#fc3f1d] to-[#ff6b4a] animate-pulse" />
                  <div className="absolute inset-3 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#fc3f1d] animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Генерируем серию...</h3>
                <p className="text-gray-500 dark:text-gray-400">AI создаёт {count} постов</p>
              </div>
            )}

            {posts && (
              <div className="space-y-6">
                {posts.map((post, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-6 w-8 h-8 rounded-full bg-[#fc3f1d] text-white text-sm flex items-center justify-center font-bold shadow-lg">
                      {idx + 1}
                    </div>
                    <ResultCard
                      channel={channel}
                      result={post}
                      variantIndex={-1}
                      onCopy={() => handleCopy(`post-${idx}`)}
                      copied={copied === `post-${idx}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
