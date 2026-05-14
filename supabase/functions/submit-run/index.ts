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

async function sha256Hex(value: unknown) {
  const text = JSON.stringify(value ?? []);
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
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
    const runId = String(body.runId || "").trim();
    const classId = String(body.classId || "").trim();
    const weaponTier = String(body.weaponTier || "base").trim();
    const result = String(body.result || "").trim();
    const extractionLevel = Number(body.extractionLevel || 0);
    const bossKills = Number(body.bossKills || 0);
    const runtimeSeconds = Number(body.runtimeSeconds || 0);
    const clientReportVersion = String(body.clientReportVersion || "v1").trim();

    const buffs = Array.isArray(body.buffs) ? body.buffs : [];
    const eventLogJson = Array.isArray(body.eventLogJson) ? body.eventLogJson : [];

    if (!walletAddress || !runId || !classId || !result) {
      return jsonResponse({ success: false, error: "Missing required run fields" }, 400);
    }

    if (!["extracted", "failed", "completed", "abandoned"].includes(result)) {
      return jsonResponse({ success: false, error: "Invalid result" }, 400);
    }

    const eventLogHash = await sha256Hex(eventLogJson);

    const supabase = createClient(
      Deno.env.get("SB_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.rpc("server_record_run_result", {
      p_run_id: runId,
      p_wallet_address: walletAddress,
      p_class_id: classId,
      p_buffs: buffs,
      p_weapon_tier: weaponTier,
      p_event_log_json: eventLogJson,
      p_result: result,
      p_extraction_level: extractionLevel,
      p_boss_kills: bossKills,
      p_runtime_seconds: runtimeSeconds,
      p_event_log_hash: eventLogHash,
      p_client_report_version: clientReportVersion
    });

    if (error) {
      return jsonResponse({ success: false, error: error.message }, 500);
    }

    return jsonResponse({
      success: true,
      eventLogHash,
      result: data
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