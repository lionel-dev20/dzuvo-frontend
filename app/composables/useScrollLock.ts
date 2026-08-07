/** Bloque le scroll du body (menu mobile ouvert, modale…). */
export function useScrollLock() {
  const locked = ref(false)

  watch(locked, (value) => {
    if (import.meta.server) return
    document.body.style.overflow = value ? 'hidden' : ''
  })

  onBeforeUnmount(() => {
    if (import.meta.client) document.body.style.overflow = ''
  })

  return { locked }
}
