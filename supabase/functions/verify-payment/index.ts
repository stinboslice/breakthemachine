import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Connection } from "https://esm.sh/@solana/web3.js@1.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);

  try {
    const body = await req.json();

    const purchaseIntentId = String(body.purchaseIntentId || "").trim();
    const txSignature = String(body.txSignature || "").trim();

    if (!purchaseIntentId || !txSignature) {
      return jsonResponse({ success: false, error: "Missing purchaseIntentId or txSignature" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SB_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!
    );

    const { data: intent, error: intentError } = await supabase
      .from("purchase_intents")
      .select("*")
      .eq("id", purchaseIntentId)
      .single();

    if (intentError || !intent) {
      return jsonResponse({ success: false, error: "Purchase intent not found" }, 404);
    }

    if (intent.status === "confirmed") {
      return jsonResponse({ success: true, alreadyConfirmed: true, purchaseIntentId });
    }

    const rpcUrl = Deno.env.get("SOLANA_RPC_URL") || "https://api.mainnet-beta.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");

    let tx = null;

    for (let i = 0; i < 8; i += 1) {
      tx = await connection.getParsedTransaction(txSignature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed"
      });

      if (tx?.meta && !tx.meta.err) break;
      await sleep(1500);
    }

    if (!tx || !tx.meta || tx.meta.err) {
      return jsonResponse({ success: false, error: "Transaction not found or failed after retry" }, 400);
    }

    const walletAddress = String(intent.wallet_address).toLowerCase();
    const receiverWallet = String(intent.expected_receiver_wallet).toLowerCase();
    const paymentToken = String(intent.payment_token).toUpperCase();

    const signerMatch = tx.transaction.message.accountKeys.some(account =>
      account.signer === true &&
      account.pubkey.toBase58().toLowerCase() === walletAddress
    );

    if (!signerMatch) {
      return jsonResponse({ success: false, error: "Transaction was not signed by purchase wallet" }, 400);
    }

    let validPayment = false;

    if (paymentToken === "SOL") {
      const receiverIndex = tx.transaction.message.accountKeys.findIndex(account =>
        account.pubkey.toBase58().toLowerCase() === receiverWallet
      );

      if (receiverIndex >= 0) {
        const pre = BigInt(tx.meta.preBalances[receiverIndex] || 0);
        const post = BigInt(tx.meta.postBalances[receiverIndex] || 0);
        validPayment = post > pre;
      }
    }

    if (!validPayment) {
      return jsonResponse({ success: false, error: "Payment did not reach expected treasury wallet" }, 400);
    }

    const { data, error } = await supabase.rpc("server_confirm_purchase_intent", {
      p_purchase_intent_id: purchaseIntentId,
      p_tx_signature: txSignature
    });

    if (error) {
      return jsonResponse({ success: false, error: error.message }, 500);
    }

    return jsonResponse({
      success: true,
      verified: true,
      purchaseIntentId,
      txSignature,
      confirmation: data
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown server error"
    }, 500);
  }
});
