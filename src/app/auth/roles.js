export const PLATFORM_ROLES = {
  // === V1 : 3 profils actifs ===
  visitor: 'visitor',             // Visiteur non connecté
  visiteurConnecte: 'citizen',    // Visiteur connecté (accès dashboard)
  sysCollaborator: 'sys_collaborator', // Collaborateur Admin
  sysAdmin: 'sys_admin',          // Admin Système

  // === V2+ : roles futurs (inactifs en V1) ===
  citizen: 'citizen',
  member: 'member',
  editor: 'editor',
  orgAdmin: 'org_admin',
}

export const ROLE_DETAILS = {
  // === V1 profils ===
  [PLATFORM_ROLES.visitor]: {
    label: 'Visiteur',
    profile: 'Public',
    version: 'v1',
  },
  citizen: {
    label: 'Visiteur (connecté)',
    profile: 'Public',
    version: 'v1',
  },
  [PLATFORM_ROLES.sysCollaborator]: {
    label: 'Collaborateur Admin',
    profile: 'CITADEL',
    version: 'v1',
  },
  [PLATFORM_ROLES.sysAdmin]: {
    label: 'Admin Système',
    profile: 'CITADEL',
    version: 'v1',
  },

  // === V2+ roles futurs ===
  org_admin: {
    label: 'Admin Org',
    profile: 'Organisation',
    version: 'v2',
  },
  member: {
    label: 'Membre',
    profile: 'Organisation',
    version: 'v2',
  },
  editor: {
    label: 'Editeur',
    profile: 'Organisation',
    version: 'v2',
  },
}

export const PERMISSION_DETAILS = {
  view_visualizations: { label: 'Voir visualisations', category: 'Consultation' },
  download_public_data: { label: 'Télécharger données publiques', category: 'Consultation' },
  search_datasets: { label: 'Rechercher datasets', category: 'Consultation' },
  view_organizations: { label: 'Consulter organisations', category: 'Consultation' },
  contact_form: { label: 'Formulaire contact', category: 'Consultation' },
  newsletter: { label: 'Newsletter', category: 'Consultation' },
  dashboard_settings: { label: 'Dashboard + paramètres', category: 'Dashboard' },
  request_org_membership: { label: 'Demander adhésion org', category: 'Organisation' },
  request_org_creation: { label: 'Demander création org', category: 'Organisation' },
  view_private_org_data: { label: 'Voir données privées org', category: 'Organisation' },
  bulk_messages: { label: 'Messages groupés', category: 'Collaboration' },
  manage_datasets: { label: 'Gérer datasets', category: 'Production' },
  validate_org_submissions: { label: 'Valider soumissions org', category: 'Validation' },
  manage_org_members: { label: 'Gérer membres org', category: 'Validation' },
  validate_citadel_submissions: { label: 'Valider soumissions CITADEL', category: 'CITADEL' },
  create_visualizations: { label: 'Créer visualisations', category: 'CITADEL' },
  manage_references: { label: 'Gérer référentiels', category: 'CITADEL' },
  citadel_dashboard: { label: 'Dashboard CITADEL', category: 'CITADEL' },
  validate_org_creation: { label: 'Valider création org', category: 'Administration système' },
  suspend_any_role: { label: 'Suspendre tout rôle', category: 'Administration système' },
  manage_collaborators: { label: 'Gérer collaborateurs', category: 'Administration système' },
  configure_platform: { label: 'Configurer plateforme', category: 'Administration système' },
  global_statistics: { label: 'Statistiques globales', category: 'Administration système' },
}

const BASE_CONSULTATION_PERMISSIONS = {
  view_visualizations: true,
  download_public_data: true,
  search_datasets: true,
  view_organizations: true,
  contact_form: true,
  newsletter: true,
}

