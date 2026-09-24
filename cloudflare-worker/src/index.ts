import { generateFirebaseActionLink } from "./firebase_action_links";
import {
  passwordResetEmail,
  welcomeEmail,
  welcomeVerificationEmail,
} from "./email_templates";
import { sendSmtpEmail } from "./smtp_mailer";

type WorkerEnv = Env & {
  GROQ_API_KEY: string;
  FIREBASE_PROJECT_ID: string;
  INITIAL_ADMIN_EMAIL: string;
  INITIAL_ADMIN_BOOTSTRAP_TOKEN: string;
  INITIAL_ADMIN_VERIFICATION_RECIPIENT: string;
  FIREBASE_WEB_API_KEY: string;
  ALLOWED_ORIGINS: string;
  FIREBASE_SERVICE_ACCOUNT_JSON: string;
  VERCEL_MAILER_URL: string;
  MAILER_INTERNAL_SECRET: string;
  GOOGLE_PLAY_PACKAGE_NAME?: string;
  GOOGLE_PLAY_PREMIUM_PRODUCT_ID?: string;
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?: string;
  AUDIO_SIGNING_SECRET?: string;
  MERCADO_PAGO_ACCESS_TOKEN?: string;
  MERCADO_PAGO_PUBLIC_KEY?: string;
  MERCADO_PAGO_WEBHOOK_SECRET?: string;
  MERCADO_PAGO_TEST_PAYER_EMAIL?: string;
};

const MODEL = "openai/gpt-oss-120b";
const PROMPT_VERSION = 2;
const DAILY_LIMIT = 20;

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const startedAt = Date.now();
    const requestId = request.headers.get("cf-ray") ?? crypto.randomUUID();
    const origin = request.headers.get("Origin") ?? "";
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS);
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors });
    try {
      const url = new URL(request.url);
      if (request.method === "GET" && url.pathname.startsWith("/assets/"))
        return await serveAsset(url, env, cors);
      if (request.method === "GET" && url.pathname === "/catalog/reading") {
        const identity = await authenticate(request, env);
        return await readCatalog(url, identity, env, cors);
      }
      if (request.method === "GET" && url.pathname === "/catalog/audio") {
        const identity = await authenticate(request, env);
        return await readCatalogAudio(url, identity, env, cors);
      }
      if (request.method === "POST" && url.pathname === "/auth/password-reset")
        return sendPasswordReset(request, env, cors);
      if (request.method === "POST" && url.pathname === "/auth/initial-admin-verification")
        return sendInitialAdminVerification(env, cors);
      if (request.method === "POST" && url.pathname === "/admin/initial-admin-provision")
        return provisionInitialAdmin(request, env, cors);
      if (
        request.method === "POST" &&
        url.pathname === "/billing/mercado-pago/webhook"
      )
        return processMercadoPagoWebhook(request, env);
      const identity = await authenticate(request, env);
      if (url.pathname.startsWith("/admin/catalog/")) {
        if (decodeIdentityClaims(identity.token).admin !== true)
          throw new HttpError(403, "Acesso restrito a administradores.");
        return await adminCatalog(request, url, env, cors);
      }
      if (url.pathname.startsWith("/notifications/legal-changes"))
        return await legalChangeNotifications(request, url, identity.uid, env, cors);
      if (
        request.method === "POST" &&
        url.pathname === "/auth/email-verification"
      )
        return sendEmailVerification(identity, env, cors);
      if (request.method === "POST" && url.pathname === "/auth/initial-admin-claim")
        return grantInitialAdmin(identity, env, cors);
      if (request.method === "POST" && url.pathname === "/auth/welcome")
        return sendWelcomeEmail(identity, env, cors);
      if (request.method === "GET" && url.pathname === "/billing/entitlements")
        return getEntitlements(identity.uid, env, cors);
      if (request.method === "GET" && url.pathname === "/billing/subscription")
        return getSubscriptionOverview(identity.uid, env, cors);
      if (request.method === "POST" && url.pathname === "/billing/trial/redeem")
        return redeemTrial(identity.uid, env, cors);
      if (
        request.method === "POST" &&
        url.pathname === "/billing/google-play/verify"
      )
        return verifyGooglePlayPurchase(request, identity.uid, env, cors);
      if (
        request.method === "POST" &&
        url.pathname === "/billing/mercado-pago/checkout"
      )
        return createMercadoPagoCheckout(identity, env, cors);
      if (
        request.method === "POST" &&
        url.pathname === "/billing/mercado-pago/subscribe"
      )
        return createMercadoPagoSubscription(request, identity, env, cors);
      if (
        request.method === "POST" &&
        url.pathname === "/billing/mercado-pago/cancel"
      )
        return cancelMercadoPagoSubscription(identity.uid, env, cors);
      if (request.method === "DELETE" && url.pathname === "/account")
        return deleteAccount(identity, env, cors);
      if (url.pathname === "/user-content")
        return userContent(request, identity.uid, env, cors);
      if (url.pathname === "/profile")
        return profile(request, identity, env, cors);
      if (url.pathname === "/reading-progress")
        return readingProgress(request, identity.uid, env, cors);
      if (request.method === "POST" && url.pathname === "/profile/avatar")
        return uploadAvatar(request, identity.uid, env, cors);
      if (request.method === "POST" && url.pathname === "/explain-law")
        return explainLaw(request, identity, env, cors);
      return json({ error: "Rota não encontrada." }, 404, cors);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      console.error(
        JSON.stringify({
          event: "request_error",
          request_id: requestId,
          method: request.method,
          path: new URL(request.url).pathname,
          duration_ms: Date.now() - startedAt,
          status,
          message: error instanceof Error ? error.message : "UnknownError",
        }),
      );
      const clientStatus =
        status === 500 &&
        new URL(request.url).pathname === "/billing/mercado-pago/subscribe" &&
        error instanceof Error &&
        error.message ===
          "O Mercado Pago não autorizou a criação da assinatura. Revise o cartão ou tente outro meio de pagamento."
          ? 422
          : status;
      return json(
        {
          error:
            clientStatus === 500
              ? "Serviço indisponível."
              : (error as Error).message,
        },
        clientStatus,
        cors,
      );
    } finally {
      ctx.waitUntil(
        Promise.resolve(
          console.info(
            JSON.stringify({
              event: "request_completed",
              request_id: requestId,
              method: request.method,
              path: new URL(request.url).pathname,
              duration_ms: Date.now() - startedAt,
            }),
          ),
        ),
      );
    }
  },
} satisfies ExportedHandler<WorkerEnv>;

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
type Identity = {
  uid: string;
  token: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
};

async function provisionInitialAdmin(
  request: Request,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  const supplied = request.headers.get("X-Initial-Admin-Bootstrap") ?? "";
  const [suppliedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(supplied)),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(env.INITIAL_ADMIN_BOOTSTRAP_TOKEN)),
  ]);
  const suppliedBytes = new Uint8Array(suppliedHash);
  const expectedBytes = new Uint8Array(expectedHash);
  let mismatch = 0;
  for (let index = 0; index < suppliedBytes.length; index++)
    mismatch |= suppliedBytes[index] ^ expectedBytes[index];
  if (!supplied || mismatch !== 0)
    throw new HttpError(404, "Rota não encontrada.");

  const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as {
    client_email?: string;
    private_key?: string;
  };
  if (!serviceAccount.client_email || !serviceAccount.private_key)
    throw new HttpError(503, "Credencial administrativa do Firebase inválida.");
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/identitytoolkit",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${payload}`;
  const assertion = `${signingInput}.${await signGoogleJwt(signingInput, serviceAccount.private_key)}`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!tokenResponse.ok)
    throw new HttpError(503, "Não foi possível autenticar o Firebase.");
  const token = await tokenResponse.json<{ access_token?: string }>();
  if (!token.access_token)
    throw new HttpError(503, "O Firebase não retornou uma credencial de serviço.");

  const lookupResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_WEB_API_KEY)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: [env.INITIAL_ADMIN_EMAIL] }),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!lookupResponse.ok)
    throw new HttpError(503, "Não foi possível localizar a conta no Firebase.");
  const lookup = await lookupResponse.json<{
    users?: Array<{ localId?: string; email?: string; customAttributes?: string }>;
  }>();
  const user = lookup.users?.find(
    (candidate) => candidate.email?.toLowerCase() === env.INITIAL_ADMIN_EMAIL.toLowerCase(),
  );
  if (!user?.localId)
    throw new HttpError(404, "A conta administrativa não existe no Firebase.");

  const reservation = await env.DB.prepare(
    "INSERT OR IGNORE INTO initial_admin_claim (id, uid, claimed_at) VALUES (1, ?, CURRENT_TIMESTAMP)",
  ).bind(user.localId).run();
  if (!reservation.meta.changes) {
    const existing = await env.DB.prepare(
      "SELECT uid FROM initial_admin_claim WHERE id=1",
    ).first<{ uid: string }>();
    if (existing?.uid !== user.localId)
      throw new HttpError(409, "A ativação inicial já foi usada por outra conta.");
  }

  let claims: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(user.customAttributes ?? "{}") as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      claims = parsed as Record<string, unknown>;
  } catch {
    throw new HttpError(503, "As permissões atuais da conta não puderam ser lidas.");
  }
  claims.admin = true;
  const updateResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${encodeURIComponent(env.FIREBASE_WEB_API_KEY)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        localId: user.localId,
        customAttributes: JSON.stringify(claims),
      }),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!updateResponse.ok)
    throw new HttpError(503, "O Firebase não conseguiu atribuir a permissão administrativa.");
  return json({ ok: true }, 200, cors);
}

async function grantInitialAdmin(
  identity: Identity,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  if (identity.email.toLowerCase() !== env.INITIAL_ADMIN_EMAIL.toLowerCase())
    throw new HttpError(403, "Este e-mail não pode receber a função inicial de administrador.");
  if (!identity.emailVerified)
    throw new HttpError(403, "Verifique o e-mail antes de ativar o acesso administrativo.");
  if (!hasRecentAuthentication(identity.token))
    throw new HttpError(401, "Entre novamente antes de ativar o acesso administrativo.");

  const claim = await env.DB.prepare(
    "INSERT OR IGNORE INTO initial_admin_claim (id, uid, claimed_at) VALUES (1, ?, CURRENT_TIMESTAMP)",
  ).bind(identity.uid).run();
  if (!claim.meta.changes) {
    const existing = await env.DB.prepare(
      "SELECT uid FROM initial_admin_claim WHERE id=1",
    ).first<{ uid: string }>();
    if (existing?.uid !== identity.uid)
      throw new HttpError(409, "A ativação inicial do administrador já foi utilizada.");
  }

  try {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as {
      client_email?: string;
      private_key?: string;
    };
    if (!serviceAccount.client_email || !serviceAccount.private_key)
      throw new Error("Invalid Firebase service account");
    const now = Math.floor(Date.now() / 1000);
    const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = base64Url(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/identitytoolkit",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }));
    const signingInput = `${header}.${payload}`;
    const assertion = `${signingInput}.${await signGoogleJwt(signingInput, serviceAccount.private_key)}`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!tokenResponse.ok) throw new Error("Firebase service authentication failed");
    const token = await tokenResponse.json<{ access_token?: string }>();
    if (!token.access_token) throw new Error("Firebase service token missing");
    const updateResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${encodeURIComponent(env.FIREBASE_WEB_API_KEY)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          localId: identity.uid,
          customAttributes: JSON.stringify({ admin: true }),
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!updateResponse.ok) throw new Error("Firebase admin claim update failed");
    return json({ ok: true }, 200, cors);
  } catch {
    await env.DB.prepare("DELETE FROM initial_admin_claim WHERE id=1 AND uid=?")
      .bind(identity.uid).run();
    throw new HttpError(503, "O Firebase não conseguiu ativar o acesso administrativo.");
  }
}

