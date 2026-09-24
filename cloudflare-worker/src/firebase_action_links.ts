type ServiceAccount = { client_email: string; private_key: string }

export async function generateFirebaseActionLink(
  serviceAccountJson: string,
  projectId: string,
  email: string,
  requestType: "VERIFY_EMAIL" | "PASSWORD_RESET",
) {
  const account = parseServiceAccount(serviceAccountJson)
  const accessToken = await serviceAccountToken(account)
  // The global endpoint plus X-Goog-User-Project is the Firebase Auth Admin
  // flow that honors returnOobLink. The project-scoped endpoint dispatched
  // Firebase's default e-mail instead of returning the action link.
  const response = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Goog-User-Project": projectId,
    },
    body: JSON.stringify({ requestType, email, returnOobLink: true }),
  })
  if (!response.ok) throw new Error("O Firebase não gerou o link de ação.")
  const body = await response.json<{ oobLink?: string; email?: string; kind?: string }>()
  if (!body.oobLink) {
    console.error(JSON.stringify({ event: "firebase_action_link_missing", responseKeys: Object.keys(body) }))
    throw new Error("O Firebase retornou um link de ação inválido.")
  }
  return body.oobLink
}

function parseServiceAccount(value: string): ServiceAccount {
  const account = JSON.parse(value) as Partial<ServiceAccount>
  if (!account.client_email || !account.private_key) throw new Error("A credencial de serviço do Firebase é inválida.")
  return { client_email: account.client_email, private_key: account.private_key }
}

async function serviceAccountToken(account: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claims = base64url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/identitytoolkit",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }))
  const input = `${header}.${claims}`
  const key = await crypto.subtle.importKey("pkcs8", pemToBytes(account.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"])
  const signature = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input)))
  const assertion = `${input}.${base64url(signature)}`
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  })
  if (!response.ok) throw new Error("Não foi possível autenticar o serviço de e-mail no Firebase.")
  const body = await response.json<{ access_token?: string }>()
  if (!body.access_token) throw new Error("O Firebase não retornou um token de serviço.")
  return body.access_token
}

function pemToBytes(pem: string) {
  const binary = atob(pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, ""))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function base64url(value: string | Uint8Array) {
  const binary = typeof value === "string" ? unescape(encodeURIComponent(value)) : String.fromCharCode(...value)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}
