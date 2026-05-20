const EDGE_BASE_URL = "https://saxjzdlmjavegncitmhy.supabase.co/functions/v1";

const STORAGE_KEY = "elf_wallet_session";

export const ELF_TREASURY_WALLET =
  "7Ut8PPBHyQnnJCmMcVrJx43jT25hK1ugX3uSuyyu6DaC";

export const ELF_MINT_ADDRESS =
  "DGuCYnyfFDu9moBXn9gtbHSyyjhVNSck3AZv1Gv2pump";

export function getPhantomProvider() {
  if (window.phantom?.solana?.isPhantom) return window.phantom.solana;
  if (window.solana?.isPhantom) return window.solana;
  return null;
}

export function hasWalletSession() {
  return Boolean(getWalletSession()?.walletAddress);
}

export function getWalletSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveWalletSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function disconnectWallet() {
  localStorage.removeItem(STORAGE_KEY);

  const provider = getPhantomProvider();

  if (provider?.disconnect) {
    provider.disconnect().catch(() => {});
  }
}

export async function connectWallet() {
  const provider = getPhantomProvider();

  if (!provider) {
    throw new Error("Phantom wallet not found. Please install Phantom to continue.");
  }

  const response = await provider.connect();
  const walletAddress = response.publicKey.toString();

  const message =
    `ELF: Break the Machine wallet login\n\n` +
    `Wallet: ${walletAddress}\n` +
    `Time: ${new Date().toISOString()}\n\n` +
    `Sign this message to prove wallet ownership. This does not move funds.`;

  const encodedMessage = new TextEncoder().encode(message);
  const signed = await provider.signMessage(encodedMessage, "utf8");

  const signature = bs58Encode(signed.signature);

  const authData = await callEdgeFunction("auth-wallet", {
    walletAddress,
    message,
    signature
  });

  if (!authData.success) {
    throw new Error(authData.error || "Wallet authentication failed.");
  }

  const session = saveWalletSession({
    walletAddress,
    walletMasked: authData.walletMasked,
    authenticatedAt: authData.authenticatedAt,
    provider: "phantom"
  });

  return session;
}

export async function reconnectWalletSilently() {
  const saved = getWalletSession();

  if (!saved?.walletAddress) return null;

  const provider = getPhantomProvider();

  if (!provider) return saved;

  try {
    const response = await provider.connect({ onlyIfTrusted: true });
    const walletAddress = response.publicKey.toString();

    if (walletAddress !== saved.walletAddress) {
      disconnectWallet();
      return null;
    }

    return saved;
  } catch {
    return saved;
  }
}

export async function getPlayerProfile(walletAddress = null) {
  const session = getWalletSession();
  const targetWallet = walletAddress || session?.walletAddress;

  if (!targetWallet) {
    throw new Error("No wallet connected.");
  }

  const data = await callEdgeFunction("get-player-profile", {
    walletAddress: targetWallet
  });

  if (!data.success) {
    throw new Error(data.error || "Could not fetch player profile.");
  }

  return data;
}

export async function createPurchaseIntent({
  packageId,
  paymentToken = "SOL",
  walletAddress = null
}) {
  const session = getWalletSession();
  const targetWallet = walletAddress || session?.walletAddress;

  if (!targetWallet) {
    throw new Error("Connect wallet before buying credits.");
  }

  const data = await callEdgeFunction("create-purchase-intent", {
    walletAddress: targetWallet,
    packageId,
    paymentToken
  });

  if (!data.success) {
    throw new Error(data.error || "Could not create purchase intent.");
  }

  const rawIntent = data.purchaseIntent || data.intent || data;

  const purchaseIntentId =
    rawIntent.id ||
    rawIntent.purchaseIntentId ||
    rawIntent.purchase_intent_id;

  if (!purchaseIntentId) {
    throw new Error(`Create purchase intent returned no id: ${JSON.stringify(data)}`);
  }

  return {
    ...rawIntent,
    id: purchaseIntentId,
    purchaseIntentId
  };
}

export async function verifyPayment({
  purchaseIntentId,
  txSignature,
  walletAddress = null,
  packageId = null
}) {
  if (!txSignature) {
    throw new Error("Missing transaction signature.");
  }

  const session = getWalletSession();

  const data = await callEdgeFunction("verify-payment", {
    purchaseIntentId,
    txSignature,
    walletAddress: walletAddress || session?.walletAddress,
    packageId
  });

  if (!data.success) {
    throw new Error(data.error || "Payment verification failed.");
  }

  return data;
}