function hasRecentAuthentication(token: string, maxAgeSeconds = 300) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return false;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(normalized)) as { auth_time?: unknown };
    const authTime = Number(claims.auth_time);
    const now = Math.floor(Date.now() / 1000);
    return (
      Number.isInteger(authTime) &&
      authTime <= now + 60 &&
      now - authTime <= maxAgeSeconds
    );
  } catch {
    return false;
  }
}

function decodeIdentityClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    if (!payload) return {};
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(atob(normalized)) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

async function adminCatalog(
  request: Request,
  url: URL,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  const path = url.pathname;
  if (request.method === "GET" && path === "/admin/catalog/laws") {
    const result = await env.DB.prepare(
      "SELECT id,title,acronym,payload_json FROM laws ORDER BY id",
    ).all<{ id: string; title: string; acronym: string | null; payload_json: string }>();
    const versions = await env.DB.prepare(
      "SELECT id,law_id,version_label,scope_key,status,payload_json FROM law_versions",
    ).all<{ id: string; law_id: string; version_label: string; scope_key: string; status: string; payload_json: string }>();
    const versionsByLaw = new Map<string, Array<Record<string, unknown>>>();
    for (const row of versions.results) {
      const data = parseJsonObject(row.payload_json);
      const items = versionsByLaw.get(row.law_id) ?? [];
      items.push({
        ...data,
        id: row.id,
        version_label: row.version_label,
        scope_key: row.scope_key,
        status: row.status,
        source_file: typeof data.source_file === "string" ? data.source_file : null,
        is_complete: data.is_complete === true || data.is_complete === 1,
        imported_at: typeof data.imported_at === "string" ? data.imported_at : "",
      });
      versionsByLaw.set(row.law_id, items);
    }
    const laws = result.results.map((row) => {
      const data = parseJsonObject(row.payload_json);
      const lawVersions = versionsByLaw.get(row.id) ?? [];
      lawVersions.sort((left, right) =>
        String(right.imported_at ?? "").localeCompare(String(left.imported_at ?? "")),
      );
      return {
        law_id: row.id,
        official_name: typeof data.official_name === "string" ? data.official_name : row.title,
        short_title: typeof data.short_title === "string" ? data.short_title : row.acronym ?? "",
        updated_at: typeof data.updated_at === "string" ? data.updated_at : "",
        versions: lawVersions,
      };
    });
    return json(laws, 200, cors);
  }

  if (request.method === "GET" && path === "/admin/catalog/nodes") {
    const lawId = url.searchParams.get("lawId")?.trim() ?? "";
    const versionId = url.searchParams.get("versionId")?.trim() ?? "";
    if (!lawId || !versionId)
      throw new HttpError(422, "Lei e versão são obrigatórias.");
    const version = await env.DB.prepare(
      "SELECT id FROM law_versions WHERE id=? AND law_id=?",
    ).bind(versionId, lawId).first();
    if (!version) throw new HttpError(404, "Versão não encontrada.");
    const rows = await env.DB.prepare(
      "SELECT n.payload_json AS node_json,n.node_key,n.node_type,n.number,n.label,nv.id,nv.sort_order,nv.revoked_at,nv.payload_json AS version_json FROM legal_nodes n JOIN legal_node_versions nv ON nv.node_key=n.node_key WHERE n.law_id=? AND nv.law_version_id=? AND nv.revoked_at IS NULL ORDER BY nv.sort_order,n.node_key",
    ).bind(lawId, versionId).all<{
      node_json: string;
      node_key: string;
      node_type: string;
      number: string | null;
      label: string | null;
      id: string;
      sort_order: number;
      revoked_at: string | null;
      version_json: string;
    }>();
    return json(rows.results.map((row) => {
      const node = parseJsonObject(row.node_json);
      const content = parseJsonObject(row.version_json);
      return {
        id: row.id,
        node_key: row.node_key,
        parent_key: typeof node.parent_key === "string" ? node.parent_key : null,
        node_type: row.node_type,
        number: row.number ?? (typeof node.number === "string" ? node.number : null),
        label: row.label ?? (typeof node.label === "string" ? node.label : null),
        epigraphe: typeof content.epigraphe === "string" ? content.epigraphe : "",
        text_content: typeof content.text_content === "string" ? content.text_content : "",
        sort_order: row.sort_order,
        revoked_at: row.revoked_at,
      };
    }), 200, cors);
  }

  const lawMatch = path.match(/^\/admin\/catalog\/laws\/([^/]+)$/);
  if (request.method === "PATCH" && lawMatch) {
    const lawId = decodeURIComponent(lawMatch[1]);
    const body = await adminJsonBody(request);
    const officialName = field(body.official_name).trim();
    const shortTitle = field(body.short_title).trim();
    if (!officialName || !shortTitle || officialName.length > 300 || shortTitle.length > 160)
      throw new HttpError(422, "Nome oficial e título curto são obrigatórios.");
    const updatedAt = new Date().toISOString();
    const result = await env.DB.prepare(
      "UPDATE laws SET title=?,acronym=?,payload_json=json_set(payload_json,'$.official_name',?,'$.short_title',?,'$.updated_at',?) WHERE id=?",
    ).bind(officialName, shortTitle, officialName, shortTitle, updatedAt, lawId).run();
    if (!result.meta.changes) throw new HttpError(404, "Lei não encontrada.");
    return json({ ok: true }, 200, cors);
  }

  const versionMatch = path.match(/^\/admin\/catalog\/versions\/([^/]+)$/);
  if (request.method === "PATCH" && versionMatch) {
    const versionId = decodeURIComponent(versionMatch[1]);
    const body = await adminJsonBody(request);
    const versionLabel = field(body.version_label).trim();
    const scopeKey = field(body.scope_key).trim();
    const status = field(body.status);
    const sourceFile = body.source_file === null ? null : field(body.source_file).trim() || null;
    const isComplete = body.is_complete === true;
    if (!versionLabel || !scopeKey || !["draft", "published", "archived"].includes(status))
      throw new HttpError(422, "Versão, escopo ou estado inválido.");
    const importedAt = new Date().toISOString();
    const previous = await env.DB.prepare(
      "SELECT status,law_id,version_label FROM law_versions WHERE id=?",
    ).bind(versionId).first<{ status: string; law_id: string; version_label: string }>();
    const result = await env.DB.prepare(
      "UPDATE law_versions SET version_label=?,scope_key=?,status=?,payload_json=json_set(payload_json,'$.version_label',?,'$.source_file',?,'$.scope_key',?,'$.status',?,'$.is_complete',?,'$.imported_at',?) WHERE id=?",
    ).bind(versionLabel, scopeKey, status, versionLabel, sourceFile, scopeKey, status, isComplete ? 1 : 0, importedAt, versionId).run();
    if (!result.meta.changes) throw new HttpError(404, "Versão não encontrada.");
    if (previous && previous.status !== status && (status === "published" || status === "archived")) {
      const law = await env.DB.prepare("SELECT title,acronym FROM laws WHERE id=?")
        .bind(previous.law_id).first<{ title: string; acronym: string | null }>();
      const publishedVersion = status === "archived"
        ? await env.DB.prepare("SELECT id FROM law_versions WHERE law_id=? AND status='published' LIMIT 1")
          .bind(previous.law_id).first()
        : null;
      if (law && (status !== "archived" || !publishedVersion)) {
        const changeType = status === "published" ? "published" : "law_revoked";
        await env.DB.prepare(
          "INSERT INTO legal_change_notifications(id,law_id,law_title,law_acronym,law_version_id,change_type,node_key,node_label,summary) VALUES(?,?,?,?,?,?,?,?,?)",
        ).bind(crypto.randomUUID(), previous.law_id, law.title, law.acronym ?? "", versionId, changeType, null, versionLabel, status === "published" ? `${law.title} teve uma nova versão publicada (${versionLabel}).` : `${law.title} (${versionLabel}) foi revogada.`).run();
      }
    }
    return json({ ok: true }, 200, cors);
  }

  if (request.method === "POST" && path === "/admin/catalog/nodes") {
    const body = await adminJsonBody(request);
    const lawId = field(body.law_id).trim();
    const nodeKey = field(body.node_key).trim();
    const nodeType = field(body.node_type).trim();
    const parentKey = typeof body.parent_key === "string" ? body.parent_key : null;
    const number = typeof body.number === "string" && body.number ? body.number : null;
    const label = typeof body.label === "string" && body.label ? body.label : null;
    if (!lawId || !nodeKey.startsWith(`${lawId}.`) || !nodeType || nodeKey.length > 512)
      throw new HttpError(422, "Os dados do elemento são inválidos.");
    const exists = await env.DB.prepare("SELECT id FROM laws WHERE id=?").bind(lawId).first();
    if (!exists) throw new HttpError(404, "Lei não encontrada.");
    const payload = JSON.stringify({ node_key: nodeKey, law_id: lawId, parent_key: parentKey, node_type: nodeType, number, label, created_at: new Date().toISOString() });
    try {
      await env.DB.prepare(
        "INSERT INTO legal_nodes(id,law_id,node_key,node_type,number,label,published,payload_json) VALUES(?,?,?,?,?,?,1,?)",
      ).bind(crypto.randomUUID(), lawId, nodeKey, nodeType, number, label, payload).run();
    } catch {
      throw new HttpError(409, "Já existe um elemento com esta chave.");
    }
    return json({ ok: true }, 201, cors);
  }

  if (request.method === "POST" && path === "/admin/catalog/node-versions") {
    const body = await adminJsonBody(request);
    const versionId = field(body.law_version_id).trim();
    const nodeKey = field(body.node_key).trim();
    const sortOrder = Number(body.sort_order);
    const version = await env.DB.prepare(
      "SELECT id,law_id,version_label,status FROM law_versions WHERE id=?",
    ).bind(versionId).first<{ id: string; law_id: string; version_label: string; status: string }>();
    if (!version || !nodeKey || !Number.isInteger(sortOrder) || sortOrder < 0)
      throw new HttpError(422, "Os dados do conteúdo são inválidos.");
    const node = await env.DB.prepare(
      "SELECT id FROM legal_nodes WHERE law_id=? AND node_key=?",
    ).bind(version.law_id, nodeKey).first();
    if (!node) throw new HttpError(404, "Elemento estrutural não encontrado.");
    const content = {
      id: crypto.randomUUID(),
      law_version_id: versionId,
      node_key: nodeKey,
      epigraphe: field(body.epigraphe),
      text_content: field(body.text_content),
      sort_order: sortOrder,
      revoked_at: null,
    };
    await env.DB.prepare(
      "INSERT INTO legal_node_versions(id,law_version_id,node_key,sort_order,published,revoked_at,payload_json) VALUES(?,?,?,?,1,NULL,?)",
    ).bind(content.id, versionId, nodeKey, sortOrder, JSON.stringify(content)).run();
    if (version.status === "published" && (content.epigraphe.trim() || content.text_content.trim())) {
      const metadata = await env.DB.prepare("SELECT number,label,node_type FROM legal_nodes WHERE node_key=?")
        .bind(nodeKey).first<{ number: string | null; label: string | null; node_type: string }>();
      await recordLegalChange(env, {
        lawId: version.law_id, versionId, nodeKey, type: "added",
        label: [metadata?.node_type || field(body.node_type).trim(), metadata?.number || metadata?.label].filter(Boolean).join(" ") || "dispositivo",
      });
    }
    return json({ ok: true }, 201, cors);
  }

  const nodeMatch = path.match(/^\/admin\/catalog\/nodes\/([^/]+)$/);
  if (request.method === "PATCH" && nodeMatch) {
    const nodeKey = decodeURIComponent(nodeMatch[1]);
    const lawId = nodeKey.split(".")[0];
    const body = await adminJsonBody(request);
    const number = typeof body.number === "string" && body.number ? body.number : null;
    const label = typeof body.label === "string" && body.label ? body.label : null;
    const result = await env.DB.prepare(
      "UPDATE legal_nodes SET number=?,label=?,payload_json=json_set(payload_json,'$.number',?,'$.label',?) WHERE law_id=? AND node_key=?",
    ).bind(number, label, number, label, lawId, nodeKey).run();
    if (!result.meta.changes) throw new HttpError(404, "Elemento não encontrado.");
    return json({ ok: true }, 200, cors);
  }

  const contentMatch = path.match(/^\/admin\/catalog\/node-versions\/([^/]+)$/);
  if (request.method === "PATCH" && contentMatch) {
    const id = decodeURIComponent(contentMatch[1]);
    const body = await adminJsonBody(request);
    const previous = await env.DB.prepare(
      "SELECT nv.law_version_id,nv.node_key,nv.payload_json,nv.revoked_at,lv.law_id,lv.version_label,lv.status,n.number,n.label,n.node_type FROM legal_node_versions nv JOIN law_versions lv ON lv.id=nv.law_version_id JOIN legal_nodes n ON n.node_key=nv.node_key WHERE nv.id=?",
    ).bind(id).first<{ law_version_id: string; node_key: string; payload_json: string; revoked_at: string | null; law_id: string; version_label: string; status: string; number: string | null; label: string | null; node_type: string }>();
    const parts: string[] = [];
    const values: unknown[] = [];
    for (const key of ["epigraphe", "text_content"] as const) {
      if (typeof body[key] === "string") {
        if (body[key].length > 100_000) throw new HttpError(413, "O conteúdo excede o limite permitido.");
        parts.push(`'$.${key}',?`);
        values.push(body[key]);
      }
    }
    if (body.revoked_at === null || typeof body.revoked_at === "string") {
      parts.push("'$.revoked_at',?");
      values.push(body.revoked_at);
    }
    if (body.sort_order !== undefined) {
      const order = Number(body.sort_order);
      if (!Number.isInteger(order) || order < 0 || order > 2_000_000_000)
        throw new HttpError(422, "A ordem do elemento é inválida.");
      parts.push("'$.sort_order',?");
      values.push(order);
    }
    if (!parts.length) throw new HttpError(422, "Nenhuma alteração informada.");
    const assignments = [
      ...(body.sort_order !== undefined ? ["sort_order=?"] : []),
      ...(body.revoked_at === null || typeof body.revoked_at === "string" ? ["revoked_at=?"] : []),
      `payload_json=json_set(payload_json,${parts.join(",")})`,
    ];
    const bindValues = [
      ...(body.sort_order !== undefined ? [Number(body.sort_order)] : []),
      ...(body.revoked_at === null || typeof body.revoked_at === "string" ? [body.revoked_at] : []),
      ...values,
      id,
    ];
    const result = await env.DB.prepare(
      `UPDATE legal_node_versions SET ${assignments.join(",")} WHERE id=?`,
    ).bind(...bindValues).run();
    if (!result.meta.changes) throw new HttpError(404, "Conteúdo não encontrado.");
    if (previous?.status === "published") {
      const before = parseJsonObject(previous.payload_json);
      const changedText = (typeof body.text_content === "string" && body.text_content !== before.text_content) ||
        (typeof body.epigraphe === "string" && body.epigraphe !== before.epigraphe);
      const revoked = typeof body.revoked_at === "string" && body.revoked_at !== previous.revoked_at;
      const added = !revoked && changedText &&
        !String(before.epigraphe ?? "").trim() && !String(before.text_content ?? "").trim() &&
        Boolean(String(body.epigraphe ?? "").trim() || String(body.text_content ?? "").trim());
      if (revoked || changedText) await recordLegalChange(env, {
        lawId: previous.law_id, versionId: previous.law_version_id, nodeKey: previous.node_key,
        type: revoked ? "revoked" : added ? "added" : "changed",
        label: [previous.node_type, previous.number || previous.label].filter(Boolean).join(" "),
      });
    }
    return json({ ok: true }, 200, cors);
  }

  throw new HttpError(404, "Rota administrativa não encontrada.");
}

