<script setup lang="ts">
import { paymentBrands, trustItems } from '~/config/productTrust'

/** Réassurance : ce qui lève les derniers doutes au moment de payer. */
</script>

<template>
  <div class="mt-6">
    <ul class="grid gap-3 sm:grid-cols-2">
      <li
        v-for="item in trustItems"
        :key="item.title"
        class="flex items-start gap-3 rounded-xl border border-tertiary-500/10 bg-primary px-4 py-3"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" class="mt-0.5 shrink-0 text-secondary" aria-hidden="true">
          <template v-if="item.icon === 'lock'">
            <rect x="4.5" y="10.5" width="15" height="10" rx="2" stroke="currentColor" stroke-width="1.6" />
            <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </template>
          <template v-else-if="item.icon === 'truck'">
            <path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
            <circle cx="7" cy="17" r="1.8" stroke="currentColor" stroke-width="1.6" />
            <circle cx="17" cy="17" r="1.8" stroke="currentColor" stroke-width="1.6" />
          </template>
          <template v-else-if="item.icon === 'shield'">
            <path d="M12 3 4.5 6v5.5c0 4.4 3.1 8.1 7.5 9.5 4.4-1.4 7.5-5.1 7.5-9.5V6z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
            <path d="m8.8 12 2.4 2.4 4.2-4.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </template>
          <template v-else>
            <path d="M4 5.5h16v10H9.5L5.5 19v-3.5H4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
          </template>
        </svg>
        <span>
          <span class="block text-[13px] leading-snug font-bold text-tertiary-50">{{ item.title }}</span>
          <span class="block text-[12px] leading-snug text-tertiary-800">{{ item.text }}</span>
        </span>
      </li>
    </ul>

    <!-- Cartes acceptées -->
    <div class="mt-4 flex flex-wrap items-center gap-2">
      <span class="text-[12px] text-tertiary-800">Paiement par carte :</span>
      <span
        v-for="brand in paymentBrands"
        :key="brand"
        class="rounded-md border border-tertiary-500/15 bg-primary px-2.5 py-1 text-[11px] font-bold tracking-wide text-tertiary-600"
      >
        {{ brand }}
      </span>
    </div>
  </div>
</template>
