<script setup lang="ts">
import { headerCta, mainNavigation } from '~/config/navigation'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { locked } = useScrollLock()
const { label: cityLabel, detectLabel, city, cities, select, detect } = useCitySelector()
const categoriesOpen = ref(false)
const cityOpen = ref(false)

function selectCity(name: string) {
  select(name)
  cityOpen.value = false
}

const drawerLink = 'rounded-btn px-3.5 py-3 text-[15px] font-medium uppercase underline-offset-8 decoration-2 transition-colors hover:bg-tertiary-500/6'

watch(() => props.open, (open) => {
  locked.value = open
  if (!open) {
    categoriesOpen.value = false
    cityOpen.value = false
  }
})

onMounted(() => {
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.open) emit('close')
  }
  window.addEventListener('keydown', onKeydown)
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity" leave-active-class="transition-opacity"
      enter-from-class="opacity-0" leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-60 bg-black/60 nav:hidden" @click="emit('close')" />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      leave-active-class="transition-transform duration-200 ease-in"
      enter-from-class="translate-x-full" leave-to-class="translate-x-full"
    >
      <div
        v-if="open"
        class="fixed inset-y-0 right-0 z-61 flex w-[min(320px,85vw)] flex-col bg-primary text-tertiary-500 shadow-[-12px_0_40px_rgba(0,0,0,0.5)] nav:hidden"
      >
        <div class="flex items-center justify-between border-b border-tertiary-500/10 px-5 py-3">
          <img src="/images/logos/dzuvo.png" alt="DZUVO" width="40" height="40" class="h-10 w-auto">
          <button
            class="size-11 rounded-btn text-[22px] text-tertiary-500 transition-colors hover:bg-tertiary-500/6"
            type="button"
            aria-label="Fermer"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <!-- Ville de livraison : sur mobile, elle vit ici plutôt que dans la barre. -->
        <div class="border-b border-tertiary-500/10 p-2">
          <button
            class="flex w-full items-center gap-2.5 rounded-btn px-3.5 py-3 text-left text-sm font-medium text-tertiary-500 transition-colors hover:bg-tertiary-500/6"
            type="button"
            :aria-expanded="cityOpen"
            @click="cityOpen = !cityOpen"
          >
            <svg class="shrink-0 text-secondary" width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden="true">
              <path d="M7 15s5.5-4.6 5.5-8.5a5.5 5.5 0 10-11 0C1.5 10.4 7 15 7 15z" stroke="currentColor" stroke-width="1.5" />
              <circle cx="7" cy="6.5" r="2" stroke="currentColor" stroke-width="1.5" />
            </svg>
            <span class="flex-1 truncate">{{ cityLabel }}</span>
            <svg
              class="shrink-0 transition-transform"
              :class="cityOpen ? 'rotate-180' : ''"
              width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"
            >
              <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </button>

          <div v-if="cityOpen" class="flex flex-col pt-1">
            <button
              class="flex items-center gap-2 rounded-btn px-3.5 py-2.5 text-left text-sm font-bold text-secondary transition-colors hover:bg-tertiary-500/6"
              type="button"
              @click="detect"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" stroke-width="1.5" />
                <circle cx="7.5" cy="7.5" r="1.6" fill="currentColor" />
                <path d="M7.5 0v3M7.5 12v3M0 7.5h3M12 7.5h3" stroke="currentColor" stroke-width="1.5" />
              </svg>
              {{ detectLabel }}
            </button>

            <button
              v-for="option in cities"
              :key="option.name"
              class="rounded-btn px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-tertiary-500/6"
              :class="option.name === city ? 'font-bold text-secondary' : 'text-primary-light'"
              type="button"
              @click="selectCity(option.name)"
            >
              {{ option.name }}
            </button>
          </div>
        </div>

        <nav class="flex flex-1 flex-col overflow-y-auto p-2" aria-label="Menu mobile">
          <template v-for="item in mainNavigation" :key="item.to">
            <template v-if="item.children?.length">
              <button
                class="flex items-center justify-between text-left text-tertiary-500"
                :class="drawerLink"
                type="button"
                :aria-expanded="categoriesOpen"
                @click="categoriesOpen = !categoriesOpen"
              >
                {{ item.label }}
                <svg
                  class="transition-transform"
                  :class="categoriesOpen ? 'rotate-180' : ''"
                  width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"
                >
                  <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
              </button>

              <div v-if="categoriesOpen" class="flex flex-col pl-3">
                <NuxtLink
                  v-for="category in item.children"
                  :key="category.to"
                  :to="category.to"
                  class="rounded-btn px-3.5 py-2.5 text-sm text-tertiary-800 transition-colors hover:bg-tertiary-500/6 hover:text-secondary"
                  @click="emit('close')"
                >
                  {{ category.label }}
                </NuxtLink>
              </div>
            </template>

            <NuxtLink
              v-else
              :to="item.to"
              :class="[drawerLink, 'text-tertiary-500 [&.router-link-exact-active]:text-tertiary-50 [&.router-link-exact-active]:underline [&.router-link-exact-active]:decoration-tertiary-50']"
              @click="emit('close')"
            >
              {{ item.label }}
            </NuxtLink>
          </template>
        </nav>

        <div class="flex flex-col gap-2.5 border-t border-tertiary-500/10 px-5 py-4">
          <NuxtLink
            v-if="headerCta"
            :to="headerCta.to"
            class="btn-primary justify-center"
            @click="emit('close')"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M14 7.7A6 6 0 012.6 12L1 15l1.7-4.3A6 6 0 1114 7.7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            </svg>
            {{ headerCta.label }}
          </NuxtLink>

          <NuxtLink
            to="/connexion"
            class="rounded-btn p-2.5 text-center text-sm font-medium text-tertiary-500 transition-colors hover:text-secondary"
            @click="emit('close')"
          >
            Mon compte
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