async function recordLegalChange(env: WorkerEnv, input: {
  lawId: string; versionId: string; nodeKey: string; type: "added" | "changed" | "revoked";
  label: string;
}) {
  const data = await env.DB.prepare("SELECT title,acronym FROM laws WHERE id=?")
    .bind(input.lawId).first<{ title: string; acronym: string | null }>();
  const version = await env.DB.prepare("SELECT version_label FROM law_versions WHERE id=?")
    .bind(input.versionId).first<{ version_label: string }>();
  if (!data || !version) return;
  const verb = input.type === "added" ? "foi adicionado" : input.type === "revoked" ? "foi revogado" : "foi alterado";
  await env.DB.prepare(
    "INSERT INTO legal_change_notifications(id,law_id,law_title,law_acronym,law_version_id,change_type,node_key,node_label,summary) VALUES(?,?,?,?,?,?,?,?,?)",
  ).bind(crypto.randomUUID(), input.lawId, data.title, data.acronym ?? "", input.versionId, input.type, input.nodeKey, input.label, `${data.acronym || data.title}: ${verb} o ${input.label}.` + (input.type === "changed" || input.type === "added" ? ` Versão ${version.version_label}.` : "")).run();
}

async function legalChangeNotifications(
  request: Request, url: URL, uid: string, env: WorkerEnv, cors: Record<string, string>,
) {
  if (request.method === "GET" && url.pathname === "/notifications/legal-changes") {
    const rows = await env.DB.prepare(
      "SELECT n.id,n.law_id,n.law_title,n.law_acronym,n.change_type,n.node_key,n.node_label,n.summary,n.created_at,CASE WHEN r.notification_id IS NULL THEN 0 ELSE 1 END AS is_read FROM legal_change_notifications n LEFT JOIN user_legal_notification_reads r ON r.notification_id=n.id AND r.uid=? ORDER BY n.created_at DESC LIMIT 30",
    ).bind(uid).all<{ id: string; law_id: string; law_title: string; law_acronym: string; change_type: string; node_key: string | null; node_label: string; summary: string; created_at: string; is_read: number }>();
    const unread = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM legal_change_notifications n LEFT JOIN user_legal_notification_reads r ON r.notification_id=n.id AND r.uid=? WHERE r.notification_id IS NULL",
    ).bind(uid).first<{ count: number }>();
    return json({ notifications: rows.results, unread_count: unread?.count ?? 0 }, 200, cors);
  }
  const match = url.pathname.match(/^\/notifications\/legal-changes\/([^/]+)\/read$/);
  if (request.method === "POST" && match) {
    const id = decodeURIComponent(match[1]);
    await env.DB.prepare(
      "INSERT OR IGNORE INTO user_legal_notification_reads(uid,notification_id) SELECT ?,id FROM legal_change_notifications WHERE id=?",
    ).bind(uid, id).run();
    return json({ ok: true }, 200, cors);
  }
  if (request.method === "POST" && url.pathname === "/notifications/legal-changes/read-all") {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO user_legal_notification_reads(uid,notification_id) SELECT ?,id FROM legal_change_notifications",
    ).bind(uid).run();
    return json({ ok: true }, 200, cors);
  }
  throw new HttpError(404, "Rota de notificações não encontrada.");
}

async function adminJsonBody(request: Request) {
  return request.json<Record<string, unknown>>().catch(() => {
    throw new HttpError(400, "JSON inválido.");
  });
}

