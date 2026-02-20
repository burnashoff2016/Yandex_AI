import { ChannelResult } from '@/types'
import { ImagePlaceholder } from '../ImagePlaceholder'

interface ZenPreviewProps {
  result: ChannelResult
}

export function ZenPreview({ result }: ZenPreviewProps) {
  return (
    <div className="space-y-3">
      {result.headline && (
        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
          {result.headline}
        </h3>
      )}
      
      {result.image_url ? (
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
          <img 
            src={result.image_url} 
            alt="" 
            className="w-full h-auto max-h-64 object-cover"
          />
        </div>
      ) : (
        <ImagePlaceholder className="h-40" />
      )}
      
      <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
        {result.body}
      </div>

      {result.hashtags && result.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {result.hashtags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
