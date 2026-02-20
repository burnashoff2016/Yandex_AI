interface ImagePlaceholderProps {
  className?: string
  onClick?: () => void
}

export function ImagePlaceholder({ className = '', onClick }: ImagePlaceholderProps) {
  return (
    <div 
      className={`bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-500 rounded-lg flex items-center justify-center cursor-pointer hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-500 dark:hover:to-gray-400 transition ${className}`}
      onClick={onClick}
    >
      <div className="text-center p-4">
        <svg className="w-10 h-10 text-gray-300 dark:text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-xs text-gray-400 dark:text-gray-500">Изображение</p>
      </div>
    </div>
  )
}
