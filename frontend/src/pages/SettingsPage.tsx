import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { mediaApi } from '@/services/api'

export function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [imageApiKey, setImageApiKey] = useState('')
  const [imageModel, setImageModel] = useState('google/gemini-3-pro-image-preview')
  const [imageEnabled, setImageEnabled] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const settings = await mediaApi.getSettings()
      setImageModel(settings.model)
      setImageEnabled(settings.enabled)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    setSuccess(false)
    try {
      await mediaApi.updateSettings({
        api_key: imageApiKey || undefined,
        model: imageModel,
        enabled: imageEnabled,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      loadSettings()
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Настройки</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Персональные настройки генерации контента</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-600 rounded-full" />
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#fc3f1d] rounded-full border-t-transparent animate-spin" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🖼 Генерация изображений
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Настройте API ключ и модель для генерации изображений к постам.
                Изображения генерируются только при наличии кредитов.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API ключ (OpenRouter)
                  </label>
                  <input
                    type="password"
                    value={imageApiKey}
                    onChange={(e) => setImageApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Оставьте пустым, чтобы использовать ключ из настроек сервера
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Модель для изображений
                  </label>
                  <select
                    value={imageModel}
                    onChange={(e) => setImageModel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#fc3f1d] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="google/gemini-3-pro-image-preview">Gemini 3 Pro Image Preview</option>
                    <option value="google/gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
                    <option value="openai/dall-e-3">DALL-E 3 (требуется OpenAI API)</option>
                    <option value="stabilityai/stable-diffusion-xl-base-1.0">Stable Diffusion XL</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <input
                    type="checkbox"
                    id="imageEnabled"
                    checked={imageEnabled}
                    onChange={(e) => setImageEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#fc3f1d] focus:ring-[#fc3f1d]"
                  />
                  <div>
                    <label htmlFor="imageEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Включить генерацию изображений
                    </label>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      При выключении будет показываться заглушка
                    </p>
                  </div>
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
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-[#fc3f1d] to-[#ff6b4a] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-red-200 dark:hover:shadow-red-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить настройки'
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-100 dark:border-purple-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span>💡</span> Подсказка
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  Для генерации изображений нужны кредиты на OpenRouter
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  Gemini 3 Pro Image Preview стоит ~$120 за 1M токенов
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  Бесплатных моделей для изображений нет
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  Пополнить баланс: <a href="https://openrouter.ai/settings/credits" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 underline">openrouter.ai/settings/credits</a>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
