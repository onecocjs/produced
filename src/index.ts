import { fetchApiJsonSchemas } from "./factory";
import { readFileSync } from "fs";
import { ensureDirSync, ensureFileSync, writeFileSync } from "fs-extra";
import { chain, merge, entries, values } from "lodash";
import Mustache from "mustache";
import prettier from "prettier";
import { replaceAllGroup, convertType } from "./utils";

export async function run() {
  const config = await require(`${process.cwd()}/.producedrc.ts`);

  const swagger = await fetchApiJsonSchemas({
    url: config.server,
  });

  const schemas = swagger.components.schemas;
  const paths = swagger.paths;
  const tags = swagger.tags.map((n) => n.name);

  const res = chain(schemas).values().map(getDefine).value();
  const api = findApi(paths);

  chain(res)
    .forEach((n) => {
      const serviceFilePath = `${process.cwd()}/${config.output}/schemas/${
        n.name
      }.d.ts`;

      ensureFileSync(serviceFilePath);
      writeFileSync(serviceFilePath, n.formatCode);
    })
    .value();

  chain(tags)
    .forEach((tag) => {
      const serviceFilePath = `${process.cwd()}/${
        config.output
      }/${tag}Services.ts`;
      const t = `
        ${config.imports.join("\r\n")}
        {{#operations}}
          {{#description}}
          /** {{description}} */
          {{/description}}
          export function {{name}}(
              {{#request}}
              params:{{request}}
              {{/request}}
          )
          {
              return {{fn}}{{#response}}<{{{response}}}>{{/response}} ('{{{url}}}'
                  {{#request}}
                  ,params
                  {{/request}})
          }
        {{/operations}}
      `;

      const fns = api[tag].map(
        ({ summary, operationId, requestBody, url, responses, method }) => {
          return {
            description: summary,
            name: operationId,
            url: url,
            fn: config.functionDefineTemplate[method],
            request: requestBody?.content
              ? getRefName(requestBody.content["application/json"].schema.$ref)
              : null,
            response: responses?.[200]?.content
              ? getRefName(responses[200].content["*/*"].schema.$ref)
              : null,
          };
        }
      );
      const code = Mustache.render(t, { operations: fns });
      const formatCode = prettier.format(code);

      writeFileSync(serviceFilePath, code);
    })
    .value();

  ensureDirSync(`${process.cwd()}/${config.output}`);
}

function findApi(paths) {
  return chain(paths)
    .entries()
    .map(([requestUrl, requestMethodMap]) => {
      return chain(requestMethodMap)
        .entries()
        .map(([requestMethod, requestMeta]) => ({
          ...requestMeta,
          method: requestMethod,
          url: requestUrl,
        }))
        .value();
    })
    .reduce((prev, next) => [...prev, ...next], [])
    .groupBy((n) => n.tags[0])
    .value();
}

function getDefine({ title, required, properties, description }) {
  const t = `
  {{#description}}
  /** {{description}} */
  {{/description}}
  interface {{name}} {
      {{#fields}}
          {{#description}}
          /** {{description}} */
          {{/description}}
          {{name}}:{{type}};
      {{/fields}}
  }`;

  const fields = getFields(properties, required);
  const _name = rename(title);
  const code = Mustache.render(t, {
    description,
    name: _name,
    fields,
  });
  const formatCode = prettier.format(code);
  return { name: _name, formatCode };
}

function getRefName(path: string) {
  if (path.startsWith("#")) {
    return chain(path).split("/").last().thru(rename).value();
  } else {
    throw new Error("非法的ref路径！");
  }
}

function rename(name: string): string {
  return replaceAllGroup(name, [
    [/«/g, "Of"],
    [/»/g, ""],
  ]);
}

function getFields(properties, required = []) {
  return chain(properties)
    .entries()
    .map(([name, { description, type, $ref, items }]) => {
      let field = {
        name: rename(name),
        description,
        type,
        required: required.some((n) => n === name),
      };

      if (type === "array" && items) {
        if (items.type) {
          field.type = `${items.type}[]`;
        } else {
          field.type = `${getRefName(items.$ref)}[]`;
        }
      } else if ($ref) {
        field.type = `${getRefName($ref)}[]`;
      } else {
        field.type = convertType(type);
      }
      return field;
    })
    .value();
}
