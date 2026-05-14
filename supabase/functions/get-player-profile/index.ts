import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();

    const walletAddress = String(body.walletAddress || "").trim();

    if (!walletAddress) {
      return jsonResponse(
        {
          success: false,
          error: "Missing walletAddress",
        },
        400
      );
    }

    const supabase = createClient(
      Deno.env.get("SB_URL") || "",
      Deno.env.get("SERVICE_ROLE_KEY") || ""
    );

    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select(`
        wallet_address,
        credit_balance,
        created_at,
        updated_at
      `)
      .eq("wallet_address", walletAddress)
      .single();

    if (playerError && playerError.code !== "PGRST116") {
      return jsonResponse(
        {
          success: false,
          error: playerError.message,
        },
        500
      );
    }

    const { data: historyData, error: historyError } = await supabase.rpc(
      "server_get_player_history",
      {
        p_wallet_address: walletAddress,
        p_limit: 25,
      }
    );

    if (historyError) {
      return jsonResponse(
        {
          success: false,
          error: historyError.message,
        },
        500
      );
    }

    return jsonResponse({
      success: true,
      profile: {
        walletAddress,
        walletMasked: historyData.walletMasked,
        creditBalance: playerData?.credit_balance || 0,
        createdAt: playerData?.created_at || null,
        updatedAt: playerData?.updated_at || null,
      },
      history: historyData,
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      500
    );
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}