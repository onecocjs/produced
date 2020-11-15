import { defineRollupConfigura } from "@dura/lub";

export default defineRollupConfigura({
  name: "api",
  format: "cjs",
  external: ["superagent", "prettier", "fs", "child_process", "fs-extra"],
});