function parseJsonObject(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

async function deleteAccount(
  identity: Identity,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  if (!hasRecentAuthentication(identity.token))
    throw new HttpError(
      401,
      "Confirme sua identidade novamente antes de excluir a conta.",
    );

  const activeSubscription = await env.DB.prepare(
    "SELECT provider,status FROM user_subscriptions WHERE uid=? AND (status IN ('trialing','active','grace_period','on_hold') OR (status='canceled' AND (current_period_end IS NULL OR current_period_end > CURRENT_TIMESTAMP))) LIMIT 1",
  )
    .bind(identity.uid)
    .first<{ provider: string; status: string }>();
  if (activeSubscription)
    throw new HttpError(
      409,
      "Cancele ou aguarde o encerramento da assinatura antes de excluir a conta.",
    );

  const avatarPrefix = `avatars/${identity.uid}/`;
  let cursor: string | undefined;
  do {
    const page = await env.ASSETS.list({ prefix: avatarPrefix, cursor });
    if (page.objects.length)
      await env.ASSETS.delete(page.objects.map(({ key }) => key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  await env.DB.batch([
    env.DB.prepare("DELETE FROM user_profiles WHERE uid=?").bind(identity.uid),
    env.DB.prepare("DELETE FROM user_reading_progress WHERE uid=?").bind(
      identity.uid,
    ),
    env.DB.prepare("DELETE FROM user_content WHERE uid=?").bind(identity.uid),
    env.DB.prepare("DELETE FROM ai_daily_usage WHERE uid=?").bind(identity.uid),
    env.DB.prepare("DELETE FROM usage_counters WHERE uid=?").bind(identity.uid),
    env.DB.prepare("DELETE FROM trial_redemptions WHERE uid=?").bind(
      identity.uid,
    ),
    env.DB.prepare(
      "DELETE FROM mercado_pago_checkout_sessions WHERE uid=?",
    ).bind(identity.uid),
    env.DB.prepare("DELETE FROM user_subscriptions WHERE uid=?").bind(
      identity.uid,
    ),
    env.DB.prepare("DELETE FROM billing_events WHERE uid=?").bind(identity.uid),
  ]);
  return json({ ok: true }, 200, cors);
}

async function authenticate(
  request: Request,
  env: WorkerEnv,
): Promise<Identity> {
  const value = request.headers.get("Authorization");
  if (!value?.startsWith("Bearer "))
    throw new HttpError(401, "Autenticação necessária.");
  const token = value.slice(7);
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_WEB_API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    },
  );
  if (!response.ok) throw new HttpError(401, "Sessão inválida ou expirada.");
  const body = await response.json<{
    users?: Array<{ localId?: string; email?: string; displayName?: string; emailVerified?: boolean }>;
  }>();
  const user = body.users?.[0];
  if (!user?.localId || !user.email)
    throw new HttpError(401, "Sessão inválida ou expirada.");
  return {
    uid: user.localId,
    token,
    email: user.email,
    displayName: user.displayName ?? "",
    emailVerified: user.emailVerified === true,
  };
}

async function sendEmailVerification(
  identity: Identity,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  const rateKey = await sha256(`verification:${identity.uid}`);
  if (!(await reserveEmailDelivery(env.DB, rateKey, 60))) {
    return json({ ok: true }, 200, cors);
  }
  const link = await generateFirebaseActionLink(
    env.FIREBASE_SERVICE_ACCOUNT_JSON,
    env.FIREBASE_PROJECT_ID,
    identity.email,
    "VERIFY_EMAIL",
  );
  await sendSmtpEmail(
    smtpConfig(env),
    identity.email,
    welcomeVerificationEmail(identity.displayName, link),
  );
  return json({ ok: true }, 200, cors);
}

async function sendInitialAdminVerification(
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  const rateKey = await sha256(`initial-admin-verification:${env.INITIAL_ADMIN_EMAIL}`);
  if (!(await reserveEmailDelivery(env.DB, rateKey, 300)))
    return json({ ok: true }, 200, cors);
  try {
    const link = await generateFirebaseActionLink(
      env.FIREBASE_SERVICE_ACCOUNT_JSON,
      env.FIREBASE_PROJECT_ID,
      env.INITIAL_ADMIN_EMAIL,
      "VERIFY_EMAIL",
    );
    await sendSmtpEmail(
      smtpConfig(env),
      env.INITIAL_ADMIN_VERIFICATION_RECIPIENT,
      welcomeVerificationEmail("Administrador", link),
    );
  } catch (error) {
    console.error(JSON.stringify({
      event: "initial_admin_verification_delivery_failed",
      message: error instanceof Error ? error.message : "UnknownError",
    }));
    throw new HttpError(503, "Não foi possível enviar a verificação.");
  }
  return json({ ok: true }, 200, cors);
}

async function sendWelcomeEmail(
  identity: Identity,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  const rateKey = await sha256(`welcome:${identity.uid}`);
  if (!(await reserveEmailDelivery(env.DB, rateKey, 365 * 24 * 60 * 60)))
    return json({ ok: true }, 200, cors);
  await sendSmtpEmail(
    smtpConfig(env),
    identity.email,
    welcomeEmail(identity.displayName),
  );
  return json({ ok: true }, 200, cors);
}

async function sendPasswordReset(
  request: Request,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  const body = await request.json<Record<string, unknown>>().catch(() => {
    throw new HttpError(400, "JSON inválido.");
  });
  const email = field(body.email).toLowerCase();
  if (!isEmail(email)) throw new HttpError(422, "E-mail inválido.");
  const rateKey = await sha256(`reset:${email}`);
  if (!(await reserveEmailDelivery(env.DB, rateKey, 60)))
    return json({ ok: true }, 200, cors);
  try {
    const link = await generateFirebaseActionLink(
      env.FIREBASE_SERVICE_ACCOUNT_JSON,
      env.FIREBASE_PROJECT_ID,
      email,
      "PASSWORD_RESET",
    );
    await sendSmtpEmail(smtpConfig(env), email, passwordResetEmail("", link));
  } catch (error) {
    // The public response must not reveal whether an account exists for the supplied e-mail.
    console.warn(
      JSON.stringify({
        event: "password_reset_delivery_failed",
        message: error instanceof Error ? error.message : "UnknownError",
      }),
    );
  }
  return json({ ok: true }, 200, cors);
}

function smtpConfig(env: WorkerEnv) {
  if (!env.VERCEL_MAILER_URL || !env.MAILER_INTERNAL_SECRET)
    throw new HttpError(503, "Serviço de e-mail não configurado.");
  return {
    endpoint: env.VERCEL_MAILER_URL,
    internalKey: env.MAILER_INTERNAL_SECRET,
  };
}

async function reserveEmailDelivery(
  db: D1Database,
  rateKey: string,
  seconds: number,
) {
  const now = Math.floor(Date.now() / 1000);
  const result = await db
    .prepare(
      "INSERT INTO auth_email_rate_limits(rate_key,sent_at) VALUES(?,?) ON CONFLICT(rate_key) DO UPDATE SET sent_at=excluded.sent_at WHERE auth_email_rate_limits.sent_at < ?",
    )
    .bind(rateKey, now, now - seconds)
    .run();
  return result.meta.changes === 1;
}

async function uploadAvatar(
  request: Request,
  uid: string,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    throw new HttpError(422, "Arquivo de avatar ausente.");
  if (file.size <= 0 || file.size > 5 * 1024 * 1024)
    throw new HttpError(413, "O avatar deve ter no máximo 5 MB.");
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensions[file.type];
  if (!extension) throw new HttpError(415, "Formato de imagem não permitido.");
  const path = `avatars/${uid}/${crypto.randomUUID()}.${extension}`;
  await env.ASSETS.put(path, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });
  await env.DB.prepare(
    "UPDATE user_profiles SET avatar_path=?,avatar_url=?,updated_at=CURRENT_TIMESTAMP WHERE uid=?",
  )
    .bind(path, `${new URL(request.url).origin}/assets/${path}`, uid)
    .run();
  return json(
    { path, url: `${new URL(request.url).origin}/assets/${path}` },
    201,
    cors,
  );
}

async function profile(
  request: Request,
  identity: Identity,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  const defaultName =
    identity.displayName || identity.email.split("@")[0] || "Aluno Papirar";
  const defaultUsername = `${
    identity.email
      .split("@")[0]
      .replace(/[^a-z0-9_]/gi, "_")
      .toLowerCase()
      .slice(0, 20) || "aluno"
  }_${identity.uid.replace(/-/g, "").slice(0, 6)}`.slice(0, 30);
  if (request.method === "GET") {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO user_profiles(uid,display_name,username,profile_color) VALUES(?,?,?,'#f3f4f6')",
    )
      .bind(identity.uid, defaultName.slice(0, 100), defaultUsername)
      .run();
    const row = await env.DB.prepare("SELECT * FROM user_profiles WHERE uid=?")
      .bind(identity.uid)
      .first();
    return json({ ...row, email: identity.email }, 200, cors);
  }
  if (request.method !== "PATCH")
    throw new HttpError(405, "Método não permitido.");
  const body = await request.json<Record<string, unknown>>().catch(() => {
    throw new HttpError(400, "JSON inválido.");
  });
  const displayName = field(body.displayName),
    username = field(body.username),
    bio = field(body.bio),
    profileColor = field(body.profileColor);
  if (
    !displayName ||
    displayName.length > 100 ||
    !username ||
    username.length > 30 ||
    bio.length > 500 ||
    !/^#[0-9a-f]{6}$/i.test(profileColor)
  )
    throw new HttpError(422, "Dados de perfil inválidos.");
  await env.DB.prepare(
    "INSERT INTO user_profiles(uid,display_name,username,bio,profile_color,updated_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(uid) DO UPDATE SET display_name=excluded.display_name,username=excluded.username,bio=excluded.bio,profile_color=excluded.profile_color,updated_at=CURRENT_TIMESTAMP",
  )
    .bind(identity.uid, displayName, username, bio, profileColor)
    .run();
  const row = await env.DB.prepare("SELECT * FROM user_profiles WHERE uid=?")
    .bind(identity.uid)
    .first();
  return json({ ...row, email: identity.email }, 200, cors);
}

async function readingProgress(
  request: Request,
  uid: string,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  if (request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT law_id,law_title,law_acronym,last_offset,total_seconds,updated_at FROM user_reading_progress WHERE uid=? ORDER BY updated_at DESC",
    )
      .bind(uid)
      .all();
    return json(rows.results, 200, cors);
  }
  if (request.method !== "POST")
    throw new HttpError(405, "Método não permitido.");
  const body = await request.json<Record<string, unknown>>().catch(() => {
    throw new HttpError(400, "JSON inválido.");
  });
  const lawId = field(body.lawId),
    lawTitle = field(body.lawTitle),
    lawAcronym = field(body.lawAcronym);
  const lastOffset = Number(body.lastOffset),
    additionalSeconds = Math.max(
      0,
      Math.min(86400, Number(body.additionalSeconds) || 0),
    );
  if (!lawId || !lawTitle || !Number.isFinite(lastOffset) || lastOffset < 0)
    throw new HttpError(422, "Progresso inválido.");
  await env.DB.prepare(
    "INSERT INTO user_reading_progress(uid,law_id,law_title,law_acronym,last_offset,total_seconds,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(uid,law_id) DO UPDATE SET law_title=excluded.law_title,law_acronym=excluded.law_acronym,last_offset=excluded.last_offset,total_seconds=user_reading_progress.total_seconds+excluded.total_seconds,updated_at=CURRENT_TIMESTAMP",
  )
    .bind(uid, lawId, lawTitle, lawAcronym, lastOffset, additionalSeconds)
    .run();
  return json({ ok: true }, 200, cors);
}

async function serveAsset(
  url: URL,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  let path: string;
  try {
    // URL.pathname mantém escapes percentuais. O R2, porém, armazena a chave
    // com o nome real (por exemplo, "Código Penal"), então a assinatura e a
    // busca precisam usar o mesmo caminho decodificado.
    path = decodeURIComponent(url.pathname.slice(8));
  } catch {
    throw new HttpError(400, "Caminho inválido.");
  }
  if (!path || path.includes(".."))
    throw new HttpError(400, "Caminho inválido.");
  const isProtectedAudio =
    path.startsWith("audio/") || path.startsWith("laws/");
  if (isProtectedAudio) {
    if (!env.AUDIO_SIGNING_SECRET)
      throw new HttpError(
        503,
        "Serviço de áudio temporariamente indisponível.",
      );
    const expiresParam = url.searchParams.get("expires");
    const signature = url.searchParams.get("sig") ?? "";
    if (!expiresParam || !signature)
      throw new HttpError(403, "Acesso ao áudio não autorizado.");
    const expires = Number(expiresParam);
    if (
      !Number.isFinite(expires) ||
      expires < Math.floor(Date.now() / 1000) ||
      !(await verifyAssetSignature(
        path,
        expires,
        signature,
        env.AUDIO_SIGNING_SECRET,
      ))
    ) {
      throw new HttpError(403, "Acesso ao áudio não autorizado.");
    }
  }
  const object = await (isProtectedAudio ? env.AUDIO_ASSETS : env.ASSETS).get(
    path,
  );
  if (!object) throw new HttpError(404, "Arquivo não encontrado.");
  const headers = new Headers(cors);
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  if (isProtectedAudio) headers.set("Cache-Control", "private, no-store");
  return new Response(object.body, { headers });
}

