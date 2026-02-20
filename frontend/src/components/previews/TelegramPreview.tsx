import { ChannelResult } from '@/types'
import { ImagePlaceholder } from '../ImagePlaceholder'

interface TelegramPreviewProps {
  result: ChannelResult
}

export function TelegramPreview({ result }: TelegramPreviewProps) {
  return (
    <div className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-600 max-w-md">
      <div className="bg-[#229ED9] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.1.154.234.169.326.015.092.034.302.019.466z"/>
          </svg>
          <span className="text-white font-medium text-sm">Telegram</span>
        </div>
        <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </div>

      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#229ED9] to-[#1a7bb8] flex items-center justify-center text-white font-bold shrink-0">
            M
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 dark:text-white text-sm">Marketing Bot</span>
              <svg className="w-4 h-4 text-[#229ED9]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
              {result.body}
            </div>
            {result.hashtags && result.hashtags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {result.hashtags.map((tag, i) => (
                  <span key={i} className="text-[#229ED9] text-sm hover:underline cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">12:34</div>
          </div>
        </div>

        {result.image_url ? (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img src={result.image_url} alt="" className="w-full h-auto max-h-48 object-cover" />
          </div>
        ) : (
          <ImagePlaceholder className="mt-3 h-32" />
        )}

        <div className="flex items-center gap-2 mt-3 ml-13 pl-12">
          <button className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-full text-xs hover:bg-gray-200 dark:hover:bg-gray-500">
            <span>🔥</span>
            <span className="text-gray-600 dark:text-gray-300">24</span>
          </button>
          <button className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-full text-xs hover:bg-gray-200 dark:hover:bg-gray-500">
            <span>👍</span>
            <span className="text-gray-600 dark:text-gray-300">18</span>
          </button>
        </div>
      </div>
    </div>
  )
}