const ROLE_PERMISSIONS = {
  [PLATFORM_ROLES.visitor]: {
    ...BASE_CONSULTATION_PERMISSIONS,
  },
  [PLATFORM_ROLES.citizen]: {
    ...BASE_CONSULTATION_PERMISSIONS,
    dashboard_settings: true,
    request_org_membership: true,
    request_org_creation: true,
  },
  [PLATFORM_ROLES.member]: {
    ...BASE_CONSULTATION_PERMISSIONS,
    dashboard_settings: true,
    view_private_org_data: true,
    bulk_messages: true,
  },
  [PLATFORM_ROLES.editor]: {
    ...BASE_CONSULTATION_PERMISSIONS,
    dashboard_settings: true,
    view_private_org_data: true,
    bulk_messages: true,
    manage_datasets: true,
  },
  [PLATFORM_ROLES.orgAdmin]: {
    ...BASE_CONSULTATION_PERMISSIONS,
    dashboard_settings: true,
    view_private_org_data: true,
    bulk_messages: true,
    manage_datasets: true,
    validate_org_submissions: true,
    manage_org_members: true,
  },
  [PLATFORM_ROLES.sysCollaborator]: {
    ...BASE_CONSULTATION_PERMISSIONS,
    dashboard_settings: true,
    view_private_org_data: true,
    manage_datasets: true,
    validate_citadel_submissions: true,
    create_visualizations: true,
    manage_references: true,
    citadel_dashboard: true,
  },
  [PLATFORM_ROLES.sysAdmin]: {
    ...BASE_CONSULTATION_PERMISSIONS,
    dashboard_settings: true,
    view_private_org_data: true,
    bulk_messages: true,
    manage_datasets: true,
    validate_org_submissions: true,
    manage_org_members: true,
    validate_citadel_submissions: true,
    create_visualizations: true,
    manage_references: true,
    citadel_dashboard: true,
    validate_org_creation: true,
    suspend_any_role: true,
    manage_collaborators: true,
    configure_platform: true,
    global_statistics: true,
  },
}

const ROLE_ALIASES = {
  visiteur: PLATFORM_ROLES.visitor,
  visitor: PLATFORM_ROLES.visitor,
  citoyen: PLATFORM_ROLES.citizen,
  citizen: PLATFORM_ROLES.citizen,
  membre: PLATFORM_ROLES.member,
  member: PLATFORM_ROLES.member,
  editeur: PLATFORM_ROLES.editor,
  editor: PLATFORM_ROLES.editor,
  'admin org': PLATFORM_ROLES.orgAdmin,
  admin_org: PLATFORM_ROLES.orgAdmin,
  org_admin: PLATFORM_ROLES.orgAdmin,
  'collab admin sys': PLATFORM_ROLES.sysCollaborator,
  collab_admin_sys: PLATFORM_ROLES.sysCollaborator,
  sys_collaborator: PLATFORM_ROLES.sysCollaborator,
  'admin sys': PLATFORM_ROLES.sysAdmin,
  admin_sys: PLATFORM_ROLES.sysAdmin,
  sys_admin: PLATFORM_ROLES.sysAdmin,
}

export function normalizeRole(roleValue, isConnected = false) {
  const raw = String(roleValue || '').trim().toLowerCase()
  const normalized = ROLE_ALIASES[raw]

  if (normalized) return normalized
  // Visiteur non connecté → visitor ; Visiteur connecté sans rôle explicite → citizen (dashboard)
  return isConnected ? 'citizen' : PLATFORM_ROLES.visitor
}

export function getRoleDetails(roleValue, isConnected = false) {
  const role = normalizeRole(roleValue, isConnected)
  return {
    key: role,
    ...(ROLE_DETAILS[role] || ROLE_DETAILS[PLATFORM_ROLES.visitor]),
  }
}

export function getRolePermissions(roleValue, isConnected = false) {
  const role = normalizeRole(roleValue, isConnected)
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[PLATFORM_ROLES.visitor]
}

export function hasRolePermission(roleValue, permission, isConnected = false) {
  const permissions = getRolePermissions(roleValue, isConnected)
  return Boolean(permissions[permission])
}

export function getAllowedPermissionEntries(roleValue, isConnected = false) {
  const permissions = getRolePermissions(roleValue, isConnected)
  return Object.keys(PERMISSION_DETAILS)
    .filter((permission) => permissions[permission])
    .map((permission) => ({
      key: permission,
      ...PERMISSION_DETAILS[permission],
    }))
}

// === V1 : seulement les 3 profils actifs ===
export const ROLE_SWITCH_OPTIONS = [
  { value: 'citizen', label: 'Visiteur (connecté)' },
  { value: PLATFORM_ROLES.sysCollaborator, label: 'Collaborateur Admin' },
  { value: PLATFORM_ROLES.sysAdmin, label: 'Admin Système' },
]
