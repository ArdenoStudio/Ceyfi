#!/usr/bin/env node
/** Fail-open guard for transfer-related MCP tool calls in demos. */
async function main() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  try {
    const payload = JSON.parse(input || "{}");
    const tool = payload?.tool_input?.name ?? payload?.tool_name ?? "";
    if (String(tool).includes("transfer")) {
      process.stdout.write(
        JSON.stringify({
          permission: "ask",
          user_message:
            "CEYFI demo: confirm before executing a funds transfer via MCP.",
        })
      );
      return;
    }
  } catch {
    // fail open
  }
  process.stdout.write(JSON.stringify({ permission: "allow" }));
}

main();