async function explainLaw(
  request: Request,
  identity: Identity,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  if (!env.GROQ_API_KEY)
    throw new HttpError(503, "Serviço de IA não configurado.");
  const body = await request.json<Record<string, unknown>>().catch(() => {
    throw new HttpError(400, "JSON inválido.");
  });
  const leiId = field(body.leiId),
    leiTitle = field(body.leiTitle),
    text = field(body.text),
    lawVersionId = field(body.lawVersionId),
    nodeKey = field(body.nodeKey);
  if (
    !leiId ||
    !leiTitle ||
    !text ||
    !lawVersionId ||
    !nodeKey ||
    text.length > 4000
  )
    throw new HttpError(422, "Lei, versão, nó ou trecho inválido.");
  const officialContext = await loadOfficialContext(
    env.DB,
    leiId,
    lawVersionId,
    nodeKey,
  );
  if (!officialContext || !normalize(officialContext).includes(normalize(text)))
    throw new HttpError(
      422,
      "O trecho não corresponde ao texto oficial publicado.",
    );
  const textHash = await sha256(normalize(text));
  const cacheKey = `${lawVersionId}:${nodeKey}:${textHash}:${PROMPT_VERSION}`;
  const cached = await env.DB.prepare(
    "SELECT response_json FROM ai_explanation_cache WHERE cache_key = ?",
  )
    .bind(cacheKey)
    .first<{ response_json: string }>();
  if (cached)
    return new Response(cached.response_json, {
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "X-Cache": "HIT",
      },
    });
  await consumeQuota(env.DB, identity.uid);
  const provider = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.15,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: messages(leiTitle, nodeKey, officialContext, text),
      }),
      signal: AbortSignal.timeout(40000),
    },
  );
  if (!provider.ok)
    throw new HttpError(502, "Não foi possível gerar a explicação.");
  const explanation = parseExplanation(await provider.json());
  const responseJson = JSON.stringify(explanation);
  await env.DB.prepare(
    "INSERT INTO ai_explanation_cache (cache_key,law_version_id,node_key,text_hash,response_json,model,prompt_version) VALUES (?,?,?,?,?,?,?) ON CONFLICT(cache_key) DO UPDATE SET response_json=excluded.response_json,updated_at=CURRENT_TIMESTAMP",
  )
    .bind(
      cacheKey,
      lawVersionId,
      nodeKey,
      textHash,
      responseJson,
      MODEL,
      PROMPT_VERSION,
    )
    .run();
  return new Response(responseJson, {
    headers: { ...cors, "Content-Type": "application/json", "X-Cache": "MISS" },
  });
}

async function readCatalog(
  url: URL,
  identity: Identity,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  const lawId = url.searchParams.get("lawId")?.trim() ?? "";
  const versionLabel = url.searchParams.get("version")?.trim() ?? "";
  const scope = url.searchParams.get("scope")?.trim() ?? "";
  if (!lawId || !versionLabel || !scope)
    throw new HttpError(422, "Lei, versão e escopo são obrigatórios.");
  const law = await env.DB.prepare(
    "SELECT laws.id,laws.title,laws.acronym,law_versions.id AS version_id,law_versions.version_label,law_versions.scope_key FROM laws JOIN law_versions ON law_versions.law_id=laws.id WHERE laws.id=? AND laws.published=1 AND law_versions.version_label=? AND law_versions.scope_key=? AND law_versions.status='published'",
  )
    .bind(lawId, versionLabel, scope)
    .first<{
      id: string;
      title: string;
      acronym: string;
      version_id: string;
      version_label: string;
      scope_key: string;
    }>();
  if (!law) throw new HttpError(404, "Conteúdo publicado não encontrado.");
  const nodeContents = await env.DB.prepare(
    "SELECT legal_nodes.node_key,legal_nodes.node_type,legal_nodes.number,legal_nodes.label,legal_node_versions.sort_order,legal_node_versions.payload_json FROM legal_node_versions JOIN legal_nodes ON legal_nodes.node_key=legal_node_versions.node_key AND legal_nodes.law_id=? AND legal_nodes.published=1 WHERE legal_node_versions.law_version_id=? AND legal_node_versions.published=1 AND legal_node_versions.revoked_at IS NULL ORDER BY legal_node_versions.sort_order",
  )
    .bind(lawId, law.version_id)
    .all();
  const entitlements = await resolveEntitlements(identity.uid, env.DB);
  const audioRows = entitlements.isPremium
    ? await env.DB.prepare(
        "SELECT node_key,law_version_id,audio_key,title,public_url,duration_ms FROM lei_audio_assets WHERE law_id=? AND law_version_id=? AND status='ready'",
      )
        .bind(lawId, law.version_id)
        .all()
    : { results: [] };
  const audios = {
    results: await Promise.all(
      audioRows.results.map(async (audio: any) => ({
        ...audio,
        public_url: await createAssetUrl(audio.public_url, url.origin, env),
      })),
    ),
  };
  const annexes = await env.DB.prepare(
    "SELECT id,annex_key,payload_json FROM legal_annexes WHERE law_version_id=? ORDER BY sort_order",
  )
    .bind(law.version_id)
    .all();
  const annexRows = await env.DB.prepare(
    "SELECT annex_id,payload_json FROM legal_annex_rows WHERE annex_id IN (SELECT id FROM legal_annexes WHERE law_version_id=?) ORDER BY sort_order",
  )
    .bind(law.version_id)
    .all();
  return json(
    {
      law: { id: law.id, title: law.title, acronym: law.acronym },
      version: {
        id: law.version_id,
        version_label: law.version_label,
        scope_key: law.scope_key,
      },
      nodes: nodeContents.results.map((r: any) => ({
        node_key: r.node_key,
        node_type: r.node_type,
        number: r.number,
        label: r.label,
      })),
      contents: nodeContents.results.map((r: any) => ({
        node_key: r.node_key,
        sort_order: r.sort_order,
        ...JSON.parse(r.payload_json),
      })),
      audios: audios.results,
      annexes: annexes.results.map((r: any) => ({
        id: r.id,
        ...JSON.parse(r.payload_json),
      })),
      annexRows: annexRows.results.map((r: any) => ({
        annex_id: r.annex_id,
        ...JSON.parse(r.payload_json),
      })),
    },
    200,
    cors,
  );
}

async function readCatalogAudio(
  url: URL,
  identity: Identity,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  const lawId = url.searchParams.get("lawId")?.trim() ?? "";
  const versionId = url.searchParams.get("versionId")?.trim() ?? "";
  if (!lawId || !versionId)
    throw new HttpError(422, "Lei e versão são obrigatórias.");

  const entitlements = await resolveEntitlements(identity.uid, env.DB);
  if (!entitlements.isPremium) return json({ audios: [] }, 200, cors);

  const audioRows = await env.DB.prepare(
    "SELECT node_key,law_version_id,audio_key,title,public_url,duration_ms FROM lei_audio_assets WHERE law_id=? AND law_version_id=? AND status='ready'",
  )
    .bind(lawId, versionId)
    .all();

  const audios = await Promise.all(
    audioRows.results.map(async (audio: any) => ({
      ...audio,
      public_url: await createAssetUrl(audio.public_url, url.origin, env),
    })),
  );
  return json({ audios }, 200, cors);
}

