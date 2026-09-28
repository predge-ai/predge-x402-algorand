// Pay a Predge x402 endpoint in USDC on Algorand MainNet.
//
// Flow (the standard x402 handshake):
//   1. GET the paid route -> 402 Payment Required, body carries accepts[]
//   2. Pick the Algorand entry (network = MainNet genesis, asset = USDC ASA 31566704)
//   3. Sign a USDC transfer from your account to accepts.payTo
//   4. The GoPlausible facilitator settles it; the resource is returned
//
// Prereqs on your Algorand account:
//   - funded with a little ALGO (min balance + fees)
//   - opted in to USDC (ASA 31566704) -- an Algorand account cannot hold an
//     asset it has not opted into
//
// Usage:
//   ALGO_MNEMONIC="25 word phrase" node examples/pay-algorand.mjs
//
// This is a reference client. It uses x402-fetch with an AVM signer; wire the
// signer to whatever x402 AVM client version you install (see the x402 dev
// guide: https://algorand.co/agentic-commerce/x402/developers).

import algosdk from "algosdk";
import { wrapFetchWithPayment } from "x402-fetch";

const ENDPOINT = process.env.PREDGE_ENDPOINT ?? "https://api.predge.io/v1/whales/latest?limit=5";
const USDC_ASA = 31_566_704; // USDC on Algorand MainNet

function loadAccount() {
  const mnemonic = process.env.ALGO_MNEMONIC;
  if (!mnemonic) {
    throw new Error("Set ALGO_MNEMONIC to the 25-word phrase of an Algorand account that holds USDC (ASA 31566704) and a little ALGO.");
  }
  return algosdk.mnemonicToSecretKey(mnemonic);
}

// Minimal AVM signer: signs the USDC asset-transfer the facilitator asks for.
// The exact shape is defined by the x402 AVM client you install; this shows
// the intent — sign an ASA (31566704) payment to accepts.payTo.
function avmSigner(account) {
  return {
    address: account.addr,
    assetId: USDC_ASA,
    signTransaction: (txn) => txn.signTxn(account.sk),
  };
}

async function main() {
  const account = loadAccount();
  const fetchWithPay = wrapFetchWithPayment(fetch, avmSigner(account));

  const res = await fetchWithPay(ENDPOINT);
  if (!res.ok) {
    console.error("Request failed:", res.status, await res.text());
    process.exit(1);
  }
  console.log("Paid and received:");
  console.log(JSON.stringify(await res.json(), null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
