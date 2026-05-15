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

    if (!walletAddress) {
      return jsonResponse({ success: false, error: "Missing walletAddress" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SB_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!
    );

    const { data: profileData, error: profileError } = await supabase.rpc(
      "server_get_player_profile",
      {
        p_wallet_address: walletAddress
      }
    );

    if (profileError) {
      return jsonResponse({ success: false, error: profileError.message }, 500);
    }

    const { data: historyData, error: historyError } = await supabase.rpc(
      "server_get_player_history",
      {
        p_wallet_address: walletAddress,
        p_limit: 25
      }
    );

    if (historyError) {
      return jsonResponse({ success: false, error: historyError.message }, 500);
    }

    return jsonResponse({
      success: true,
      profile: profileData,
      history: historyData
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown server error"
    }, 500);
  }
});
