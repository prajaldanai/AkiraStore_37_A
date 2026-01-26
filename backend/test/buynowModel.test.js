const BuyNowSession = require("../models/BuyNowSession");

describe("BuyNowSession model metadata", () => {
  test("maps to the buy_now_sessions table without timestamps and exposes indexes", () => {
    expect(BuyNowSession.getTableName()).toBe("buy_now_sessions");
    expect(BuyNowSession.options.timestamps).toBe(false);
    expect(BuyNowSession.options.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fields: ["user_id"] }),
        expect.objectContaining({ fields: ["product_id"] }),
        expect.objectContaining({ fields: ["status"] }),
      ])
    );
  });

  test("applies defaults for quantity, status, and shipping options", () => {
    const session = BuyNowSession.build({
      product_id: 1,
      product_name: "Sneaker",
      unit_price: 79.99,
    });

    expect(session.quantity).toBe(1);
    expect(session.status).toBe("active");
    expect(session.shipping_options).toEqual([]);
  });
});

describe("BuyNowSession validation", () => {
  const minimalPayload = {
    product_id: 5,
    product_name: "Sneaker",
    unit_price: 79.99,
  };

  test("allows a valid payload", async () => {
    const session = BuyNowSession.build(minimalPayload);

    await expect(session.validate()).resolves.toBeDefined();
  });

  test("requires a product_id", async () => {
    const invalidPayload = { ...minimalPayload, product_id: null };
    const session = BuyNowSession.build(invalidPayload);

    await expect(session.validate()).rejects.toThrow(/product_id/i);
  });

  test("requires a product_name", async () => {
    const { product_name, ...payload } = minimalPayload;
    const session = BuyNowSession.build(payload);

    await expect(session.validate()).rejects.toThrow(/product_name/i);
  });

  test("requires a unit_price", async () => {
    const { unit_price, ...payload } = minimalPayload;
    const session = BuyNowSession.build(payload);

    await expect(session.validate()).rejects.toThrow(/unit_price/i);
  });
});
