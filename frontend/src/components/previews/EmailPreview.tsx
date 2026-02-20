import { ChannelResult } from '@/types'

interface EmailPreviewProps {
  result: ChannelResult
}

export function EmailPreview({ result }: EmailPreviewProps) {
  return (
    <div className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-600 max-w-lg">
      <div className="bg-gray-100 dark:bg-gray-600 border-b border-gray-200 dark:border-gray-500 px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-600 dark:text-gray-200 text-sm font-medium">Входящие</span>
        </div>
        <div className="flex-1" />
        <div className="text-xs text-gray-400 dark:text-gray-400">12:34</div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0 text-sm">
            M
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">Marketing Company</span>
                <span className="text-gray-400 dark:text-gray-400 text-xs ml-2">&lt;news@marketing.ru&gt;</span>
              </div>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">кому: мне</div>
          </div>
        </div>

        <div className="mb-4 pb-3 border-b border-gray-100 dark:border-gray-600">
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">Тема:</div>
          <div className="font-semibold text-gray-900 dark:text-white">
            {result.headline || 'Тема письма'}
          </div>
        </div>

        <div className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
          {result.body}
        </div>

        {result.cta && (
          <div className="mt-6 text-center">
            <button className="px-6 py-3 bg-[#4F46E5] text-white text-sm font-medium rounded-lg hover:bg-[#4338CA] transition inline-flex items-center gap-2">
              {result.cta}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-600 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Вы получили это письмо, потому что подписаны на рассылку Marketing Company
          </p>
        </div>
      </div>
    </div>
  )
}