async function createAssetUrl(
  publicUrl: string,
  workerOrigin: string,
  env: WorkerEnv,
) {
  if (!publicUrl) return "";
  if (!env.AUDIO_SIGNING_SECRET)
    throw new HttpError(503, "Serviço de áudio temporariamente indisponível.");
  try {
    const parsed = new URL(publicUrl);
    const path = decodeURIComponent(
      parsed.pathname.replace(/^\/+assets\//, "").replace(/^\/+/, ""),
    );
    if (
      !path ||
      path.includes("..") ||
      !(path.startsWith("audio/") || path.startsWith("laws/"))
    )
      throw new Error("Caminho de áudio inválido.");
    const expires = Math.floor(Date.now() / 1000) + 900;
    const sig = await signAsset(path, expires, env.AUDIO_SIGNING_SECRET);
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    return `${workerOrigin}/assets/${encodedPath}?expires=${expires}&sig=${encodeURIComponent(sig)}`;
  } catch {
    throw new HttpError(500, "Não foi possível preparar o áudio.");
  }
}

async function signAsset(path: string, expires: number, secret: string) {
  if (!secret) throw new HttpError(503, "Assinatura de áudio não configurada.");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const bytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${path}:${expires}`),
  );
  return [...new Uint8Array(bytes)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyAssetSignature(
  path: string,
  expires: number,
  signature: string,
  secret: string,
) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const bytes = new Uint8Array(
    signature.match(/.{2}/g)!.map((part) => Number.parseInt(part, 16)),
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    bytes,
    new TextEncoder().encode(`${path}:${expires}`),
  );
}

type Entitlements = {
  plan: "free" | "premium_monthly";
  isPremium: boolean;
  expiresAt: string | null;
  features: {
    fullAudio: boolean;
    audioOffline: boolean;
    playbackSpeedControl: boolean;
    legalChangeComparison: boolean;
    highlightsLimit: number | null;
    annotationsLimit: number | null;
    textOfflineLimit: number | null;
  };
};

const FREE_ENTITLEMENTS: Entitlements = {
  plan: "free",
  isPremium: false,
  expiresAt: null,
  features: {
    fullAudio: false,
    audioOffline: false,
    playbackSpeedControl: false,
    legalChangeComparison: false,
    highlightsLimit: 30,
    annotationsLimit: 10,
    textOfflineLimit: 3,
  },
};

async function getEntitlements(
  uid: string,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  return getSubscriptionOverview(uid, env, cors);
}

type SubscriptionOverview = Entitlements & {
  provider: "google_play" | "mercado_pago" | "manual" | null;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  isTrial: boolean;
  canRedeemTrial: boolean;
  trialExpiresAt: string | null;
};

async function getSubscriptionOverview(
  uid: string,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  const [entitlements, subscription, trial, paidHistory] = await Promise.all([
    resolveEntitlements(uid, env.DB),
    env.DB.prepare(
      "SELECT provider,status,current_period_end,cancel_at_period_end FROM user_subscriptions WHERE uid=? ORDER BY updated_at DESC LIMIT 1",
    )
      .bind(uid)
      .first<{
        provider: "google_play" | "mercado_pago" | "manual";
        status: string;
        current_period_end: string | null;
        cancel_at_period_end: number;
      }>(),
    env.DB.prepare(
      "SELECT redeemed_at,expires_at FROM trial_redemptions WHERE uid=?",
    )
      .bind(uid)
      .first<{ redeemed_at: string; expires_at: string }>(),
    env.DB.prepare(
      "SELECT id FROM user_subscriptions WHERE uid=? AND provider IN ('google_play','mercado_pago') LIMIT 1",
    )
      .bind(uid)
      .first<{ id: string }>(),
  ]);
  const activeSubscription =
    subscription &&
    (entitlements.isPremium ||
      subscription.status === "active" ||
      subscription.status === "on_hold");
  const result: SubscriptionOverview = {
    ...entitlements,
    expiresAt:
      entitlements.expiresAt ?? subscription?.current_period_end ?? null,
    provider: activeSubscription ? subscription.provider : null,
    status: activeSubscription ? subscription.status : null,
    cancelAtPeriodEnd: activeSubscription
      ? subscription.cancel_at_period_end === 1
      : false,
    isTrial: Boolean(
      activeSubscription &&
      subscription?.provider === "manual" &&
      subscription.status === "trialing",
    ),
    canRedeemTrial: !entitlements.isPremium && !trial && !paidHistory,
    trialExpiresAt: trial?.expires_at ?? null,
  };
  return json(result, 200, cors);
}

async function resolveEntitlements(
  uid: string,
  db: D1Database,
): Promise<Entitlements> {
  const subscription = await db
    .prepare(
      "SELECT plan_code,status,current_period_end FROM user_subscriptions WHERE uid=? AND status IN ('trialing','active','grace_period','canceled') AND (current_period_end IS NULL OR current_period_end > CURRENT_TIMESTAMP) ORDER BY current_period_end DESC LIMIT 1",
    )
    .bind(uid)
    .first<{
      plan_code: string;
      status: string;
      current_period_end: string | null;
    }>();
  if (subscription) {
    return {
      plan: "premium_monthly",
      isPremium: true,
      expiresAt: subscription.current_period_end,
      features: {
        fullAudio: true,
        audioOffline: true,
        playbackSpeedControl: true,
        legalChangeComparison: true,
        highlightsLimit: null,
        annotationsLimit: null,
        textOfflineLimit: null,
      },
    };
  }

  return FREE_ENTITLEMENTS;
}

async function redeemTrial(
  uid: string,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  const paidHistory = await env.DB.prepare(
    "SELECT id FROM user_subscriptions WHERE uid=? AND provider IN ('google_play','mercado_pago') LIMIT 1",
  )
    .bind(uid)
    .first<{ id: string }>();
  if (paidHistory)
    throw new HttpError(
      409,
      "O teste grátis é destinado a novas contas sem histórico de assinatura.",
    );

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + 3 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const redemption = await env.DB.prepare(
    "INSERT OR IGNORE INTO trial_redemptions(uid,expires_at) VALUES(?,?)",
  )
    .bind(uid, expiresAt)
    .run();
  if (redemption.meta.changes !== 1)
    throw new HttpError(409, "Este teste grátis já foi resgatado nesta conta.");

  await env.DB.prepare(
    "INSERT INTO user_subscriptions(id,uid,provider,provider_subscription_id,plan_code,status,current_period_start,current_period_end,trial_end,updated_at) VALUES(?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)",
  )
    .bind(
      crypto.randomUUID(),
      uid,
      "manual",
      `trial:${uid}`,
      "premium_monthly",
      "trialing",
      now.toISOString(),
      expiresAt,
      expiresAt,
    )
    .run();

  return getSubscriptionOverview(uid, env, cors);
}

async function verifyGooglePlayPurchase(
  request: Request,
  uid: string,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  if (
    !env.GOOGLE_PLAY_PACKAGE_NAME ||
    !env.GOOGLE_PLAY_PREMIUM_PRODUCT_ID ||
    !env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
  )
    throw new HttpError(
      503,
      "Assinaturas ainda não estão configuradas no servidor.",
    );
  const body = await request.json<Record<string, unknown>>().catch(() => {
    throw new HttpError(400, "JSON inválido.");
  });
  const purchaseToken = field(body.purchaseToken);
  const productId = field(body.productId);
  if (
    !purchaseToken ||
    purchaseToken.length > 4096 ||
    productId !== env.GOOGLE_PLAY_PREMIUM_PRODUCT_ID
  )
    throw new HttpError(422, "Compra inválida.");

  const accessToken = await googleServiceAccessToken(
    env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON,
  );
  const response = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(env.GOOGLE_PLAY_PACKAGE_NAME)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) {
    console.warn(
      JSON.stringify({
        event: "google_play_purchase_verification_failed",
        status: response.status,
      }),
    );
    throw new HttpError(422, "Não foi possível confirmar esta compra.");
  }
  const purchase = await response.json<GooglePlaySubscription>();
  const lineItem = purchase.lineItems?.find(
    (item) => item.productId === env.GOOGLE_PLAY_PREMIUM_PRODUCT_ID,
  );
  const expiresAt = lineItem?.expiryTime ?? null;
  if (
    !lineItem ||
    !expiresAt ||
    !isGooglePlayEntitled(purchase.subscriptionState, expiresAt)
  )
    throw new HttpError(
      422,
      "Esta assinatura não possui acesso Premium ativo.",
    );

  const tokenHash = await sha256(purchaseToken);
  const status = googlePlayStatus(purchase.subscriptionState);
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO user_subscriptions(id,uid,provider,provider_subscription_id,plan_code,status,current_period_start,current_period_end,cancel_at_period_end,updated_at) VALUES(?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(provider,provider_subscription_id) DO UPDATE SET uid=excluded.uid,plan_code=excluded.plan_code,status=excluded.status,current_period_start=excluded.current_period_start,current_period_end=excluded.current_period_end,cancel_at_period_end=excluded.cancel_at_period_end,updated_at=CURRENT_TIMESTAMP",
    ).bind(
      crypto.randomUUID(),
      uid,
      "google_play",
      tokenHash,
      "premium_monthly",
      status,
      purchase.startTime ?? null,
      expiresAt,
      purchase.subscriptionState === "SUBSCRIPTION_STATE_CANCELED" ? 1 : 0,
    ),
    env.DB.prepare(
      "INSERT OR IGNORE INTO billing_events(id,provider,event_key,uid,payload_json) VALUES(?,?,?,?,?)",
    ).bind(
      crypto.randomUUID(),
      "google_play",
      tokenHash,
      uid,
      JSON.stringify({
        state: purchase.subscriptionState,
        expiryTime: expiresAt,
        productId: lineItem.productId,
        orderId: purchase.latestOrderId ?? null,
      }),
    ),
  ]);
  return json(await resolveEntitlements(uid, env.DB), 200, cors);
}

type MercadoPagoPreapproval = {
  id?: string;
  status?: string;
  external_reference?: string;
  date_created?: string;
  last_modified?: string;
  next_payment_date?: string;
  auto_recurring?: { start_date?: string; end_date?: string };
};

function mercadoPagoToken(env: WorkerEnv) {
  if (!env.MERCADO_PAGO_ACCESS_TOKEN)
    throw new HttpError(
      503,
      "Pagamentos no site ainda não estão configurados.",
    );
  return env.MERCADO_PAGO_ACCESS_TOKEN;
}

async function createMercadoPagoCheckout(
  identity: Identity,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  mercadoPagoToken(env);
  if (!env.MERCADO_PAGO_PUBLIC_KEY)
    throw new HttpError(
      503,
      "A chave pública do Mercado Pago ainda não foi configurada.",
    );
  const payerEmail = env.MERCADO_PAGO_TEST_PAYER_EMAIL || identity.email;
  if (!isEmail(payerEmail))
    throw new HttpError(
      422,
      "Sua conta precisa ter um e-mail válido para assinar.",
    );
  const sessionId = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO mercado_pago_checkout_sessions(id,uid,payer_email) VALUES(?,?,?)",
  )
    .bind(sessionId, identity.uid, payerEmail.toLowerCase())
    .run();
  return json(
    {
      sessionId,
      publicKey: env.MERCADO_PAGO_PUBLIC_KEY,
      payerEmail: payerEmail.toLowerCase(),
      amount: 24.99,
    },
    201,
    cors,
  );
}

async function createMercadoPagoSubscription(
  request: Request,
  identity: Identity,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  const body = await request.json<Record<string, unknown>>().catch(() => {
    throw new HttpError(400, "JSON inválido.");
  });
  const sessionId = field(body.sessionId);
  const cardToken = field(body.cardToken);
  if (!/^[0-9a-f-]{36}$/i.test(sessionId))
    throw new HttpError(
      422,
      "Sessão de pagamento inválida. Recarregue o checkout.",
    );
  if (!/^[A-Za-z0-9_-]{16,512}$/.test(cardToken))
    throw new HttpError(
      422,
      "Token de cartão inválido. Revise os dados e tente novamente.",
    );

  const checkoutSession = await env.DB.prepare(
    "SELECT payer_email FROM mercado_pago_checkout_sessions WHERE id=? AND uid=? AND status='created' AND preapproval_id IS NULL AND created_at >= datetime('now','-15 minutes')",
  )
    .bind(sessionId, identity.uid)
    .first<{ payer_email: string }>();
  if (!checkoutSession || !isEmail(checkoutSession.payer_email))
    throw new HttpError(
      409,
      "Esta sessão expirou ou não pode ser validada. Inicie um novo checkout.",
    );

  const claim = await env.DB.prepare(
    "UPDATE mercado_pago_checkout_sessions SET status='processing',updated_at=CURRENT_TIMESTAMP WHERE id=? AND uid=? AND status='created' AND preapproval_id IS NULL AND created_at >= datetime('now','-15 minutes')",
  )
    .bind(sessionId, identity.uid)
    .run();
  if (!claim.meta.changes)
    throw new HttpError(
      409,
      "Esta sessão expirou ou já foi enviada. Inicie um novo checkout.",
    );

  let provider: Response;
  try {
    provider = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mercadoPagoToken(env)}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "Papirar Premium mensal",
        external_reference: sessionId,
        payer_email: checkoutSession.payer_email.toLowerCase(),
        card_token_id: cardToken,
        status: "authorized",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 24.99,
          currency_id: "BRL",
        },
        back_url: "https://www.papirar.com/assinar/retorno",
      }),
      signal: AbortSignal.timeout(20000),
    });
  } catch (error) {
    await env.DB.prepare(
      "UPDATE mercado_pago_checkout_sessions SET status='unknown',updated_at=CURRENT_TIMESTAMP WHERE id=? AND uid=? AND status='processing'",
    )
      .bind(sessionId, identity.uid)
      .run();
    console.warn(
      JSON.stringify({
        event: "mercado_pago_subscription_network_failed",
        session_id: sessionId,
        name: error instanceof Error ? error.name : "UnknownError",
      }),
    );
    throw new HttpError(
      503,
      "Não foi possível confirmar o resultado com o Mercado Pago. Confira sua assinatura antes de tentar novamente.",
    );
  }
  if (!provider.ok) {
    // Keep a short, sanitized provider diagnostic in server logs so checkout
    // failures can be attributed without storing card tokens or full payloads.
    const providerError: Record<string, unknown> = await provider
      .clone()
      .json<Record<string, unknown>>()
      .catch((): Record<string, unknown> => ({}));
    const cause =
      typeof providerError.cause === "string" &&
      /^[a-zA-Z0-9_-]{1,80}$/.test(providerError.cause)
        ? providerError.cause
        : null;
    const providerMessage =
      typeof providerError.message === "string"
        ? providerError.message.slice(0, 160).replace(/[\r\n\t]/g, " ")
        : null;
    await env.DB.prepare(
      "UPDATE mercado_pago_checkout_sessions SET status='failed',updated_at=CURRENT_TIMESTAMP WHERE id=? AND uid=? AND status='processing'",
    )
      .bind(sessionId, identity.uid)
      .run();
    console.warn(
      JSON.stringify({
        event: "mercado_pago_subscription_create_failed",
        status: provider.status,
        cause,
        message: providerMessage,
        uid: identity.uid,
        session_id: sessionId,
      }),
    );
    throw new HttpError(
      422,
      "O Mercado Pago não autorizou a criação da assinatura. Revise o cartão ou tente outro meio de pagamento.",
    );
  }

  const subscription = await provider.json<MercadoPagoPreapproval>();
  if (!subscription.id) {
    await env.DB.prepare(
      "UPDATE mercado_pago_checkout_sessions SET status='unknown',updated_at=CURRENT_TIMESTAMP WHERE id=? AND uid=? AND status='processing'",
    )
      .bind(sessionId, identity.uid)
      .run();
    throw new HttpError(
      502,
      "O Mercado Pago retornou uma resposta sem identificação da assinatura.",
    );
  }
  if (subscription.external_reference !== sessionId) {
    await env.DB.prepare(
      "UPDATE mercado_pago_checkout_sessions SET status='unknown',updated_at=CURRENT_TIMESTAMP WHERE id=? AND uid=? AND status='processing'",
    )
      .bind(sessionId, identity.uid)
      .run();
    throw new HttpError(
      502,
      "Não foi possível confirmar a vinculação da assinatura à sua conta.",
    );
  }
  const session = { id: sessionId, uid: identity.uid };
  await env.DB.prepare(
    "UPDATE mercado_pago_checkout_sessions SET preapproval_id=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND uid=? AND status='processing'",
  )
    .bind(
      subscription.id,
      subscription.status ?? "pending",
      sessionId,
      identity.uid,
    )
    .run();

  if (subscription.status === "authorized") {
    await synchronizeMercadoPagoSubscription(
      subscription.id,
      subscription,
      env,
      session,
    );
    return json(
      {
        status: "authorized",
        subscription: await resolveEntitlements(identity.uid, env.DB),
      },
      201,
      cors,
    );
  }

  return json({ status: subscription.status ?? "pending" }, 202, cors);
}

async function cancelMercadoPagoSubscription(
  uid: string,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  const current = await env.DB.prepare(
    "SELECT provider_subscription_id FROM user_subscriptions WHERE uid=? AND provider='mercado_pago' AND status IN ('trialing','active','grace_period','on_hold','canceled') ORDER BY updated_at DESC LIMIT 1",
  )
    .bind(uid)
    .first<{ provider_subscription_id: string }>();
  if (!current?.provider_subscription_id)
    throw new HttpError(
      404,
      "Não há uma assinatura Mercado Pago ativa para cancelar.",
    );
  const session = await env.DB.prepare(
    "SELECT id,uid FROM mercado_pago_checkout_sessions WHERE preapproval_id=? AND uid=?",
  )
    .bind(current.provider_subscription_id, uid)
    .first<{ id: string; uid: string }>();
  if (!session) throw new HttpError(404, "Assinatura não encontrada.");

  const provider = await fetch(
    `https://api.mercadopago.com/preapproval/${encodeURIComponent(current.provider_subscription_id)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${mercadoPagoToken(env)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "cancelled" }),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!provider.ok) {
    console.warn(
      JSON.stringify({
        event: "mercado_pago_subscription_cancel_failed",
        status: provider.status,
        uid,
      }),
    );
    throw new HttpError(502, "Não foi possível cancelar a renovação agora.");
  }
  const subscription = await provider.json<MercadoPagoPreapproval>();
  await synchronizeMercadoPagoSubscription(
    current.provider_subscription_id,
    subscription,
    env,
    session,
  );
  return getSubscriptionOverview(uid, env, cors);
}

