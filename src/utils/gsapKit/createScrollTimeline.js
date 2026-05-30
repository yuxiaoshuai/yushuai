import { registerGsap } from './registerGsap'

export function createScrollTimeline(options = {}) {
  const {
    trigger,
    scroller,
    pin = true,
    pinSpacing,
    scrub = 0.8,
    start = 'top top',
    end = '+=400%',
    invalidateOnRefresh = true,
    anticipatePin = 1,
    markers = false,
    defaults,
    onUpdate,
    onRefresh,
    onLeave,
    onEnterBack,
  } = options

  const { gsap } = registerGsap()

  return gsap.timeline({
    defaults,
    scrollTrigger: {
      trigger,
      scroller,
      pin,
      pinSpacing,
      scrub,
      start,
      end,
      invalidateOnRefresh,
      anticipatePin,
      markers,
      onUpdate,
      onRefresh,
      onLeave,
      onEnterBack,
    },
  })
}
