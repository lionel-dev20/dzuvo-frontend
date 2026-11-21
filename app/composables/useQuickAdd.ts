import type { CatalogProduct } from '#shared/types/catalog'

/**
 * Ajout au panier depuis une vitrine de l'accueil.
 *
 * Les vitrines décrivent leurs produits par un slug, pas par un produit
 * complet : on résout la fiche au clic seulement. Quand elle n'est pas
 * achetable en un geste — rupture, déclinaisons à choisir, produit introuvable —
 * on ouvre la fiche, où le choix se fait.
 */
export function useQuickAdd() {
  const { add } = useCart()
  const pending = ref<string | null>(null)

  async function quickAdd(slug: string, fallbackTo: string) {
    if (pending.value) return
    pending.value = slug
    try {
      const product = await $fetch<CatalogProduct>(`/api/catalog/product/${slug}`)
      if (!product.inStock || product.variable || product.purchasable === false) {
        await navigateTo(fallbackTo)
        return
      }
      add(product)
    }
    catch {
      await navigateTo(fallbackTo)
    }
    finally {
      pending.value = null
    }
  }

  return { quickAdd, pending }
}
