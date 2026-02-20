import { ChannelResult } from '@/types'

interface DirectPreviewProps {
  result: ChannelResult
}

export function DirectPreview({ result }: DirectPreviewProps) {
  return (
    <div className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-600 max-w-lg">
      <div className="bg-white dark:bg-gray-600 border-b border-gray-200 dark:border-gray-500 px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span className="text-gray-400 dark:text-gray-300 text-sm">Поиск</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold shrink-0 text-lg">
            Я
          </div>
          <div className="flex-1">
            <a href="#" className="text-[#1a0dab] dark:text-blue-400 text-lg font-medium hover:underline visited:text-[#609] dark:visited:text-purple-400 block">
              {result.headline || 'Заголовок объявления'}
            </a>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 leading-relaxed">
              {result.body}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-gray-500">
              <span className="text-[#006621] dark:text-green-400">example.ru</span>
              <span>·</span>
              <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded text-[10px]">Реклама</span>
            </div>
          </div>
        </div>

        {result.cta && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-600">
            <button className="px-4 py-2 bg-[#fc3f1d] text-white text-sm font-medium rounded hover:bg-[#e63519] transition">
              {result.cta}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
