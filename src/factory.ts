import superagent from "superagent";
import { writeFileSync, readFileSync } from "fs";
import Mustache from "mustache";
import prettier from "prettier";

const $REF = "$ref";

export interface FetchSwaggerSchemas {
  url: string;
}

declare namespace Swagger {
  type SchemasType = "string" | "object" | "integer" | "array";

  interface SchemasProperties {
    type: SchemasType;
  }

  interface Schemas {
    title: "string";
    type: SchemasType;
    required?: string[];
    properties?: {
      type: SchemasType;
      description: string;
    };
  }
}

export function hasRefObjectFn(target: any = {}) {
  return Object.entries(target).some(([k, v]) => k === $REF || v[$REF]);
}

export function hasRefArrayFn(target: any = {}) {
  return Object.entries(target).some(
    ([k, v]) => (k === "items" && v[$REF]) || (v["items"] && v["items"][$REF])
  );
}

export function convertType(type: string) {
  switch (type) {
    case "integer":
      return "number";
    case "array":
      return "[]";
    default:
      return type;
  }
}

export async function fetchApiJsonSchemas(params: FetchSwaggerSchemas) {
  const {
    components: { schemas },
  } = await superagent
    .get(params.url)
    .send()
    .then(({ text }) => text)
    .then(JSON.parse);

  function getAtomSchemas() {
    return Object.entries(schemas)
      .filter(([k, v]: [string, Swagger.Schemas]) => {
        if (JSON.stringify(v?.properties ?? {}).includes($REF)) {
          return false;
        }
        // if (hasRefObjectFn(v?.properties ?? {})) {
        //   return false;
        // }
        // if (hasRefArrayFn(v?.properties ?? {})) {
        //   return false;
        // }
        return true;
      })
      .map(([k, v]) => ({ [k]: v }))
      .reduce((prev, next) => ({ ...prev, ...next }), {});
  }

  return {
    getSchemas: async function () {
      const t = await readFileSync("template/properties", "utf-8");
      const i = await readFileSync("template/interface", "utf-8");

      Object.entries(getAtomSchemas()).forEach(([k, v]: [string, any]) => {
        const fields = Object.entries(v?.properties ?? {}).map(
          ([nk, nv]: [string, any]) => ({
            description: nv.description,
            name: nk.replace(/«/g, "").replace(/»/g, ""),
            type: convertType(nv.type),
          })
        );

        const code = Mustache.render(i, {
          description: v.description,
          name: k.replace(/«/g, "").replace(/»/g, ""),
          fields,
        });

        writeFileSync(
          `services/bean/${k.replace(/«/g, "").replace(/»/g, "")}.d.ts`,
          prettier.format(code)
        );
      });
    },
  };
}
