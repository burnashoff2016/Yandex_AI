import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { adminApi } from '@/services/api'
import { BrandVoiceExample } from '@/types'

type BrandVoiceEntry = {
  id: number
  channel: string
  content: string
  examples?: string[] | null
  updated_at?: string
}

const channelOptions = [
  { value: 'general', label: 'Общие настройки' },
  { value: 'Директ', label: 'Яндекс.Директ' },
  { value: 'Telegram', label: 'Telegram' },
  { value: 'Email', label: 'Email' },
  { value: 'VK', label: 'VK' },
  { value: 'Дзен', label: 'Яндекс.Дзен' },
]

export function AdminPage() {
  const [voices, setVoices] = useState<BrandVoiceEntry[]>([])
  const [examples, setExamples] = useState<BrandVoiceExample[]>([])
  const [channel, setChannel] = useState('general')
  const [content, setContent] = useState('')
  const [examplesText, setExamplesText] = useState('')
  const [newExample, setNewExample] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [analyzeResult, setAnalyzeResult] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'manual' | 'examples'>('manual')

  useEffect(() => {
    loadVoices()
    loadExamples()
  }, [])

  const loadVoices = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getBrandVoice()
      const items = data as BrandVoiceEntry[]
      setVoices(items)
      if (items.length > 0) {
        const first = items[0]
        setChannel(first.channel)
        setContent(first.content)
        setExamplesText((first.examples ?? []).join('\n'))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const loadExamples = async () => {
    try {
      const data = await adminApi.getBrandVoiceExamples()
      setExamples(data)
    } catch {
      // ignore
    }
  }

  const save = async () => {
    setSaving(true)
    setSuccess(false)
    try {
      const ex = examplesText ? examplesText.split('\n').filter((l) => l.trim()) : undefined
      await adminApi.updateBrandVoice({ channel, content, examples: ex })
      const data = await adminApi.getBrandVoice()
      setVoices(data as BrandVoiceEntry[])
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const addExample = async () => {
    if (!newExample.trim()) return
    
    try {
      await adminApi.createBrandVoiceExample({
        channel,
        original_text: newExample.trim(),
      })
      setNewExample('')
      loadExamples()
    } catch {
      // ignore
    }
  }

  const deleteExample = async (id: number) => {
    try {
      await adminApi.deleteBrandVoiceExample(id)
      loadExamples()
    } catch {
      // ignore
    }
  }

  const analyzeExamples = async () => {
    setAnalyzing(true)
    setAnalyzeResult(null)
    try {
      const result = await adminApi.analyzeBrandVoice({ channel })
      setAnalyzeResult(result.generated_guideline)
      setContent(result.generated_guideline)
      loadVoices()
    } catch {
      // ignore
    } finally {
      setAnalyzing(false)
    }
  }

  const channelExamples = examples.filter((e) => e.channel === channel)

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Brand Voice</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Настройте стиль генерируемого контента</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-600 rounded-full" />
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#fc3f1d] rounded-full border-t-transparent animate-spin" />
            </div>
          </div>
        )}

        {!loading && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'manual'
                      ? 'bg-[#fc3f1d] text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Ручная настройка
                </button>
                <button
                  onClick={() => setActiveTab('examples')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'examples'
                      ? 'bg-[#fc3f1d] text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Из примеров (AI)
                </button>
              </div>
            </div>

            {activeTab === 'manual' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Редактировать</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Канал</label>
                      <select
                        value={channel}
                        onChange={(e) => {
                          setChannel(e.target.value)
                          const existing = voices.find(v => v.channel === e.target.value)
                          if (existing) {
                            setContent(existing.content)
                            setExamplesText((existing.examples ?? []).join('\n'))
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] focus:border-transparent transition appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {channelOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Гайдлайн по стилю</label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] focus:border-transparent transition resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Опишите стиль и тон коммуникации..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Примеры текстов</label>
                      <textarea
                        value={examplesText}
                        onChange={(e) => setExamplesText(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] focus:border-transparent transition resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Каждый пример на новой строке..."
                      />
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Каждый пример на отдельной строке</p>
                    </div>

                    {success && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-600 dark:text-green-400 rounded-xl text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Настройки сохранены
                      </div>
                    )}

                    <button
                      onClick={save}
                      disabled={saving || !content.trim()}
                      className="w-full py-3 bg-gradient-to-r from-[#fc3f1d] to-[#ff6b4a] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-red-200 dark:hover:shadow-red-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Сохранение...
                        </>
                      ) : (
                        'Сохранить настройки'
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Сохранённые настройки</h2>

                  {voices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>Нет сохранённых настроек</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {voices.map((v) => (
                        <div
                          key={v.id}
                          className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                          onClick={() => {
                            setChannel(v.channel)
                            setContent(v.content)
                            setExamplesText((v.examples ?? []).join('\n'))
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {channelOptions.find(o => o.value === v.channel)?.label || v.channel}
                            </span>
                            {v.updated_at && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(v.updated_at).toLocaleDateString('ru-RU')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{v.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Загрузить примеры</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Канал</label>
                      <select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] focus:border-transparent transition appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {channelOptions.filter(o => o.value !== 'general').map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Новый пример</label>
                      <textarea
                        value={newExample}
                        onChange={(e) => setNewExample(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Вставьте пример текста вашего бренда..."
                      />
                    </div>

                    <button
                      onClick={addExample}
                      disabled={!newExample.trim()}
                      className="w-full py-2 border border-[#fc3f1d] text-[#fc3f1d] rounded-xl font-medium text-sm hover:bg-[#fc3f1d]/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      + Добавить пример
                    </button>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Загруженные примеры ({channelExamples.length})
                      </h3>
                      {channelExamples.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500">Нет примеров для этого канала</p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {channelExamples.map((ex) => (
                            <div key={ex.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group">
                              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{ex.original_text}</p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-400">
                                  {new Date(ex.created_at).toLocaleDateString('ru-RU')}
                                </span>
                                <button
                                  onClick={() => deleteExample(ex.id)}
                                  className="text-red-500 opacity-0 group-hover:opacity-100 transition text-xs hover:text-red-600"
                                >
                                  Удалить
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI-анализ</h2>

                  <button
                    onClick={analyzeExamples}
                    disabled={analyzing || channelExamples.length < 2}
                    className="w-full py-3 bg-gradient-to-r from-[#fc3f1d] to-[#ff6b4a] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-red-200 dark:hover:shadow-red-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {analyzing ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Анализируем...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Проанализировать AI
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                    Минимум 2 примера для анализа
                  </p>

                  {analyzeResult && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Сгенерированный гайдлайн:</h3>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                          {analyzeResult}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
