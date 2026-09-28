# Predge — x402 on Algorand

**Verified, per-call data for autonomous agents, payable in USDC on Algorand.**

Predge is a live [x402](https://algorand.co/agentic-commerce/x402/developers) API that sells cryptographically **signed, outcome-verified** market and smart-money signals one request at a time. Every paid route returns an ed25519-signed attestation, so a consuming agent can verify offline that the data it paid for is genuine and fresh — not an unsigned blob it has to trust.

This repository documents Predge's Algorand rail, built for the **[Global x402 Challenge](https://algorand.co/global-x402-challenge)**.

- **Live API:** `https://api.predge.io`
- **x402 catalogue:** `https://api.predge.io/.well-known/x402.json`
- **Settlement:** [GoPlausible](https://goplausible.xyz) facilitator, Algorand **MainNet**
- **Asset:** USDC — Algorand ASA **`31566704`**
- **Challenge tag:** `x402-global-challenge` (attached to every Algorand `accepts[]` entry)
- **Discovery:** listed in the x402 Bazaar

## What the payment unlocks

One verified signal or dataset per request. Example routes (same catalogue that is already live on Base and Solana, now payable on Algorand):

| Route | Returns |
|---|---|
| `GET /v1/whales/latest` | Latest large Polymarket trades with market, side, size, price, wallet and Predge wallet score (0–100) |
| `GET /v1/whales/wallet/:address` | A wallet's conviction signal, signed |
| `GET /v1/markets/:conditionId` | Per-market smart-money flow |

Free, no paywall: `GET /openapi.json`, `GET /health`, `GET /.well-known/x402.json`.

## Who pays

Autonomous trading agents, bots and downstream services that consume signals programmatically and want machine-payable, per-call access instead of a subscription. The calling agent pays USDC from its Algorand account; the facilitator settles it to the Predge leaderboard wallet.

## How the Algorand rail works

The resource server registers one payment scheme per chain. For Algorand it uses the AVM exact-payment scheme, and each `accepts[]` entry advertises the GoPlausible facilitator, the USDC ASA and the challenge tag:

```jsonc
// One entry of the 402 challenge response for a paid route
{
  "scheme": "exact",
  "network": "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=", // MainNet genesis (CAIP-2)
  "payTo": "<Predge Algorand leaderboard wallet>",
  "price": "0.01",
  "maxTimeoutSeconds": 60,
  "extra": { "tag": "x402-global-challenge" }
}
```

Server-side wiring (from the production API):

- The AVM rail is activated by a single `PAY_TO_ADDRESS_ALGORAND` env var and is gated exactly like the Solana and Celo rails — the accept is only advertised when a real payTo is configured, so Predge never offers a settlement it cannot honour.
- Settlement is delegated to GoPlausible, the facilitator the challenge counts volume through. USDC on Algorand is an ASA (`31566704`), not a contract.
- The `x402-global-challenge` tag is attribution metadata written at settlement time; it changes nothing about the payment and is only attached to the Algorand rail.

## See the 402 challenge

```bash
curl -i https://api.predge.io/v1/whales/latest
# HTTP/1.1 402 Payment Required
# ... body includes accepts[] with the Algorand entry above ...
```

## Pay it (agent flow)

Any x402 client that supports the AVM `exact` scheme can pay the endpoint. Sketch with `x402-fetch` and an Algorand signer:

```js
// examples/pay-algorand.mjs — see that file for the full, commented version
import { wrapFetchWithPayment } from "x402-fetch";
import { algorandSignerFromMnemonic } from "./signer.mjs";

const signer = algorandSignerFromMnemonic(process.env.ALGO_MNEMONIC); // pays USDC ASA 31566704
const fetchWithPay = wrapFetchWithPayment(fetch, signer);

const res = await fetchWithPay("https://api.predge.io/v1/whales/latest?limit=5");
console.log(await res.json()); // resource returned after settlement
```

The x402 handshake is: request → `402` with the Algorand `accepts[]` → client signs a USDC payment → GoPlausible settles → the resource is returned. See the [x402 dev guide](https://algorand.co/agentic-commerce/x402/developers).

## Links

- Live API: https://api.predge.io
- x402 catalogue: https://api.predge.io/.well-known/x402.json
- Predge: https://predge.io
- Global x402 Challenge: https://algorand.co/global-x402-challenge
- GoPlausible facilitator: https://goplausible.xyz

## License

MIT — see [LICENSE](./LICENSE).
