const User = require("../models/User");

describe("User model helpers", () => {
  test("getStatus returns BLOCKED when the account is blocked", () => {
    const user = User.build({ is_blocked: true });

    expect(user.getStatus()).toBe("BLOCKED");
  });

  test("getStatus returns SUSPENDED when the suspension is still in effect", () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60); // one hour from now
    const user = User.build({ is_blocked: false, suspended_until: futureDate });

    expect(user.getStatus()).toBe("SUSPENDED");
  });

  test("getStatus returns ACTIVE when the account is neither blocked nor suspended", () => {
    const user = User.build({ is_blocked: false, suspended_until: null });

    expect(user.getStatus()).toBe("ACTIVE");
  });

  test("canPurchase denies purchases for blocked accounts with guidance", () => {
    const user = User.build({ is_blocked: true });

    expect(user.canPurchase()).toEqual({
      allowed: false,
      message: "Your account has been blocked. Please contact support.",
    });
  });

  test("canPurchase denies suspended accounts with formatted date", () => {
    const suspendedDate = new Date(2100, 0, 2);
    const user = User.build({
      is_blocked: false,
      suspended_until: suspendedDate,
    });

    const result = user.canPurchase();
    const formattedDate = suspendedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    expect(result.allowed).toBe(false);
    expect(result.message).toContain(`Your account is suspended until ${formattedDate}`);
  });

  test("canPurchase allows purchases for active accounts", () => {
    const user = User.build({ is_blocked: false, suspended_until: null });

    expect(user.canPurchase()).toEqual({ allowed: true });
  });
});
