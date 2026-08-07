import type { ContactPayload, FieldErrors } from '#shared/types/forms'
import { hasErrors, validateContact } from '#shared/utils/validation'

const emptyForm = (): ContactPayload => ({
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  phone: '',
  subject: '',
  message: '',
  consent: false,
  honeypot: '',
})

/**
 * État et soumission du formulaire de contact.
 * La validation est celle de `#shared/utils/validation`, rejouée côté serveur.
 */
export function useContactForm() {
  const form = reactive<ContactPayload>(emptyForm())
  const errors = ref<FieldErrors<ContactPayload>>({})
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const feedback = ref('')

  async function submit() {
    errors.value = validateContact(form)
    if (hasErrors(errors.value)) return

    status.value = 'pending'
    try {
      const result = await $fetch('/api/contact', { method: 'POST', body: { ...form } })
      status.value = 'success'
      feedback.value = result.message
      Object.assign(form, emptyForm())
    }
    catch (error: any) {
      status.value = 'error'
      errors.value = error?.data?.data?.errors ?? {}
      feedback.value = error?.data?.message ?? "L'envoi a échoué. Merci de réessayer."
    }
  }

  function reset() {
    Object.assign(form, emptyForm())
    errors.value = {}
    status.value = 'idle'
    feedback.value = ''
  }

  return { form, errors, status, feedback, submit, reset }
}
