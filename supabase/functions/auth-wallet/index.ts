import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import nacl from "npm:tweetnacl@1.0.3";
import bs58 from "npm:bs58@6.0.0";

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

    const walletAddress = String(body.walletAddress || "").trim();
    const message = String(body.message || "");
    const signature = String(body.signature || "").trim();

    if (!walletAddress || !message || !signature) {
      return jsonResponse(
        { success: false, error: "Missing walletAddress, message, or signature" },
        400
      );
    }

    if (!message.includes("ELF") && !message.includes("Break the Machine")) {
      return jsonResponse(
        { success: false, error: "Invalid auth message" },
        400
      );
    }

    let publicKeyBytes: Uint8Array;
    let signatureBytes: Uint8Array;

    try {
      publicKeyBytes = bs58.decode(walletAddress);
      signatureBytes = bs58.decode(signature);
    } catch {
      return jsonResponse(
        { success: false, error: "Invalid wallet or signature encoding" },
        400
      );
    }

    const messageBytes = new TextEncoder().encode(message);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return jsonResponse(
        { success: false, error: "Invalid wallet signature" },
        401
      );
    }

    const maskedWallet =
  walletAddress.length > 12
    ? '${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}'
    : walletAddress;

    return jsonResponse({
      success: true,
      walletAddress,
      walletMasked: maskedWallet,
      authenticatedAt: new Date().toISOString()
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