import { useEffect, useState } from 'react'

export function ElectionTimer({ end }: { end: string | null }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null)

  useEffect(() => {
    if (!end) return

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = new Date(end).getTime() - now

      if (distance < 0) {
        clearInterval(timer)
        setTimeLeft(null)
        return
      }

      setTimeLeft({
        days:    Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [end])

  if (!end) return null
  if (!timeLeft) return <div className="text-xs font-medium text-red-600">Ended</div>

  return (
    <div className="flex gap-2">
      {[
        { l: 'd', v: timeLeft.days },
        { l: 'h', v: timeLeft.hours },
        { l: 'm', v: timeLeft.minutes },
        { l: 's', v: timeLeft.seconds },
      ].map(t => (
        <div key={t.l} className="flex flex-col items-center">
          <span className="text-lg font-bold tabular-nums leading-none">{t.v}</span>
          <span className="text-[10px] uppercase font-bold text-muted-foreground">{t.l}</span>
        </div>
      ))}
    </div>
  )
}
