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

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();

    const walletAddress = String(body.walletAddress || "").trim().toLowerCase();
    const creditsRequested = Number(body.creditsRequested || 0);

    if (!walletAddress || creditsRequested <= 0) {
      return jsonResponse(
        { success: false, error: "Missing walletAddress or creditsRequested" },
        400
      );
    }

    const supabase = createClient(
      Deno.env.get("SB_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.rpc("server_request_withdrawal", {
      p_wallet_address: walletAddress,
      p_credits_requested: creditsRequested
    });

    if (error) {
      return jsonResponse({ success: false, error: error.message }, 500);
    }

    return jsonResponse({
      success: true,
      withdrawal: data
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown server error"
      },
      500
    );
  }
});