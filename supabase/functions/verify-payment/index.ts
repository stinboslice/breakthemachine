import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();

    const purchaseIntentId = String(body.purchaseIntentId || "").trim();
    const txSignature = String(body.txSignature || "").trim();

    if (!purchaseIntentId) {
      return jsonResponse({ success: false, error: "Missing purchaseIntentId" }, 400);
    }

    if (!txSignature) {
      return jsonResponse({ success: false, error: "Missing txSignature" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SB_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!
    );

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
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
