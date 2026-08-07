export interface NavItem {
  label: string
  to: string
  /** Ligne de contexte affichée sous le libellé dans un méga-menu. */
  description?: string
  /** Lien externe : ouvre dans un nouvel onglet. */
  external?: boolean
  /** Sous-menu éventuel (méga-menu). */
  children?: NavItem[]
}
