import { useState, useEffect, useCallback } from 'react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'

const ONBOARDING_KEY = 'onboarding_completed'

const steps: Step[] = [
  {
    target: 'textarea[placeholder*="Продукт"]',
    content: 'Опишите ваш продукт, акцию или новость. Чем детальнее описание, тем лучше результат.',
    title: '📝 Описание продукта',
    disableBeacon: true,
  },
  {
    target: '[data-tour="channels"]',
    content: 'Выберите каналы для генерации. Каждый канал имеет свой формат и ограничения.',
    title: '📱 Выбор каналов',
  },
  {
    target: '[data-tour="goal"]',
    content: 'Укажите цель текста: продажа, узнаваемость, вовлечение или анонс.',
    title: '🎯 Цель текста',
  },
  {
    target: '[data-tour="tone"]',
    content: 'Выберите тон коммуникации: дружелюбный, формальный, дерзкий или экспертный.',
    title: '🗣 Тон текста',
  },
  {
    target: '[data-tour="generate-btn"]',
    content: 'Нажмите для генерации текстов. AI создаст варианты для каждого канала.',
    title: '✨ Генерация',
  },
  {
    target: '[data-tour="results"]',
    content: 'Результаты появятся здесь. Вы можете копировать, экспортировать или улучшать тексты.',
    title: '📋 Результаты',
  },
]

interface OnboardingProps {
  run: boolean
  onComplete: () => void
}

export function Onboarding({ run, onComplete }: OnboardingProps) {
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (run) {
      setIsRunning(true)
    }
  }, [run])

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status } = data
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(ONBOARDING_KEY, 'true')
      setIsRunning(false)
      onComplete()
    }
  }, [onComplete])

  return (
    <Joyride
      steps={steps}
      run={isRunning}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#fc3f1d',
          zIndex: 10000,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#fc3f1d',
        },
        buttonBack: {
          marginRight: 10,
        },
      }}
      locale={{
        back: 'Назад',
        close: 'Закрыть',
        last: 'Готово',
        next: 'Далее',
        skip: 'Пропустить',
      }}
    />
  )
}

export function startOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY)
  window.dispatchEvent(new CustomEvent('start-onboarding'))
}

export function isOnboardingCompleted(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}
