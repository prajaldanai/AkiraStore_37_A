const Order = require("../models/Order");

describe("Order model metadata", () => {
  test("maps to orders table without timestamps and exposes indexes", () => {
    expect(Order.getTableName()).toBe("orders");
    expect(Order.options.timestamps).toBe(false);
    expect(Order.options.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fields: ["user_id"] }),
        expect.objectContaining({ fields: ["product_id"] }),
        expect.objectContaining({ fields: ["session_id"] }),
        expect.objectContaining({ fields: ["status"] }),
        expect.objectContaining({ fields: ["created_at"] }),
      ])
    );
  });

  test("applies sensible defaults for quantities and pricing metadata", () => {
    const order = Order.build({
      product_id: 1,
      product_name: "Sneaker",
      unit_price_snapshot: 99,
      shipping_type: "Inside Valley",
      subtotal: 99,
      total: 99,
      customer_email: "test@example.com",
      customer_first_name: "Jane",
      customer_last_name: "Doe",
      customer_province: "Province",
      customer_city: "City",
      customer_address: "123 Street",
      customer_phone: "1234567890",
    });

    expect(order.quantity).toBe(1);
    expect(order.status).toBe("PLACED");
    expect(order.shipping_charge_snapshot).toBe(0);
    expect(order.gift_box).toBe(false);
    expect(order.gift_box_fee).toBe(0);
    expect(order.bargain_discount).toBe(0);
    expect(order.tax_amount).toBe(0);
    expect(order.bargain_chat_log).toEqual([]);
  });
});

describe("Order model validation", () => {
  const baseOrder = {
    product_id: 11,
    product_name: "Sneaker",
    unit_price_snapshot: 99.9,
    shipping_type: "Inside Valley",
    subtotal: 99.9,
    total: 99.9,
    customer_email: "test@example.com",
    customer_first_name: "Jane",
    customer_last_name: "Doe",
    customer_province: "Province",
    customer_city: "City",
    customer_address: "123 Street",
    customer_phone: "1234567890",
  };

  test("validates a well-formed order", async () => {
    const order = Order.build(baseOrder);
    await expect(order.validate()).resolves.toBeDefined();
  });

  test("requires a product_id", async () => {
    const { product_id, ...payload } = baseOrder;
    const order = Order.build(payload);
    await expect(order.validate()).rejects.toThrow(/product_id/i);
  });

  test("requires a product_name", async () => {
    const { product_name, ...payload } = baseOrder;
    const order = Order.build(payload);

    await expect(order.validate()).rejects.toThrow(/product_name/i);
  });

  test("requires subtotal and total", async () => {
    const { subtotal, ...payloadA } = baseOrder;
    const orderWithoutSubtotal = Order.build(payloadA);
    await expect(orderWithoutSubtotal.validate()).rejects.toThrow(/subtotal/i);

    const { total, ...payloadB } = baseOrder;
    const orderWithoutTotal = Order.build(payloadB);
    await expect(orderWithoutTotal.validate()).rejects.toThrow(/total/i);
  });

  test("requires customer details", async () => {
    const { customer_email, ...payload } = baseOrder;
    const order = Order.build(payload);

    await expect(order.validate()).rejects.toThrow(/customer_email/i);
  });
});
