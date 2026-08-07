<script setup lang="ts">
/** Bouton polymorphe : rend un <NuxtLink>, un <a> ou un <button> selon les props. */
const props = withDefaults(defineProps<{
  to?: string
  href?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit'
  disabled?: boolean
  block?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})

const tag = computed(() => (props.to ? resolveComponent('NuxtLink') : props.href ? 'a' : 'button'))
</script>

<template>
  <component
    :is="tag"
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`, { 'btn--block': block }]"
    :to="to"
    :href="href"
    :type="to || href ? undefined : type"
    :disabled="to || href ? undefined : disabled"
    :aria-disabled="disabled || undefined"
  >
    <slot />
  </component>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  font-weight: 600;
  text-align: center;
  transition: background var(--transition), color var(--transition), border-color var(--transition), transform var(--transition);
}

.btn:hover { transform: translateY(-1px); }
.btn[disabled],
.btn[aria-disabled='true'] { opacity: 0.55; pointer-events: none; }

.btn--sm { padding: var(--space-2) var(--space-4); font-size: var(--text-sm); }
.btn--md { padding: var(--space-3) var(--space-6); font-size: var(--text-base); }
.btn--lg { padding: var(--space-4) var(--space-8); font-size: var(--text-lg); }
.btn--block { display: flex; width: 100%; }

.btn--primary {
  background: var(--color-brand-500);
  color: #fff;
}
.btn--primary:hover { background: var(--color-brand-600); }

.btn--secondary {
  background: var(--color-surface);
  color: var(--color-ink);
  border-color: var(--color-line);
}
.btn--secondary:hover { border-color: var(--color-brand-500); color: var(--color-brand-600); }

.btn--ghost {
  background: transparent;
  color: var(--color-brand-600);
}
.btn--ghost:hover { background: var(--color-brand-50); }
</style>
