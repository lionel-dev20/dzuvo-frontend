import type { ReviewPayload } from '#shared/types/reviews'
import type { FieldErrors } from '#shared/types/forms'
import { hasErrors, validateReview } from '#shared/utils/validation'

/**
 * État et soumission du formulaire d'avis.
 * Même validation que le serveur (`#shared/utils/validation`), rejouée là-bas.
 */
export function useReviewForm(productId: MaybeRefOrGetter<number>) {
  const empty = (): ReviewPayload => ({
    productId: toValue(productId),
    name: '',
    email: '',
    rating: 0,
    comment: '',
    honeypot: '',
  })

  const form = reactive<ReviewPayload>(empty())
  const errors = ref<FieldErrors<ReviewPayload>>({})
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const feedback = ref('')

  async function submit() {
    form.productId = toValue(productId)
    errors.value = validateReview(form)
    if (hasErrors(errors.value)) return

    status.value = 'pending'
    try {
      const result = await $fetch<{ message: string }>('/api/catalog/reviews', { method: 'POST', body: { ...form } })
      status.value = 'success'
      feedback.value = result.message
      Object.assign(form, empty())
    }
    catch (error: any) {
      status.value = 'error'
      errors.value = error?.data?.data?.errors ?? {}
      feedback.value = error?.data?.message ?? 'L’envoi a échoué. Merci de réessayer.'
    }
  }

  function reset() {
    Object.assign(form, empty())
    errors.value = {}
    status.value = 'idle'
    feedback.value = ''
  }

  return { form, errors, status, feedback, submit, reset }
}
