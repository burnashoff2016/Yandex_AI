import { useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { contentPlanApi } from '@/services/api'
import { CHANNELS, CHANNEL_INFO, Goal, GOALS, ContentPlanItem } from '@/types'

export function ContentPlanPage() {
  const [product, setProduct] = useState('')
  const [days, setDays] = useState(7)
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['Telegram', 'VK'])
  const [goal, setGoal] = useState<Goal>('продажа')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<ContentPlanItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggleChannel = (c: string) => {
    setSelectedChannels(prev => 
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  const onGenerate = async () => {
    setError(null)
    if (!product.trim()) {
      setError('Введите описание продукта')
      return
    }
    if (selectedChannels.length === 0) {
      setError('Выберите канал')
      return
    }

    setLoading(true)
    setPlan(null)
    try {
      const response = await contentPlanApi.generate({
        product,
        duration_days: days,
        channels: selectedChannels,
        goal,
      })
      setPlan(response.plan)
    } catch {
      setError('Ошибка генерации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Контент-план</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Генерация продающего плана публикаций</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Параметры</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Продукт</label>
                <textarea
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Описание вашего продукта или услуги..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Период (дней)</label>
                <div className="flex gap-2">
                  {[7, 14, 21, 30].map((n) => (
                    <button
                      key={n}
                      onClick={() => setDays(n)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                        days === n
                          ? 'bg-[#fc3f1d] text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Каналы</label>
                <div className="grid grid-cols-2 gap-2">
                  {CHANNELS.filter(c => c !== 'Директ').map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleChannel(c)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                        selectedChannels.includes(c)
                          ? `border-transparent bg-gradient-to-r ${CHANNEL_INFO[c].gradient} text-white`
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{CHANNEL_INFO[c].icon}</span>
                      <span>{c}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Цель</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as Goal)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {GOALS.map((g) => (
                    <option key={g.value} value={g.value}>{g.icon} {g.label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={onGenerate}
                disabled={loading || !product.trim() || selectedChannels.length === 0}
                className="w-full py-3 bg-gradient-to-r from-[#fc3f1d] to-[#ff6b4a] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Сгенерировать план
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            {!plan && !loading && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#fc3f1d]/10 to-[#ff6b4a]/10 dark:from-[#fc3f1d]/20 dark:to-[#ff6b4a]/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-[#fc3f1d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Готовы к генерации</h3>
                <p className="text-gray-500 dark:text-gray-400">Укажите продукт и параметры плана</p>
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
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Генерируем план...</h3>
                <p className="text-gray-500 dark:text-gray-400">AI создаёт контент-план на {days} дней</p>
              </div>
            )}

            {plan && (
              <div className="space-y-4">
                {plan.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex gap-5"
                  >
                    <div className="flex flex-col items-center justify-center w-16 shrink-0">
                      <div className="text-2xl font-bold text-[#fc3f1d]">{item.day}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.date}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{CHANNEL_INFO[item.channel as keyof typeof CHANNEL_INFO]?.icon}</span>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.channel}</span>
                        <span className="px-3 py-1 bg-[#fc3f1d]/10 text-[#fc3f1d] text-sm rounded-full">
                          {item.topic}
                        </span>
                      </div>
                      {item.draft.headline && (
                        <h4 className="font-medium text-gray-900 dark:text-white text-base mb-1">
                          {item.draft.headline}
                        </h4>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {item.draft.body}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        item.draft.score >= 8 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        item.draft.score >= 6 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {item.draft.score.toFixed(1)}
                      </div>
                    </div>
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
