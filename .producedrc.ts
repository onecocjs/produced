function define(data) {}

module.exports = {
  server: `http://127.0.0.1:8888/v3/api-docs`,
  imports: [`import { fetchGet, fetchPostOfJsonBody } from '@/common/fetch'`],
  functionDefineTemplate: {
    get: `fetchGet`,
    post: `fetchPostOfJsonBody`,
  },
  output: "src/services",
};
