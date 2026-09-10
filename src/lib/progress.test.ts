import { describe, it, expect } from "vitest";
import { parseProgress, parseRoute, remainingSeconds } from "./progress";
import { courses } from "../data/courses";
import { resources } from "../data/resources";
describe("课程内容完整性", () => {
  it("所有步骤资源可定位且评分总权重为 100", () => {
    for (const course of courses) {
      expect(course.rubric.reduce((sum, row) => sum + row.weight, 0)).toBe(100);
      expect(new Set(course.steps.map((s) => s.id)).size).toBe(
        course.steps.length,
      );
      for (const step of course.steps) {
        expect(step.checks.length).toBeGreaterThan(0);
        if (step.resource)
          expect(resources.some((r) => r.id === step.resource)).toBe(true);
      }
    }
  });
});
describe("恢复与边界", () => {
  it("损坏保存不伪造成功", () => {
    expect(() => parseProgress("{broken")).toThrow();
  });
  it("只保留允许的数据类型", () => {
    expect(
      parseProgress('{"checks":{"a":true,"b":"true"},"notes":{"x":3}}').checks,
    ).toEqual({ a: true });
  });
  it("错误路由退回有效范围", () => {
    expect(parseRoute("#/unknown/-1/NaN", ["agent"])).toEqual({
      courseId: "",
      stage: 0,
      step: 0,
    });
  });
  it("浏览器挂起后的计时按真实截止时间计算", () => {
    expect(remainingSeconds(65000, 64001)).toBe(1);
    expect(remainingSeconds(65000, 90000)).toBe(0);
  });
});