async function processMercadoPagoWebhook(request: Request, env: WorkerEnv) {
  const url = new URL(request.url);
  if (
    !(await isValidMercadoPagoWebhook(
      request,
      url,
      env.MERCADO_PAGO_WEBHOOK_SECRET,
    ))
  ) {
    console.warn(
      JSON.stringify({ event: "mercado_pago_webhook_invalid_signature" }),
    );
    return new Response(null, { status: 401 });
  }
  const body: Record<string, unknown> = await request
    .json<Record<string, unknown>>()
    .catch(() => ({}) as Record<string, unknown>);
  const notificationType = field(body.type);
  if (notificationType && notificationType !== "subscription_preapproval")
    return new Response(null, { status: 200 });
  const data = body.data as Record<string, unknown> | undefined;
  const preapprovalId =
    field(data?.id) ||
    field(body.id) ||
    url.searchParams.get("data.id") ||
    url.searchParams.get("id") ||
    "";
  if (!preapprovalId || preapprovalId.length > 128)
    return new Response(null, { status: 200 });
  const provider = await fetch(
    `https://api.mercadopago.com/preapproval/${encodeURIComponent(preapprovalId)}`,
    {
      headers: { Authorization: `Bearer ${mercadoPagoToken(env)}` },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!provider.ok) {
    console.warn(
      JSON.stringify({
        event: "mercado_pago_webhook_lookup_failed",
        status: provider.status,
        preapproval_id: preapprovalId,
      }),
    );
    return new Response(null, { status: 503 });
  }
  const subscription = await provider.json<MercadoPagoPreapproval>();
  let session = await env.DB.prepare(
    "SELECT id,uid FROM mercado_pago_checkout_sessions WHERE preapproval_id=?",
  )
    .bind(preapprovalId)
    .first<{ id: string; uid: string }>();
  if (!session && subscription.external_reference) {
    session = await env.DB.prepare(
      "SELECT id,uid FROM mercado_pago_checkout_sessions WHERE id=?",
    )
      .bind(subscription.external_reference)
      .first<{ id: string; uid: string }>();
  }
  if (!session) {
    console.warn(
      JSON.stringify({
        event: "mercado_pago_webhook_unmatched_subscription",
        preapproval_id: preapprovalId,
        has_external_reference: Boolean(subscription.external_reference),
      }),
    );
    // Never grant an entitlement by matching a mutable email address. Let the
    // provider retry while the session identifiers are reconciled.
    return new Response(null, { status: 503 });
  }
  await synchronizeMercadoPagoSubscription(
    preapprovalId,
    subscription,
    env,
    session,
  );
  return new Response(null, { status: 200 });
}

async function synchronizeMercadoPagoSubscription(
  preapprovalId: string,
  subscription: MercadoPagoPreapproval,
  env: WorkerEnv,
  knownSession?: { id: string; uid: string },
) {
  const session =
    knownSession ??
    (await env.DB.prepare(
      "SELECT id,uid FROM mercado_pago_checkout_sessions WHERE preapproval_id=?",
    )
      .bind(preapprovalId)
      .first<{ id: string; uid: string }>());
  if (!session) throw new HttpError(404, "Assinatura não encontrada.");
  if (
    subscription.external_reference &&
    subscription.external_reference !== session.id
  )
    throw new HttpError(
      409,
      "A assinatura não corresponde à sessão de checkout.",
    );
  const status = mercadoPagoStatus(subscription.status);
  // `next_payment_date` is the end of the already-paid interval when a renewal is cancelled.
  const periodEnd =
    subscription.next_payment_date ??
    subscription.auto_recurring?.end_date ??
    (status === "expired" ? new Date().toISOString() : null);
  const eventKey = `${preapprovalId}:${subscription.status ?? "unknown"}:${subscription.last_modified ?? ""}`;
  const results = await env.DB.batch([
    env.DB.prepare(
      "UPDATE mercado_pago_checkout_sessions SET preapproval_id=COALESCE(preapproval_id,?),status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND uid=? AND (preapproval_id IS NULL OR preapproval_id=?)",
    ).bind(
      preapprovalId,
      subscription.status ?? "unknown",
      session.id,
      session.uid,
      preapprovalId,
    ),
    env.DB.prepare(
      "INSERT INTO user_subscriptions(id,uid,provider,provider_subscription_id,plan_code,status,current_period_start,current_period_end,cancel_at_period_end,updated_at) SELECT ?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP FROM mercado_pago_checkout_sessions WHERE id=? AND uid=? AND preapproval_id=? ON CONFLICT(provider,provider_subscription_id) DO UPDATE SET uid=excluded.uid,plan_code=excluded.plan_code,status=excluded.status,current_period_start=excluded.current_period_start,current_period_end=excluded.current_period_end,cancel_at_period_end=excluded.cancel_at_period_end,updated_at=CURRENT_TIMESTAMP",
    ).bind(
      crypto.randomUUID(),
      session.uid,
      "mercado_pago",
      preapprovalId,
      "premium_monthly",
      status,
      subscription.auto_recurring?.start_date ??
        subscription.date_created ??
        null,
      periodEnd,
      subscription.status === "cancelled" ? 1 : 0,
      session.id,
      session.uid,
      preapprovalId,
    ),
    env.DB.prepare(
      "INSERT OR IGNORE INTO billing_events(id,provider,event_key,uid,payload_json) SELECT ?,?,?,?,? FROM mercado_pago_checkout_sessions WHERE id=? AND uid=? AND preapproval_id=?",
    ).bind(
      crypto.randomUUID(),
      "mercado_pago",
      eventKey,
      session.uid,
      JSON.stringify({
        id: preapprovalId,
        status: subscription.status ?? null,
        lastModified: subscription.last_modified ?? null,
      }),
      session.id,
      session.uid,
      preapprovalId,
    ),
  ]);
  if (!results[0]?.meta.changes)
    throw new HttpError(
      409,
      "A assinatura já está vinculada a outra sessão de checkout.",
    );
  console.info(
    JSON.stringify({
      event: "mercado_pago_subscription_synchronized",
      uid: session.uid,
      preapproval_id: preapprovalId,
      status,
    }),
  );
}

async function isValidMercadoPagoWebhook(
  request: Request,
  url: URL,
  secret: string | undefined,
) {
  const signature = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const dataId = (
    url.searchParams.get("data.id") ??
    url.searchParams.get("data_id") ??
    ""
  ).toLowerCase();
  if (!secret || !signature || !requestId || !dataId) return false;
  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const index = part.indexOf("=");
      return index < 0
        ? ["", ""]
        : [part.slice(0, index).trim(), part.slice(index + 1).trim()];
    }),
  );
  const timestamp = parts.ts;
  const expected = parts.v1;
  if (!timestamp || !expected || !/^[a-f0-9]{64}$/i.test(expected))
    return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const signatureBytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest)),
  );
  const actual = [...signatureBytes]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  return constantTimeEqual(actual, expected.toLowerCase());
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1)
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function mercadoPagoStatus(status: string | undefined) {
  if (status === "authorized") return "active";
  if (status === "paused") return "on_hold";
  if (status === "cancelled") return "canceled";
  return "expired";
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

type GooglePlaySubscription = {
  subscriptionState?: string;
  startTime?: string;
  latestOrderId?: string;
  lineItems?: Array<{ productId?: string; expiryTime?: string }>;
};

function isGooglePlayEntitled(state: string | undefined, expiresAt: string) {
  const expiry = Date.parse(expiresAt);
  return (
    Number.isFinite(expiry) &&
    expiry > Date.now() &&
    [
      "SUBSCRIPTION_STATE_ACTIVE",
      "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
      "SUBSCRIPTION_STATE_CANCELED",
    ].includes(state ?? "")
  );
}

function googlePlayStatus(state: string | undefined) {
  if (state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD") return "grace_period";
  if (state === "SUBSCRIPTION_STATE_CANCELED") return "canceled";
  return "active";
}

async function googleServiceAccessToken(serviceAccountJson: string) {
  let serviceAccount: { client_email?: string; private_key?: string };
  try {
    serviceAccount = JSON.parse(serviceAccountJson) as {
      client_email?: string;
      private_key?: string;
    };
  } catch {
    throw new HttpError(503, "Credencial do Google Play inválida.");
  }
  if (!serviceAccount.client_email || !serviceAccount.private_key)
    throw new HttpError(503, "Credencial do Google Play inválida.");
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/androidpublisher",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;
  const signature = await signGoogleJwt(
    signingInput,
    serviceAccount.private_key,
  );
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${signingInput}.${signature}`,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!tokenResponse.ok)
    throw new HttpError(503, "Não foi possível autenticar no Google Play.");
  const token = await tokenResponse.json<{ access_token?: string }>();
  if (!token.access_token)
    throw new HttpError(503, "Não foi possível autenticar no Google Play.");
  return token.access_token;
}

async function signGoogleJwt(input: string, pem: string) {
  const der = Uint8Array.from(
    atob(
      pem.replace(
        /-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,
        "",
      ),
    ),
    (character) => character.charCodeAt(0),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64Url(
    new Uint8Array(
      await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        key,
        new TextEncoder().encode(input),
      ),
    ),
  );
}

function base64Url(value: string | Uint8Array) {
  const binary =
    typeof value === "string" ? value : String.fromCharCode(...value);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function userContent(
  request: Request,
  uid: string,
  env: WorkerEnv,
  cors: Record<string, string>,
) {
  if (request.method === "GET") {
    const lawId = request.url
      ? new URL(request.url).searchParams.get("lawId")
      : null;
    const versionId = request.url
      ? new URL(request.url).searchParams.get("lawVersionId")
      : null;
    const query =
      lawId && versionId
        ? "SELECT * FROM user_content WHERE uid=? AND law_id=? AND law_version_id=? ORDER BY created_at DESC"
        : "SELECT * FROM user_content WHERE uid=? ORDER BY created_at DESC";
    const result =
      lawId && versionId
        ? await env.DB.prepare(query).bind(uid, lawId, versionId).all()
        : await env.DB.prepare(query).bind(uid).all();
    return json(result.results, 200, cors);
  }
  const body = await request.json<Record<string, unknown>>().catch(() => {
    throw new HttpError(400, "JSON inválido.");
  });
  if (request.method === "POST") {
    const id = field(body.id) || crypto.randomUUID();
    const type = field(body.type);
    const lawId = field(body.lawId);
    const versionId = field(body.lawVersionId);
    const nodeKey = field(body.nodeKey);
    const selectedText = field(body.selectedText);
    const color = field(body.color);
    const highlightStyle = field(body.highlightStyle) || "highlight";
    const annotationColor = field(body.annotationColor) || "yellow";
    const annotationType = field(body.annotationType) || "general";
    const rawTags = Array.isArray(body.tags) ? body.tags : [];
    const tags = [
      ...new Set(
        rawTags
          .filter((tag): tag is string => typeof tag === "string")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .map((tag) => tag.slice(0, 48)),
      ),
    ].slice(0, 12);
    const reminderValue = field(body.reminderAt);
    const reminderAt = reminderValue ? new Date(reminderValue) : null;
    if (
      !["highlight", "annotation"].includes(type) ||
      !lawId ||
      !versionId ||
      !nodeKey ||
      !selectedText
    )
      throw new HttpError(422, "Dados de marcação inválidos.");
    if (selectedText.length > 10000 || field(body.note).length > 10000)
      throw new HttpError(422, "Conteúdo excede o tamanho permitido.");
    if (
      type === "highlight" &&
      (![
        "yellow",
        "blue",
        "green",
        "red",
        "purple",
        "orange",
        "beige",
      ].includes(color) ||
        !["highlight", "underline"].includes(highlightStyle))
    )
      throw new HttpError(422, "Cor ou estilo de marcação inválido.");
    if (
      type === "annotation" &&
      (!["yellow", "red", "blue", "green", "purple", "gray"].includes(
        annotationColor,
      ) ||
        !["general", "question", "important", "summary", "review"].includes(
          annotationType,
        ) ||
        (reminderAt !== null && Number.isNaN(reminderAt.getTime())))
    )
      throw new HttpError(422, "Metadados de anotação inválidos.");
    const result = await env.DB.prepare(
      "INSERT INTO user_content(id,uid,type,law_id,law_version_id,node_key,selected_text,start_offset,end_offset,color,highlight_style,note,annotation_color,annotation_type,tags_json,reminder_at,archived_at,block_index,part_index,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET type=excluded.type,law_id=excluded.law_id,law_version_id=excluded.law_version_id,node_key=excluded.node_key,selected_text=excluded.selected_text,start_offset=excluded.start_offset,end_offset=excluded.end_offset,color=excluded.color,highlight_style=excluded.highlight_style,note=excluded.note,annotation_color=excluded.annotation_color,annotation_type=excluded.annotation_type,tags_json=excluded.tags_json,reminder_at=excluded.reminder_at,archived_at=NULL,block_index=excluded.block_index,part_index=excluded.part_index,updated_at=CURRENT_TIMESTAMP WHERE user_content.uid=excluded.uid",
    )
      .bind(
        id,
        uid,
        type,
        lawId,
        versionId,
        nodeKey,
        selectedText,
        Number(body.startOffset) || 0,
        Number(body.endOffset) || 0,
        color || null,
        highlightStyle,
        field(body.note) || null,
        type === "annotation" ? annotationColor : null,
        type === "annotation" ? annotationType : "general",
        type === "annotation" ? JSON.stringify(tags) : "[]",
        type === "annotation" && reminderAt ? reminderAt.toISOString() : null,
        null,
        Number(body.blockIndex) || 0,
        Number(body.partIndex) || 0,
      )
      .run();
    if (result.meta.changes !== 1)
      throw new HttpError(409, "Este conteúdo pertence a outra conta.");
    return json({ id }, 201, cors);
  }
  if (request.method === "DELETE") {
    const id = field(body.id);
    if (!id) throw new HttpError(422, "ID inválido.");
    await env.DB.prepare("DELETE FROM user_content WHERE id=? AND uid=?")
      .bind(id, uid)
      .run();
    return json({ ok: true }, 200, cors);
  }
  if (request.method === "PATCH") {
    const id = field(body.id);
    if (!id) throw new HttpError(422, "ID inválido.");
    await env.DB.prepare(
      "UPDATE user_content SET note=COALESCE(?,note),archived_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND uid=?",
    )
      .bind(field(body.note) || null, body.archivedAt ?? null, id, uid)
      .run();
    return json({ ok: true }, 200, cors);
  }
  throw new HttpError(405, "Método não permitido.");
}

async function consumeQuota(db: D1Database, uid: string) {
  const day = new Date().toISOString().slice(0, 10);
  const result = await db
    .prepare(
      "INSERT INTO ai_daily_usage(uid,usage_day,request_count) VALUES(?,?,1) ON CONFLICT(uid,usage_day) DO UPDATE SET request_count=request_count+1 WHERE request_count < ?",
    )
    .bind(uid, day, DAILY_LIMIT)
    .run();
  if (result.meta.changes !== 1)
    throw new HttpError(429, "Limite diário de explicações atingido.");
}

async function loadOfficialContext(
  db: D1Database,
  lawId: string,
  lawVersionId: string,
  nodeKey: string,
) {
  const version = await db
    .prepare(
      "SELECT id FROM law_versions WHERE id=? AND law_id=? AND status='published'",
    )
    .bind(lawVersionId, lawId)
    .first<{ id: string }>();
  if (!version) throw new HttpError(422, "Versão legal inválida.");
  const node = await db
    .prepare(
      "SELECT payload_json FROM legal_node_versions WHERE law_version_id=? AND node_key=? AND published=1 AND revoked_at IS NULL LIMIT 1",
    )
    .bind(lawVersionId, nodeKey)
    .first<{ payload_json: string }>();
  if (!node) return "";
  const payload = JSON.parse(node.payload_json) as {
    epigraphe?: unknown;
    text_content?: unknown;
    text?: unknown;
  };
  return [
    field(payload.epigraphe),
    field(payload.text_content) || field(payload.text),
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 12000);
}
function messages(
  lei: string,
  node: string,
  context: string,
  selection: string,
) {
  return [
    {
      role: "system",
      content:
        "Você é professor brasileiro de Direito. Analise silenciosamente o texto oficial, incluindo sujeito, regra, condições, exceções e relações estruturais. Não invente jurisprudência, doutrina, prazos, requisitos ou efeitos. Preserve negações e ressalvas. Diferencie literalidade de inferência. Responda apenas JSON válido com title, summary, keyPoints, practicalExample e disclaimer; use português do Brasil e linguagem didática.",
    },
    {
      role: "user",
      content: `LEI: ${lei}\nDISPOSITIVO: ${node}\nCONTEXTO OFICIAL:\n${context}\nTRECHO SELECIONADO:\n${selection}\nExplique a lógica da norma sem apenas repeti-la.`,
    },
  ];
}
function parseExplanation(value: unknown) {
  const root = value as { choices?: Array<{ message?: { content?: string } }> };
  const raw = root.choices?.[0]?.message?.content ?? "";
  const start = raw.indexOf("{"),
    end = raw.lastIndexOf("}");
  const parsed = JSON.parse(
    start >= 0 && end > start ? raw.slice(start, end + 1) : raw,
  ) as Record<string, unknown>;
  const title = field(parsed.title),
    summary = field(parsed.summary);
  if (!title || !summary)
    throw new HttpError(502, "Resposta incompleta do provedor.");
  return {
    title,
    summary,
    keyPoints: Array.isArray(parsed.keyPoints)
      ? parsed.keyPoints.map(field).filter(Boolean).slice(0, 5)
      : [],
    practicalExample: field(parsed.practicalExample),
    disclaimer:
      field(parsed.disclaimer) ||
      "Material de apoio ao estudo. Consulte sempre o texto oficial atualizado.",
  };
}
function field(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}
function normalize(value: string) {
  return value.normalize("NFC").replace(/\s+/g, " ").trim();
}
async function sha256(value: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
function corsHeaders(
  origin: string,
  configured: string,
): Record<string, string> {
  const allowed = configured
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const localDev = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const selected =
    allowed.includes(origin) || localDev ? origin : (allowed[0] ?? "null");
  return {
    "Access-Control-Allow-Origin": selected,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
function json(body: unknown, status: number, headers: Record<string, string>) {
  return Response.json(body, { status, headers });
}
