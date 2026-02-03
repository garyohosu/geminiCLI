const { spawn } = require("child_process");

const isWin = process.platform === "win32";
const defaultCmd = process.env.MCP_SERVER_CMD || (isWin ? "npx.cmd" : "npx");
const defaultArgs = process.env.MCP_SERVER_ARGS
  ? process.env.MCP_SERVER_ARGS.split(" ").filter(Boolean)
  : ["gemini-mcp-tool"];

const PROTOCOL_VERSION = process.env.MCP_PROTOCOL_VERSION || "2025-11-25";
const REQUEST_TIMEOUT_MS = Number(process.env.MCP_REQUEST_TIMEOUT_MS || 120000);
const ASK_GEMINI = process.env.MCP_PROBE_ASK === "1";
const GEMINI_MODEL = process.env.MCP_GEMINI_MODEL || "gemini-2.5-flash";

const startTime = Date.now();
const log = (label, message, extra) => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const suffix = extra ? ` ${JSON.stringify(extra)}` : "";
  console.log(`[${elapsed}s] ${label} ${message}${suffix}`);
};

const readBuffer = [];
let nextId = 1;
const pending = new Map();

const sendMessage = (child, message) => {
  const payload = JSON.stringify(message);
  child.stdin.write(`${payload}\n`);
};

const request = (child, method, params) => {
  const id = nextId++;
  const message = { jsonrpc: "2.0", id, method, params };
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Request timeout (${REQUEST_TIMEOUT_MS}ms): ${method}`));
    }, REQUEST_TIMEOUT_MS);
    pending.set(id, { resolve, reject, timeout, method });
    sendMessage(child, message);
  });
};

const notify = (child, method, params) => {
  const message = { jsonrpc: "2.0", method, params };
  sendMessage(child, message);
};

const handleMessage = (message) => {
  if (message.id !== undefined) {
    const entry = pending.get(message.id);
    if (!entry) {
      log("warn", "response for unknown id", { id: message.id });
      return;
    }
    clearTimeout(entry.timeout);
    pending.delete(message.id);
    if (message.error) {
      entry.reject(message.error);
    } else {
      entry.resolve(message.result);
    }
    return;
  }

  if (message.method) {
    log("notify", message.method, message.params || {});
  } else {
    log("warn", "unknown message", message);
  }
};

const processChunk = (chunk) => {
  readBuffer.push(chunk);
  const data = Buffer.concat(readBuffer).toString("utf8");
  const lines = data.split("\n");
  readBuffer.length = 0;
  const incomplete = lines.pop();
  if (incomplete) {
    readBuffer.push(Buffer.from(incomplete, "utf8"));
  }
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const message = JSON.parse(trimmed);
      handleMessage(message);
    } catch (error) {
      log("error", "failed to parse message", { line: trimmed, error: String(error) });
    }
  }
};

const spawnServer = (cmd, args) => {
  const useShell = isWin && (cmd.toLowerCase().endsWith(".cmd") || cmd.toLowerCase().endsWith(".bat"));
  log("info", "starting MCP server", { cmd, args, shell: useShell });
  return spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"], shell: useShell });
};

const runProbe = async () => {
  let child = spawnServer(defaultCmd, defaultArgs);

  child.on("error", (error) => {
    log("error", "spawn failed", { error: String(error) });
  });

  child.stdout.on("data", processChunk);
  child.stderr.on("data", (chunk) => {
    const text = chunk.toString("utf8").trim();
    if (text) {
      log("stderr", text);
    }
  });

  const initResult = await request(child, "initialize", {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {
      tools: {},
      prompts: {},
      resources: {},
      logging: {},
    },
    clientInfo: {
      name: "mcp-stdio-probe",
      version: "0.1.0",
    },
  });

  log("info", "initialize:ok", { serverInfo: initResult.serverInfo, protocol: initResult.protocolVersion });

  notify(child, "notifications/initialized", {});
  log("info", "initialized notification sent");

  const toolList = await request(child, "tools/list", {});
  const toolNames = (toolList.tools || []).map((tool) => tool.name);
  log("info", "tools/list", { count: toolNames.length, tools: toolNames });

  const timeoutResult = await request(child, "tools/call", {
    name: "timeout-test",
    arguments: { duration: 50 },
  });
  log("info", "tools/call timeout-test", { content: timeoutResult.content });

  if (ASK_GEMINI) {
    log("info", "tools/call ask-gemini:start", { model: GEMINI_MODEL });
    const askResult = await request(child, "tools/call", {
      name: "ask-gemini",
      arguments: {
        prompt: "Reply with 'OK' only.",
        model: GEMINI_MODEL,
        sandbox: false,
        changeMode: false,
      },
      _meta: { progressToken: "probe-1" },
    });
    log("info", "tools/call ask-gemini", { content: askResult.content });
  }

  child.stdin.end();
  await new Promise((resolve) => {
    child.once("close", resolve);
    setTimeout(resolve, 2000);
  });
  log("info", "probe complete");
};

runProbe().catch((error) => {
  log("error", "probe failed", { error: String(error) });
  process.exitCode = 1;
});
