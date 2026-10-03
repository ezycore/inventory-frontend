// coding-standard: maintained
/**
 * The running release, as the merchant sees it in the user menu ("v1.0.0 ·
 * 9c82627"). The version is package.json's, filled in by next.config.mjs at
 * build; the commit is the Docker build arg from deploy.yml, absent locally.
 * Support asks for this line — it is how "which build are you on?" is answered.
 */
const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "";
const commit = (process.env.NEXT_PUBLIC_GIT_SHA ?? "").slice(0, 7);

export const APP_VERSION_LABEL = version
  ? [`v${version}`, commit].filter(Boolean).join(" · ")
  : "";
