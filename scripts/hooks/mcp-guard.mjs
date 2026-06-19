#!/usr/bin/env node
/** Fail-open guard for transfer-related MCP tool calls in demos. */
async function main() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  try {
    const payload = JSON.parse(input || "{}");
    const tool = payload?.tool_input?.name ?? payload?.tool_name ?? "";
    const financial = [
      "transfer",
      "pay_loan_instalment",
      "execute_decision",
      "initiate_payment",
    ];
    if (financial.some((k) => String(tool).includes(k))) {
      process.stdout.write(
        JSON.stringify({
          permission: "ask",
          user_message:
            "CEYFI demo: confirm before executing a financial action via MCP.",
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
