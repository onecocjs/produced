import superagent from "superagent";
import { chain } from "lodash";

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
}
