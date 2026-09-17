// coding-standard: maintained

/**
 * Whether the person editing a role may TICK a permission. Mirrors the backend's
 * `customRoleService.resolvePermissions`, which clamps only what a save ADDS:
 *
 * - a permission the editor holds — grantable;
 * - one the role already held when the form opened — keeping it grants nobody
 *   anything, so it may be unticked and ticked back;
 * - anything else — refused by the API (`PERMISSION_NOT_GRANTABLE`), so the
 *   checkbox is locked instead of letting the editor build a save that fails.
 *
 * Unticking is never locked: removing a permission narrows the role.
 */
export function canTickPermission(
  permission: string,
  editorPermissions: ReadonlySet<string>,
  originalPermissions: ReadonlySet<string>,
): boolean {
  return editorPermissions.has(permission) || originalPermissions.has(permission);
}
