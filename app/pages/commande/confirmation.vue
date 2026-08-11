<script setup lang="ts">
import type { OrderSummary } from '#shared/types/checkout'
import { formatPrice } from '#shared/utils/format'

/**
 * Confirmation de commande.
 *
 * La page se relit : le numéro et la clé sont dans l'URL, et c'est le serveur
 * qui répond — un client revenu par son historique retrouve sa commande, et
 * personne ne peut lire celle d'un autre sans la clé.
 */
const route = useRoute()
const id = Number(route.query.order ?? 0)
const key = String(route.query.key ?? '')

const { data, error } = await useAsyncData<{ order: OrderSummary }>(
  `order-${id}`,
  () => $fetch(`/api/checkout/order/${id}`, { query: { key } }),
  { immediate: Boolean(id && key) },
)

const order = computed(() => data.value?.order ?? null)

useSeo({
  title: 'Commande confirmée',
  description: 'Merci pour votre commande DZUVO.',
  noindex: true,
})
</script>

<template>
  <div class="px-2.5 pt-10 pb-20 md:px-5 lg:px-24">
    <!-- Référence absente ou invalide : on ne laisse pas la page vide. -->
    <div v-if="!order" class="mx-auto max-w-xl py-16 text-center">
      <h1 class="text-h2 font-bold text-tertiary-50">Commande introuvable</h1>
      <span class="mx-auto mt-4 block h-0.5 w-14 rounded-full bg-secondary" aria-hidden="true" />
      <p class="mt-5 text-tertiary-600">
        {{ error ? 'Ce lien de commande n’est plus valide.' : 'Il manque la référence de la commande.' }}
        Si vous venez de payer, un courriel de confirmation vous a été envoyé.
      </p>
      <NuxtLink to="/categories" class="btn-primary mt-8 justify-center">Retour à la boutique</NuxtLink>
    </div>

    <div v-else class="mx-auto max-w-3xl">
      <!-- En-tête -->
      <div class="flex flex-col items-center text-center">
        <span class="grid size-20 place-items-center rounded-full border-2 border-green-500/60" aria-hidden="true">
          <svg width="38" height="38" viewBox="0 0 20 20" fill="none" class="text-green-500">
            <path d="m5 10.5 3.2 3.2L15 6.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>

        <h1 class="mt-8 text-h2 font-bold text-tertiary-50">
          {{ order.paid ? 'Merci, votre commande est confirmée !' : 'Votre commande est enregistrée' }}
        </h1>
        <span class="mt-4 block h-0.5 w-14 rounded-full bg-secondary" aria-hidden="true" />

        <p class="mt-5 max-w-xl text-pretty text-tertiary-600">
          Commande <strong class="font-bold text-tertiary-50">n° {{ order.number }}</strong>.
          Un courriel de confirmation part vers
          <strong class="font-bold text-tertiary-50">{{ order.email }}</strong>.
        </p>

        <!-- Paiement encaissé mais commande pas encore basculée : cas du webhook en retard. -->
        <p v-if="!order.paid" class="mt-4 rounded-xl border border-secondary/40 bg-secondary/8 px-4 py-3 text-[13px] text-tertiary-500">
          Le règlement est en cours de validation par notre prestataire de paiement.
          Vous recevrez la confirmation dès qu’il sera enregistré.
        </p>
      </div>

      <!-- Détail -->
      <div class="mt-10 grid gap-4 sm:grid-cols-2">
        <section class="rounded-2xl bg-primary p-5">
          <h2 class="text-[11px] font-bold tracking-[0.14em] text-tertiary-800 uppercase">Livraison</h2>
          <p class="mt-3 text-body whitespace-pre-line text-tertiary-500">{{ order.shippingAddress }}</p>
          <p v-if="order.shippingLabel" class="mt-3 text-[13px] text-tertiary-800">{{ order.shippingLabel }}</p>
        </section>

        <section class="rounded-2xl bg-primary p-5">
          <h2 class="text-[11px] font-bold tracking-[0.14em] text-tertiary-800 uppercase">Paiement</h2>
          <p class="mt-3 text-body text-tertiary-500">Carte bancaire</p>
          <p class="mt-1 text-[13px] text-tertiary-800">
            {{ order.paid ? 'Réglé' : 'En attente de validation' }} — {{ formatPrice(order.total) }}
          </p>
        </section>
      </div>

      <section class="mt-4 rounded-2xl bg-primary p-5">
        <h2 class="text-h4 font-bold text-tertiary-50">Votre commande</h2>

        <ul class="mt-5 flex flex-col gap-3">
          <li v-for="(line, index) in order.lines" :key="index" class="flex items-baseline justify-between gap-4">
            <span class="min-w-0 text-body text-tertiary-500">
              {{ line.name }}
              <span class="text-tertiary-800">× {{ line.quantity }}</span>
            </span>
            <span class="shrink-0 text-body font-medium text-tertiary-50 tabular-nums">
              {{ formatPrice(line.total) }}
            </span>
          </li>
        </ul>

        <hr class="my-5 border-tertiary-500/10">

        <dl class="flex flex-col gap-2 text-[13px]">
          <div class="flex items-baseline justify-between gap-4">
            <dt class="text-tertiary-800">Sous-total</dt>
            <dd class="text-tertiary-500 tabular-nums">{{ formatPrice(order.subtotal) }}</dd>
          </div>
          <div v-if="order.discountTotal" class="flex items-baseline justify-between gap-4">
            <dt class="text-tertiary-800">Remise</dt>
            <dd class="text-secondary tabular-nums">−{{ formatPrice(order.discountTotal) }}</dd>
          </div>
          <div class="flex items-baseline justify-between gap-4">
            <dt class="text-tertiary-800">Livraison</dt>
            <dd class="text-tertiary-500 tabular-nums">
              {{ order.shippingTotal ? formatPrice(order.shippingTotal) : 'Offerte' }}
            </dd>
          </div>
          <div class="mt-2 flex items-baseline justify-between gap-4 border-t border-tertiary-500/10 pt-4">
            <dt class="text-h4 font-bold text-tertiary-50">Total</dt>
            <dd class="text-h3 font-bold text-tertiary-50 tabular-nums">{{ formatPrice(order.total) }}</dd>
          </div>
        </dl>
      </section>

      <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <NuxtLink to="/categories" class="btn-primary justify-center">Continuer mes achats</NuxtLink>
        <NuxtLink to="/compte" class="btn-secondary justify-center">Voir mes commandes</NuxtLink>
      </div>
    </div>
  </div>
</template>
