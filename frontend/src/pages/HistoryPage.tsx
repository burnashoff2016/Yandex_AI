import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { generateApi } from '@/services/api'
import { Generation, ChannelResult, CHANNEL_INFO } from '@/types'

export function HistoryPage() {
  const [history, setHistory] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ id: number; description: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { loadHistory() }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await generateApi.getHistory(50)
      setHistory(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    setDeleting(true)
    try {
      await generateApi.deleteGeneration(deleteModal.id)
      setHistory(history.filter(h => h.id !== deleteModal.id))
      setDeleteModal(null)
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  const getChannelIcon = (channel: string) => {
    return CHANNEL_INFO[channel as keyof typeof CHANNEL_INFO]?.icon || '📄'
  }

  const getChannelGradient = (channel: string) => {
    return CHANNEL_INFO[channel as keyof typeof CHANNEL_INFO]?.gradient || 'from-gray-400 to-gray-500'
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">История генераций</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Все ваши сгенерированные тексты</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-600 rounded-full" />
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#fc3f1d] rounded-full border-t-transparent animate-spin" />
            </div>
          </div>
        )}

        {!loading && history.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">История пуста</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Сгенерируйте первый контент на главной странице</p>
          </div>
        )}

        {!loading && history.length > 0 && (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      <div className="flex -space-x-1">
                        {item.channels.map((c) => (
                          <span
                            key={c}
                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${getChannelGradient(c)} flex items-center justify-center text-sm border-2 border-white dark:border-gray-800`}
                          >
                            {getChannelIcon(c)}
                          </span>
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white line-clamp-1">{item.description}</div>
                        <div className="text-sm text-gray-400 dark:text-gray-500">
                          {new Date(item.created_at).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.is_saved && (
                        <span className="px-2 py-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-lg flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Сохранено
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteModal({ id: item.id, description: item.description })
                        }}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Удалить"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <svg
                        className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform cursor-pointer ${expandedId === item.id ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      />
                    </div>
                  </div>

                  {expandedId === item.id && item.variants && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      {Object.entries(item.variants).map(([channel, results]) => (
                        <div key={channel} className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span>{getChannelIcon(channel)}</span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{channel}</span>
                          </div>
                          {(results as ChannelResult[]).map((result, idx) => (
                            <div key={idx} className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-2">
                              {result.headline && (
                                <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">{result.headline}</div>
                              )}
                              <div className="line-clamp-3">{result.body}</div>
                              {result.score > 0 && (
                                <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                  Оценка: {result.score}/10
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModal(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">Удалить генерацию?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">
              «{deleteModal.description.slice(0, 50)}...»
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-2.5 px-4 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Удалить'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
