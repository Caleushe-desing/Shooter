import { useEffect, useState } from 'react'

/**
 * True for phone/tablet (coarse primary pointer).
 * Do NOT use maxTouchPoints alone — many laptops report touch and would
 * wrongly hide keyboard controls / show the virtual pad.
 */
export function useIsMobile() {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const sync = () => setMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return mobile
}
