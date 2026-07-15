// coding-standard: maintained
/**
 * CI gate: the generated API types (`types/api-generated.ts`) must be in sync with the backend
 * OpenAPI spec they are derived from.
 *
 * Why this exists
 * ---------------
 * `types/api-generated.ts` is produced by `pnpm gen:api-types` from the backend's
 * `docs/reference/openapi.json` (itself emitted from the tested response DTOs). The frontend service
 * modules are typed off it, so a *stale* generated file is the exact failure this whole effort
 * removes: the backend changes a response shape, the frontend keeps compiling against the old types,
 * and the drift is invisible until it breaks in the browser. This gate regenerates the types into a
 * temp file and fails if they differ from what is committed — turning "forgot to regenerate" into a
 * red build instead of a silent bug.
 *
 * The check needs the backend repo checked out beside this one (the default local + monorepo layout).
 * When the spec is absent (an isolated frontend checkout) it skips rather than fails, so it never
 * blocks a build that has no backend to compare against.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SPEC = "../easystock-backend/docs/reference/openapi.json";
const GENERATED = "types/api-generated.ts";
const REGEN_CMD = "pnpm gen:api-types";

if (!existsSync(SPEC)) {
  console.warn(
    `⚠ Skipping API-types check: backend spec not found at ${SPEC}.\n` +
      "  (Expected the easystock-backend repo checked out beside this one.)",
  );
  process.exit(0);
}

const tmpFile = join(tmpdir(), `api-generated.check.${process.pid}.ts`);

let fresh;
try {
  execFileSync("pnpm", ["exec", "openapi-typescript", SPEC, "-o", tmpFile], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  fresh = readFileSync(tmpFile, "utf8");
} catch (error) {
  console.error("✖ Failed to generate API types from the backend spec.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
} finally {
  rmSync(tmpFile, { force: true });
}

const current = existsSync(GENERATED) ? readFileSync(GENERATED, "utf8") : "";

if (fresh !== current) {
  console.error(
    `✖ ${GENERATED} is out of date with the backend OpenAPI spec.\n` +
      "  The backend response contract changed but the frontend types were not regenerated,\n" +
      "  so the service modules are typed against a stale shape.\n" +
      `  Fix:  ${REGEN_CMD}   then commit the result.`,
  );
  process.exit(1);
}

console.log("✓ API types are in sync with the backend contract.");