export async function submitRunResult({
  runId,
  classId,
  buffs = [],
  weaponTier = "base",
  eventLogJson = [],
  result,
  extractionLevel = 0,
  bossKills = 0,
  runtimeSeconds = 0,
  clientReportVersion = "v1"
}) {
  const session = getWalletSession();

  if (!session?.walletAddress) {
    throw new Error("Connect wallet before submitting run rewards.");
  }

  if (!runId || !classId || !result) {
    throw new Error("Missing required run result fields.");
  }

  const data = await callEdgeFunction("submit-run", {
    walletAddress: session.walletAddress,
    runId,
    classId,
    buffs,
    weaponTier,
    eventLogJson,
    result,
    extractionLevel,
    bossKills,
    runtimeSeconds,
    clientReportVersion
  });

  if (!data.success) {
    throw new Error(data.error || "Run submission failed.");
  }

  return data;
}

export async function requestWithdrawal({
  creditsRequested
}) {
  const session = getWalletSession();

  if (!session?.walletAddress) {
    throw new Error("Connect wallet before requesting withdrawal.");
  }

  if (!creditsRequested || Number(creditsRequested) <= 0) {
    throw new Error("Invalid withdrawal amount.");
  }

  const data = await callEdgeFunction("request-withdrawal", {
    walletAddress: session.walletAddress,
    creditsRequested: Number(creditsRequested)
  });

  if (!data.success) {
    throw new Error(data.error || "Withdrawal request failed.");
  }

  return data.withdrawal;
}

export async function sendSolPayment({
  toWallet = ELF_TREASURY_WALLET,
  lamports
}) {
  const provider = getPhantomProvider();

  if (!provider) {
    throw new Error("Phantom wallet not found.");
  }

  if (!window.solanaWeb3) {
    throw new Error("Solana Web3 is not loaded yet.");
  }

  if (!provider.publicKey) {
    throw new Error("Wallet is not connected.");
  }

  const connection = new window.solanaWeb3.Connection(
    "https://mainnet.helius-rpc.com/?api-key=5c224cdf-853c-489f-9070-ac1f144934e7",
    "confirmed"
  );

  const transaction = new window.solanaWeb3.Transaction().add(
    window.solanaWeb3.SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: new window.solanaWeb3.PublicKey(toWallet),
      lamports: Number(lamports)
    })
  );

  transaction.feePayer = provider.publicKey;

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = latestBlockhash.blockhash;

  if (provider.signAndSendTransaction) {
    const result = await provider.signAndSendTransaction(transaction);
    return result.signature;
  }

  const signedTransaction = await provider.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(
    signedTransaction.serialize(),
    { skipPreflight: false }
  );

  await connection.confirmTransaction({
    signature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
  }, "confirmed");

  return signature;
}

export async function buyCreditsWithSol({
  packageId,
  lamports
}) {
  const intent = await createPurchaseIntent({
    packageId,
    paymentToken: "SOL"
  });

  const txSignature = await sendSolPayment({
    toWallet: intent.expectedReceiverWallet || ELF_TREASURY_WALLET,
    lamports
  });

  const purchaseIntentId =
  intent?.id ||
  intent?.purchaseIntentId ||
  intent?.purchase_intent_id;

if (!purchaseIntentId) {
  throw new Error(`Missing purchase intent id: ${JSON.stringify(intent)}`);
}

const verification = await verifyPayment({
  purchaseIntentId,
  txSignature,
  walletAddress: getWalletSession()?.walletAddress,
  packageId
});

  const profile = await getPlayerProfile();

  return {
    intent,
    txSignature,
    verification,
    profile
  };
}

export async function callEdgeFunction(functionName, payload) {
  const response = await fetch(`${EDGE_BASE_URL}/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload || {})
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(`Invalid response from ${functionName}.`);
  }

  if (!response.ok) {
    throw new Error(data.error || `${functionName} failed.`);
  }

  return data;
}

function bs58Encode(buffer) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const bytes = Array.from(buffer);

  let digits = [0];

  for (const byte of bytes) {
    let carry = byte;

    for (let i = 0; i < digits.length; i += 1) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }

    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  for (const byte of bytes) {
    if (byte === 0) digits.push(0);
    else break;
  }

  return digits.reverse().map(digit => alphabet[digit]).join("");
}
