import { ChannelResult } from '@/types'
import { ImagePlaceholder } from '../ImagePlaceholder'

interface VKPreviewProps {
  result: ChannelResult
}

export function VKPreview({ result }: VKPreviewProps) {
  return (
    <div className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-600 max-w-md">
      <div className="bg-[#4a76a8] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.576-1.496c.588-.19 1.341 1.26 2.14 1.818.605.422 1.064.33 1.064.33l2.137-.03s1.117-.071.587-.964c-.043-.073-.308-.661-1.588-1.87-1.34-1.264-1.16-1.059.453-3.246.983-1.332 1.376-2.145 1.253-2.493-.117-.332-.84-.244-.84-.244l-2.406.015s-.178-.025-.31.056c-.13.079-.212.262-.212.262s-.382 1.03-.89 1.907c-1.07 1.85-1.499 1.948-1.674 1.832-.407-.267-.305-1.075-.305-1.648 0-1.793.267-2.54-.521-2.733-.262-.065-.454-.107-1.123-.114-.858-.009-1.585.003-1.996.208-.274.136-.485.44-.356.457.159.022.519.099.71.363.246.341.237 1.107.237 1.107s.142 2.11-.33 2.371c-.324.18-.768-.187-1.72-1.862-.487-.857-.855-1.804-.855-1.804s-.07-.177-.197-.272c-.154-.115-.37-.151-.37-.151l-2.286.015s-.343.01-.469.162c-.112.135-.009.414-.009.414s1.781 4.232 3.797 6.363c1.85 1.956 3.951 1.828 3.951 1.828h.953z"/>
          </svg>
          <span className="text-white font-medium text-sm">ВКонтакте</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#4a76a8] to-[#5d8bb3] flex items-center justify-center text-white font-bold shrink-0">
            M
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#2a5885] dark:text-blue-400 text-sm hover:underline cursor-pointer">
                Marketing Company
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">сегодня в 12:34</span>
            </div>
            <div className="text-gray-800 dark:text-gray-200 text-sm mt-2 whitespace-pre-wrap leading-relaxed">
              {result.body}
            </div>
            {result.hashtags && result.hashtags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {result.hashtags.map((tag, i) => (
                  <span key={i} className="text-[#2a5885] dark:text-blue-400 text-sm hover:underline cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {result.image_url ? (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img src={result.image_url} alt="" className="w-full h-auto max-h-48 object-cover" />
          </div>
        ) : (
          <ImagePlaceholder className="mt-3 h-32" />
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-[#2a5885] dark:text-blue-400 text-sm hover:underline">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
              </svg>
              <span>128</span>
            </button>
            <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm hover:underline">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
              </svg>
              <span>24</span>
            </button>
          </div>
          <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
