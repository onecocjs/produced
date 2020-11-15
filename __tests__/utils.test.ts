import { replaceAll, replaceAllGroup } from "../src/utils";

describe("replace测试", function () {
  it("replaceAll", function () {
    const name = "PageInfo«D«ev«ic«eE«ntity";
    expect(replaceAll(name, /«/g, "")).toEqual("PageInfoDeviceEntity");
  });

  it("x", function () {
    const name = "PageInfo«DeviceEntity»";

    expect(
      replaceAllGroup(name, [
        [/«/g, "Of"],
        [/»/g, ""],
      ])
    ).toEqual("PageInfoOfDeviceEntity");
  });
});
