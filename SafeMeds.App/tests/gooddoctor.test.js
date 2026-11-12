const express = require("express");
const request = require("supertest");

describe("POST /api/gooddoctor/chat", () => {
  const originalApiKey = process.env.GROQ_API_KEY;
  const originalModel = process.env.AI_MODEL;
  const originalFetch = global.fetch;
  let app;

  beforeEach(() => {
    jest.resetModules();
    process.env.GROQ_API_KEY = "test-only-key";
    process.env.AI_MODEL = "unit-test-model";
    global.fetch = jest.fn().mockImplementation(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => ({
        choices: [{ message: { content: "General health guidance." } }],
      }),
      text: async () =>
        JSON.stringify({
          choices: [{ message: { content: "General health guidance." } }],
        }),
    }));
    app = express();
    app.use(express.json());
    app.use("/api/gooddoctor", require("../server/routes/gooddoctor"));
  });

  afterAll(() => {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalApiKey;
    if (originalModel === undefined) delete process.env.AI_MODEL;
    else process.env.AI_MODEL = originalModel;
  });

  it("uses Groq with a bounded, mapped conversation and returns its reply", async () => {
    const messages = [
      { role: "user", content: "discarded older context" },
      { role: "user", content: "x".repeat(1100) },
      ...Array.from({ length: 8 }, (_, index) => ({
        role: "assistant",
        content: `Assistant reply ${index}`,
      })),
      { role: "user", content: "What should I do?" },
    ];

    const response = await request(app)
      .post("/api/gooddoctor/chat")
      .send({ messages });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ reply: "General health guidance." });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    const headers = options?.headers || {};
    const authHeader =
      headers instanceof Headers
        ? headers.get("Authorization")
        : headers.Authorization;
    expect(authHeader).toBe("Bearer test-only-key");

    const payload = JSON.parse(options.body);
    expect(payload.model).toBe("unit-test-model");
    expect(payload.messages).toHaveLength(11); // 1 system + 10 bounded messages
    expect(payload.messages[0].role).toBe("system");
    expect(payload.messages[0].content).toContain("call 999 or 112");
    expect(payload.messages[1]).toEqual({
      role: "user",
      content: "x".repeat(1000),
    });
    expect(payload.messages[2].role).toBe("assistant");
    expect(payload.messages.at(-1)).toEqual({
      role: "user",
      content: "What should I do?",
    });
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(response.text).not.toContain("test-only-key");
  });

  it("requires the conversation to begin with a user message", async () => {
    const response = await request(app)
      .post("/api/gooddoctor/chat")
      .send({ messages: [{ role: "assistant", content: "Hello" }] });

    expect(response.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 503 when the server key is missing", async () => {
    delete process.env.GROQ_API_KEY;

    const response = await request(app)
      .post("/api/gooddoctor/chat")
      .send({ messages: [{ role: "user", content: "I have a headache." }] });

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: "AI is not configured on the server.",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns a generic gateway error when Groq fails", async () => {
    global.fetch.mockRejectedValue(new Error("upstream unavailable"));
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const response = await request(app)
      .post("/api/gooddoctor/chat")
      .send({ messages: [{ role: "user", content: "I have a headache." }] });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      error: "Good Doctor could not respond right now.",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "Good Doctor AI request failed:",
      "upstream unavailable",
    );
    consoleError.mockRestore();
  });

  it("rejects an empty Groq response", async () => {
    global.fetch.mockImplementation(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => ({ choices: [{ message: { content: "   " } }] }),
    }));

    const response = await request(app)
      .post("/api/gooddoctor/chat")
      .send({ messages: [{ role: "user", content: "I have a headache." }] });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ error: "Empty reply." });
  });

  it("limits each IP to 20 requests per minute", async () => {
    for (let i = 0; i < 20; i += 1) {
      const allowed = await request(app)
        .post("/api/gooddoctor/chat")
        .send({ messages: [{ role: "user", content: `Message ${i}` }] });
      expect(allowed.status).toBe(200);
    }

    const limited = await request(app)
      .post("/api/gooddoctor/chat")
      .send({ messages: [{ role: "user", content: "One more" }] });

    expect(limited.status).toBe(429);
    expect(global.fetch).toHaveBeenCalledTimes(20);
  });
});
