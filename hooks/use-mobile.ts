import * as React from "react"

// A navegação lateral fixa só cabe bem a partir do layout desktop. Tablets
// usam o mesmo fluxo móvel, com a barra disponível sob demanda.
const MOBILE_BREAKPOINT = 1280
const MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onChange: () => void) {
  const media = window.matchMedia(MEDIA_QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

function getSnapshot() {
  return window.matchMedia(MEDIA_QUERY).matches
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
