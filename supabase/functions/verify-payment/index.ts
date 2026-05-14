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
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { success: false, error: "Method not allowed" },
      405
    );
  }

  try {
    const body = await req.json();

    const purchaseIntentId = String(body.purchaseIntentId || "").trim();
    const txSignature = String(body.txSignature || "").trim();

    if (!purchaseIntentId || !txSignature) {
      return jsonResponse(
        {
          success: false,
          error: "Missing purchaseIntentId or txSignature"
        },
        400
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: purchaseIntent, error: intentError } = await supabase
      .from("purchase_intents")
      .select("*")
      .eq("id", purchaseIntentId)
      .single();

    if (intentError || !purchaseIntent) {
      return jsonResponse(
        {
          success: false,
          error: "Purchase intent not found"
        },
        404
      );
    }

    if (purchaseIntent.status === "confirmed") {
      return jsonResponse(
        {
          success: true,
          alreadyConfirmed: true
        },
        200
      );
    }

    if (purchaseIntent.status !== "pending") {
      return jsonResponse(
        {
          success: false,
          error: "Purchase intent is not pending"
        },
        400
      );
    }

    if (purchaseIntent.expires_at) {
      const expiresAt = new Date(purchaseIntent.expires_at).getTime();

      if (Date.now() > expiresAt) {
        return jsonResponse(
          {
            success: false,
            error: "Purchase intent expired"
          },
          400
        );
      }
    }

    const { error: confirmError } = await supabase.rpc(
      "server_confirm_purchase_intent",
      {
        p_purchase_intent_id: purchaseIntentId,
        p_tx_signature: txSignature
      }
    );

    if (confirmError) {
      return jsonResponse(
        {
          success: false,
          error: confirmError.message
        },
        500
      );
    }

    return jsonResponse({
      success: true,
      purchaseIntentId,
      txSignature,
      confirmedAt: new Date().toISOString()
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Unknown server error"
      },
      500
    );
  }
});