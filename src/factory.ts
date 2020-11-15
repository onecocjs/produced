import superagent from "superagent";
import { writeFileSync, readFileSync } from "fs";
import Mustache from "mustache";
import prettier from "prettier";
import { chain } from "lodash";
import { replaceAllGroup, convertType } from "./utils";
import { exec } from "child_process";

const $REF = "$ref";

function refLastNodeName(path: string) {
  if (path.startsWith("#")) {
    return chain(path).split("/").last().value();
  } else {
    throw new Error("非法的ref路径！");
  }
}

export async function fetchApiJsonSchemas(params) {
  const swagger = await superagent
    .get(params.url)
    .send()
    .then(({ text }) => text)
    .then(JSON.parse);
  return swagger;

  return {
    getSchemas: async function () {
      exec("rm -rf /Users/ityuany/GitRepository/produced/services/bean/*");
      exec("rm -rf /Users/ityuany/GitRepository/produced/services/*.ts");

      const i = await readFileSync("template/interface.mu", "utf-8");
      const operationsTemplate = await readFileSync(
        "template/operations.mu",
        "utf-8"
      );

      chain(swagger.components.schemas)
        .entries()
        .forEach(([, n]) => {
          const interfaceName = replaceAllGroup(n.title, [
            [/«/g, "Of"],
            [/»/g, ""],
          ]);
          if (n.type === "object") {
            const res = Mustache.render(i, {
              description: n.description,
              name: interfaceName,
              fields: chain(n.properties)
                .entries()
                .map(([fk, fn]) => {
                  const field = {
                    description: fn.description,
                    name: replaceAllGroup(fk, [
                      [/«/g, "Of"],
                      [/»/g, ""],
                    ]),
                    type: convertType(fn.type),
                  };

                  if (fn.type === "array") {
                    if (fn.items[$REF]) {
                      return {
                        ...field,
                        type: `${refLastNodeName(fn.items[$REF])}[]`,
                      };
                    }
                    return {
                      ...field,
                      type: `${convertType(fn.items.type)}[]`,
                    };
                  }
                  if (fn[$REF]) {
                    return {
                      ...field,
                      type: replaceAllGroup(refLastNodeName(fn[$REF]), [
                        [/«/g, "Of"],
                        [/»/g, ""],
                      ]),
                    };
                  }

                  return field;
                })
                .value(),
            });

            writeFileSync(
              `services/bean/${interfaceName}.d.ts`,
              prettier.format(res)
            );
          }
        })
        .value();

      const operationsMap = chain(swagger.paths)
        .entries()
        .map(([k, v]) => {
          return chain(v)
            .mapValues()
            .map((o) => ({ ...o, path: k, tag: o.tags[0] }))
            .value();
        })
        .flatMap()
        .groupBy((n) => n.tag)
        .value();

      chain(operationsMap)
        .entries()
        .forEach(([k, v]) => {
          const ss = v["map"]((n) => ({
            url: n.path,
            description: n.summary,
            name: n.operationId,
            request: n?.requestBody?.content?.["application/json"]?.schema?.[
              $REF
            ]
              ? replaceAllGroup(
                  refLastNodeName(
                    n.requestBody.content["application/json"].schema[$REF]
                  ),
                  [
                    [/«/g, "Of"],
                    [/»/g, ""],
                  ]
                )
              : null,
            response: n?.responses?.[200]?.content?.["*/*"]?.schema?.[$REF]
              ? replaceAllGroup(
                  refLastNodeName(n.responses[200].content["*/*"].schema[$REF]),
                  [
                    [/«/g, "Of"],
                    [/»/g, ""],
                  ]
                )
              : null,
          }));

          writeFileSync(
            `services/${k}Services.ts`,
            prettier.format(
              "let fetchGet:any = null" +
                Mustache.render(operationsTemplate, { operations: ss })
            )
          );
        })
        .value();
    },
  };
}
