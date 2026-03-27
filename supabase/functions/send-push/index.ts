import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Web Push helpers using Web Crypto API (no npm deps needed in Deno)
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
) {
  const { endpoint, p256dh, auth } = subscription;

  // Parse VAPID private key from base64url PKCS8
  const privKeyBytes = base64urlToUint8Array(vapidPrivateKey);
  const pubKeyBytes = base64urlToUint8Array(vapidPublicKey);

  // Create JWT for VAPID
  const audience = new URL(endpoint).origin;
  const jwt = await createVapidJwt(privKeyBytes, audience, vapidSubject);

  // Build Authorization header
  const authHeader = `vapid t=${jwt}, k=${vapidPublicKey}`;

  // Encrypt payload using Web Push encryption (aes128gcm)
  const encrypted = await encryptPayload(
    base64urlToUint8Array(p256dh),
    base64urlToUint8Array(auth),
    new TextEncoder().encode(payload),
  );

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "normal",
    },
    body: encrypted,
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error(`Push failed ${resp.status}:`, text);
    // 410 Gone = subscription expired, should be removed
    if (resp.status === 410 || resp.status === 404) {
      return { expired: true, status: resp.status };
    }
    return { expired: false, status: resp.status, error: text };
  }
  await resp.text(); // consume body
  return { expired: false, status: resp.status };
}

function base64urlToUint8Array(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (b64.length % 4)) % 4;
  const padded = b64 + "=".repeat(pad);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function createVapidJwt(
  privKeyPkcs8: Uint8Array,
  audience: string,
  subject: string,
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 86400, sub: subject };

  const enc = new TextEncoder();
  const headerB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    privKeyPkcs8,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      enc.encode(unsignedToken),
    ),
  );

  return `${unsignedToken}.${uint8ArrayToBase64url(signature)}`;
}

async function encryptPayload(
  clientPublicKey: Uint8Array,
  clientAuth: Uint8Array,
  plaintext: Uint8Array,
): Promise<Uint8Array> {
  // Generate ephemeral ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );

  const localPublicKey = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey),
  );

  // Import subscriber public key
  const subscriberKey = await crypto.subtle.importKey(
    "raw",
    clientPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  // Derive shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: subscriberKey },
      localKeyPair.privateKey,
      256,
    ),
  );

  // HKDF to derive PRK from auth secret + shared secret
  const authInfo = new TextEncoder().encode("WebPush: info\0");
  const authInfoFull = new Uint8Array(
    authInfo.length + clientPublicKey.length + localPublicKey.length,
  );
  authInfoFull.set(authInfo);
  authInfoFull.set(clientPublicKey, authInfo.length);
  authInfoFull.set(localPublicKey, authInfo.length + clientPublicKey.length);

  const ikmKey = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    "HKDF",
    false,
    ["deriveBits"],
  );

  const prk = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: clientAuth, info: authInfoFull },
      ikmKey,
      256,
    ),
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive content encryption key (CEK) and nonce
  const prkKey = await crypto.subtle.importKey(
    "raw",
    prk,
    "HKDF",
    false,
    ["deriveBits"],
  );

  const cekInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const cek = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: cekInfo },
      prkKey,
      128,
    ),
  );

  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");
  const nonce = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo },
      prkKey,
      96,
    ),
  );

  // Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    cek,
    "AES-GCM",
    false,
    ["encrypt"],
  );

  // Add padding delimiter (0x02 for last record)
  const paddedPlaintext = new Uint8Array(plaintext.length + 1);
  paddedPlaintext.set(plaintext);
  paddedPlaintext[plaintext.length] = 2; // final record

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      aesKey,
      paddedPlaintext,
    ),
  );

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65)
  const rs = plaintext.length + 1 + 16; // record size = padded plaintext + tag
  const header = new Uint8Array(16 + 4 + 1 + localPublicKey.length);
  header.set(salt);
  new DataView(header.buffer).setUint32(16, rs + 1);
  header[20] = localPublicKey.length;
  header.set(localPublicKey, 21);

  // Combine
  const result = new Uint8Array(header.length + ciphertext.length);
  result.set(header);
  result.set(ciphertext, header.length);

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:contact@aurea-student.fr";

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw new Error("VAPID keys not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { user_id, title, body, data } = await req.json();

    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: "user_id and title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all push subscriptions for this user
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", user_id);

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No subscriptions" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({ title, body: body || "", data: data || {} });
    let sent = 0;
    const expired: string[] = [];

    for (const sub of subs) {
      const result = await sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY,
        VAPID_SUBJECT,
      );

      if (result.expired) {
        expired.push(sub.id);
      } else if (result.status === 201) {
        sent++;
      }
    }

    // Clean up expired subscriptions
    if (expired.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", expired);
    }

    return new Response(
      JSON.stringify({ sent, expired: expired.length, total: subs.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("send-push error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
