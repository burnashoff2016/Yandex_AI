import { useState } from 'react'
import { Channel, ChannelResult, CHANNEL_INFO, ImproveAction } from '@/types'
import { TelegramPreview } from './previews/TelegramPreview'
import { DirectPreview } from './previews/DirectPreview'
import { VKPreview } from './previews/VKPreview'
import { EmailPreview } from './previews/EmailPreview'
import { ZenPreview } from './previews/ZenPreview'
import { ScheduleModal } from './ScheduleModal'
import { exportToCSV, exportToPDF, exportToDOCX, copySingleResult } from '@/utils/export'
import { improveApi, calendarApi } from '@/services/api'

interface ResultCardProps {
  channel: Channel
  result: ChannelResult
  variantIndex: number
  onCopy: () => void
  copied: boolean
  onResultUpdate?: (channel: Channel, newResult: ChannelResult) => void
}

const PreviewComponents = {
  'Telegram': TelegramPreview,
  'Директ': DirectPreview,
  'VK': VKPreview,
  'Email': EmailPreview,
}

const IMPROVE_ACTIONS: { action: ImproveAction; label: string; icon: string }[] = [
  { action: 'shorten', label: 'Короче', icon: '✂️' },
  { action: 'emoji', label: 'Эмодзи', icon: '😀' },
  { action: 'tone', label: 'Тон', icon: '🎭' },
  { action: 'cta', label: 'CTA', icon: '🎯' },
]

export function ResultCard({ channel, result, variantIndex, onCopy, copied, onResultUpdate }: ResultCardProps) {
  const [showImprovements, setShowImprovements] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [improving, setImproving] = useState<ImproveAction | null>(null)
  const [localResult, setLocalResult] = useState(result)
  const channelInfo = CHANNEL_INFO[channel]

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400'
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 9) return 'Отлично'
    if (score >= 7) return 'Хорошо'
    if (score >= 5) return 'Нормально'
    return 'Требует доработки'
  }

  const copyFullText = () => {
    copySingleResult(channel, localResult)
    onCopy()
  }

  const handleExport = async (format: 'csv' | 'pdf' | 'docx') => {
    const exportData = [{ channel, result: localResult }]
    const filename = `content-${channel}-${Date.now()}`
    
    switch (format) {
      case 'csv':
        exportToCSV(exportData, filename)
        break
      case 'pdf':
        exportToPDF(exportData, filename)
        break
      case 'docx':
        await exportToDOCX(exportData, filename)
        break
    }
    setShowExportMenu(false)
  }

  const handleImprove = async (action: ImproveAction) => {
    setImproving(action)
    try {
      const response = await improveApi.improve(action, {
        text: localResult.body,
        channel,
        action,
      })
      
      const newResult = { ...localResult, body: response.improved_text }
      setLocalResult(newResult)
      onResultUpdate?.(channel, newResult)
    } catch {
      // error handling
    } finally {
      setImproving(null)
    }
  }

  const handleSchedule = async (date: string, time: string, timezone: string) => {
    try {
      const scheduledDate = new Date(`${date}T${time}:00`).toISOString()
      await calendarApi.createPost({
        channel,
        content: localResult as unknown as Record<string, unknown>,
        scheduled_date: scheduledDate,
        timezone,
      })
    } catch (err) {
      console.error('Failed to schedule post:', err)
      throw err
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{channelInfo.icon}</span>
            <span className="font-medium text-gray-900 dark:text-white">{channel}</span>
            {variantIndex >= 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                Вариант {variantIndex + 1}
              </span>
            )}
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${getScoreColor(localResult.score)}`}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-semibold text-sm">{localResult.score.toFixed(1)}</span>
            <span className="text-xs hidden sm:inline">{getScoreLabel(localResult.score)}</span>
          </div>
        </div>

        <div className="p-4">
          {channel === 'Дзен' ? (
            <ZenPreview result={localResult} />
          ) : (
            (() => {
              const Comp = PreviewComponents[channel]
              return Comp ? <Comp result={localResult} /> : null
            })()
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 flex-wrap">
            {IMPROVE_ACTIONS.map(({ action, label, icon }) => (
              <button
                key={action}
                onClick={() => handleImprove(action)}
                disabled={improving !== null}
                className={`px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                  improving === action
                    ? 'bg-[#fc3f1d]/10 text-[#fc3f1d] dark:bg-[#fc3f1d]/20'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                {improving === action ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  icon
                )}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={copyFullText}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                copied
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Скопировано
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Копировать
                </>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Экспорт
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute left-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50">
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      📄 CSV
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      📑 PDF
                    </button>
                    <button
                      onClick={() => handleExport('docx')}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      📝 DOCX
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">В календарь</span>
            </button>
          </div>

          {localResult.improvements && localResult.improvements.length > 0 && (
            <button
              onClick={() => setShowImprovements(!showImprovements)}
              className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="hidden sm:inline">Рекомендации</span>
              <svg className={`w-3 h-3 transition-transform ${showImprovements ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {showImprovements && localResult.improvements && localResult.improvements.length > 0 && (
          <div className="px-4 pb-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <h4 className="font-medium text-amber-800 dark:text-amber-300 text-xs mb-2">Как улучшить:</h4>
              <ul className="space-y-1">
                {localResult.improvements.map((imp, i) => (
                  <li key={i} className="text-amber-700 dark:text-amber-400 text-xs flex items-start gap-1.5">
                    <span className="text-amber-400">•</span>
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        channel={channel}
        result={localResult}
        onSchedule={handleSchedule}
      />
    </>
  )
}
