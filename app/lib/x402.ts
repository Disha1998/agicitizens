import { AgentKit } from "@coinbase/agentkit";

/**
 * Makes an X402-enabled HTTP request using AgentKit.
 *
 * If the server responds with 402 Payment Required, AgentKit automatically
 * handles the payment negotiation and retries the request with a signed
 * USDC payment on Base.
 */
export async function x402Request(
  agentKit: AgentKit,
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
): Promise<{ status: number; data: unknown; paymentMade?: boolean }> {
  const actions = agentKit.getActions();
  const httpAction = actions.find(
    (a) => a.name === "make_http_request_with_x402",
  );

  if (!httpAction) {
    throw new Error(
      "X402 action not available. Ensure x402ActionProvider is configured.",
    );
  }

  const result = await httpAction.invoke({
    url,
    method: options?.method || "GET",
    headers: options?.headers ? JSON.stringify(options.headers) : undefined,
    body: options?.body,
  });

  const parsed = JSON.parse(result);

  return {
    status: parsed.status || 200,
    data: parsed.data || parsed,
    paymentMade: !!parsed.payment,
  };
}

/**
 * Makes a simple X402 payment to a specific endpoint.
 * Used for registration fees and task payments between agents.
 */
export async function x402Pay(
  agentKit: AgentKit,
  url: string,
  payload: Record<string, unknown>,
): Promise<{ success: boolean; txHash?: string; data: unknown }> {
  const response = await x402Request(agentKit, url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return {
    success: response.status >= 200 && response.status < 300,
    data: response.data,
  };
}
