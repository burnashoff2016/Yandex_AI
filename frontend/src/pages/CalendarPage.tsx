import { useEffect, useState, useMemo } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { AppLayout } from '@/components/AppLayout'
import { calendarApi } from '@/services/api'
import { ScheduledPost, ChannelResult, Channel, CHANNEL_INFO } from '@/types'

moment.locale('ru')

const localizer = momentLocalizer(moment)

const messages = {
  today: 'Сегодня',
  previous: 'Назад',
  next: 'Вперёд',
  month: 'Месяц',
  week: 'Неделя',
  day: 'День',
  agenda: 'Список',
  date: 'Дата',
  time: 'Время',
  event: 'Событие',
  noEventsInRange: 'Нет запланированных публикаций',
}

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  resource: ScheduledPost
}

export function CalendarPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const data = await calendarApi.getPosts()
      setPosts(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const events: CalendarEvent[] = useMemo(() => {
    return posts.map((post) => {
      const content = post.content as unknown as ChannelResult
      const channel = post.channel as Channel
      const channelInfo = CHANNEL_INFO[channel] || { icon: '📌' }
      
      return {
        id: post.id,
        title: `${channelInfo.icon} ${content.headline || content.body?.slice(0, 30) || 'Публикация'}...`,
        start: new Date(post.scheduled_date),
        end: new Date(new Date(post.scheduled_date).getTime() + 60 * 60 * 1000),
        resource: post,
      }
    })
  }, [posts])

  const handleDelete = async (id: number) => {
    try {
      await calendarApi.deletePost(id)
      setPosts(posts.filter((p) => p.id !== id))
      setSelectedEvent(null)
    } catch {
      // ignore
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Запланировано'
      case 'published':
        return 'Опубликовано'
      case 'cancelled':
        return 'Отменено'
      default:
        return 'Черновик'
    }
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status
    let backgroundColor = '#3b82f6'
    
    if (status === 'published') backgroundColor = '#22c55e'
    if (status === 'cancelled') backgroundColor = '#ef4444'
    if (status === 'draft') backgroundColor = '#6b7280'

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    }
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Календарь публикаций</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Управление запланированными публикациями</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-600 rounded-full" />
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#fc3f1d] rounded-full border-t-transparent animate-spin" />
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="h-[600px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                messages={messages}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => setSelectedEvent(event)}
                popup
                selectable
              />
            </div>
          </div>
        )}

        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedEvent(null)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedEvent.resource.channel}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {moment(selectedEvent.start).format('DD MMMM YYYY, HH:mm')}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEvent.resource.status)}`}>
                  {getStatusLabel(selectedEvent.resource.status)}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                {(selectedEvent.resource.content as unknown as ChannelResult).headline && (
                  <p className="font-medium text-gray-900 dark:text-white mb-2">
                    {(selectedEvent.resource.content as unknown as ChannelResult).headline}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {(selectedEvent.resource.content as unknown as ChannelResult).body}
                </p>
                {(selectedEvent.resource.content as unknown as ChannelResult).hashtags && (
                  <p className="text-sm text-blue-500 mt-2">
                    {(selectedEvent.resource.content as unknown as ChannelResult).hashtags?.join(' ')}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Закрыть
                </button>
                {selectedEvent.resource.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() => handleDelete(selectedEvent.id)}
                      className="py-2.5 px-4 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      Удалить
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
