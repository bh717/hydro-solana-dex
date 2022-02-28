import { lazy, accounts, withAccounts, inject } from "./meta-utils";
describe("meta-utils", () => {
  test("lazy objects", () => {
    const obj = lazy({ alien: () => "👾", fondue: () => "🧀" });

    expect(obj.alien).toEqual("👾");
    expect(obj.fondue).toEqual("🧀");
  });

  test("accounts resolve to lazy objects", () => {
    const getter = accounts(() => ({
      alien: () => "👾",
      fondue: () => "🧀",
    }));

    const obj = getter({} as any);
    expect(obj.alien).toEqual("👾");
    expect(obj.fondue).toEqual("🧀");
  });

  test("withAccounts gets accounts", () => {
    const obj = withAccounts(
      { bar: "hello" },
      () =>
        lazy({
          alien: () => "👾",
          fondue: () => "🧀",
        }),
      {} as any
    );

    expect(obj.accounts.alien).toBe("👾");
    expect(obj.accounts.fondue).toBe("🧀");
  });

  test("inject", () => {
    const obj = inject(
      {
        foo(bar: number) {
          return () => bar * 100;
        },
        alien() {
          return () => "👾";
        },
      },
      2
    );
    expect(obj.foo()).toBe(200);
    expect(obj.alien()).toBe("👾");
  });
});
