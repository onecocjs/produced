import { fetchApiJsonSchemas } from "./factory";
import { writeSchemas } from "./io";

async function run() {
  const res = await fetchApiJsonSchemas({
    url: "http://127.0.0.1:8888/v3/api-docs",
  });

  res.getSchemas();
}

run();
