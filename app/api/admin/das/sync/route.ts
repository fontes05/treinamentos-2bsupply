import { request as httpsRequest } from "node:https";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SerproResponse = {
  status?: number;
  dados?: string | unknown;
  mensagens?: { texto?: string }[];
};

const authUrl = "https://autenticacao.sapi.serpro.gov.br/authenticate";
const queryUrl = "https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/Consultar";
const requiredEnv = [
  "SERPRO_CONSUMER_KEY",
  "SERPRO_CONSUMER_SECRET",
  "SERPRO_CERT_PFX_BASE64",
  "SERPRO_CERT_PASSWORD",
  "SERPRO_CONTRATANTE_CNPJ",
  "SERPRO_CONTRIBUINTE_CNPJ",
] as const;

function parseData(value: unknown): unknown {
  if (typeof value !== "string") return value;
  return JSON.parse(value);
}

function lastDayOfMonth(month: string) {
  const [year, number] = month.split("-").map(Number);
  return `${month}-${String(new Date(Date.UTC(year, number, 0)).getUTCDate()).padStart(2, "0")}`;
}

function firstDayNextMonth(month: string) {
  const [year, number] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year, number, 1));
  return next.toISOString().slice(0, 10);
}

function authenticate(key: string, secret: string, pfx: Buffer, passphrase: string) {
  return new Promise<{ access_token: string; jwt_token: string }>((resolve, reject) => {
    const body = "grant_type=client_credentials";
    const request = httpsRequest(authUrl, {
      method: "POST",
      pfx,
      passphrase,
      timeout: 15000,
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
        "Role-Type": "TERCEIROS",
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (response) => {
      let raw = "";
      response.setEncoding("utf8");
      response.on("data", (chunk: string) => {
        raw += chunk;
        if (raw.length > 1_000_000) request.destroy(new Error("Resposta fiscal excedeu o limite."));
      });
      response.on("end", () => {
        if (response.statusCode !== 200) {
          reject(new Error(`Autenticação fiscal recusada (${response.statusCode}). Confira o contrato e o certificado.`));
          return;
        }
        try {
          const data = JSON.parse(raw);
          if (!data.access_token || !data.jwt_token) throw new Error("Tokens ausentes.");
          resolve(data);
        } catch {
          reject(new Error("Resposta de autenticação fiscal inválida."));
        }
      });
    });
    request.on("timeout", () => request.destroy(new Error("A autenticação fiscal excedeu o tempo limite.")));
    request.on("error", reject);
    request.end(body);
  });
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = /^Bearer (.+)$/i.exec(authorization)?.[1];
  if (!token) return NextResponse.json({ error: "Faça login para sincronizar o DAS." }, { status: 401 });

  try {
    const admin = getSupabaseAdmin();
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    }

    const scoped = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } },
    );
    const { data: allowed, error: accessError } = await scoped.rpc("treinamentos_is_admin");
    if (accessError || allowed !== true) {
      return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const month = body?.competencia;
    if (typeof month !== "string" || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) {
      return NextResponse.json({ error: "Informe uma competência válida (AAAA-MM)." }, { status: 400 });
    }
    const currentMonth = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit",
    }).format(new Date());
    if (month >= currentMonth) {
      return NextResponse.json({ error: "Selecione um mês encerrado e já apurado." }, { status: 400 });
    }

    const missing = requiredEnv.filter((name) => !process.env[name]);
    if (missing.length) {
      return NextResponse.json({ error: "Integração fiscal pendente: é necessário contratar o Integra Contador e configurar as credenciais e o certificado e-CNPJ no servidor." }, { status: 503 });
    }

    const contractor = process.env.SERPRO_CONTRATANTE_CNPJ!.replace(/\D/g, "");
    const taxpayer = process.env.SERPRO_CONTRIBUINTE_CNPJ!.replace(/\D/g, "");
    const author = (process.env.SERPRO_AUTOR_CNPJ ?? contractor).replace(/\D/g, "");
    if (![contractor, taxpayer, author].every((value) => /^\d{14}$/.test(value))) {
      return NextResponse.json({ error: "Confira os CNPJs configurados para a integração fiscal." }, { status: 503 });
    }

    const credentials = await authenticate(
      process.env.SERPRO_CONSUMER_KEY!, process.env.SERPRO_CONSUMER_SECRET!,
      Buffer.from(process.env.SERPRO_CERT_PFX_BASE64!, "base64"),
      process.env.SERPRO_CERT_PASSWORD!,
    );

    // GERARDAS12 apenas gera o documento de uma declaração já transmitida no PGDAS-D.
    // Não transmite nem altera a declaração fiscal.
    const fiscalResponse = await fetch(queryUrl, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        jwt_token: credentials.jwt_token,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        contratante: { numero: contractor, tipo: 2 },
        autorPedidoDados: { numero: author, tipo: 2 },
        contribuinte: { numero: taxpayer, tipo: 2 },
        pedidoDados: {
          idSistema: "PGDASD", idServico: "GERARDAS12", versaoSistema: "1.0",
          dados: JSON.stringify({ periodoApuracao: month.replace("-", "") }),
        },
      }),
    });
    if (!fiscalResponse.ok) {
      return NextResponse.json({ error: `Consulta fiscal recusada (${fiscalResponse.status}). Confira o acesso ao PGDAS-D e a procuração, se aplicável.` }, { status: 502 });
    }
    const fiscal = await fiscalResponse.json() as SerproResponse;
    if (fiscal.status !== 200) {
      return NextResponse.json({ error: fiscal.mensagens?.[0]?.texto ?? "Não há DAS disponível para essa competência." }, { status: 422 });
    }

    const parsed = parseData(fiscal.dados);
    const item = Array.isArray(parsed) ? parsed[0] : parsed;
    const detail = item?.detalhamentoDas ?? item?.detalhamento;
    const principal = Number(detail?.valores?.principal);
    if (
      item?.cnpjCompleto !== taxpayer ||
      String(detail?.periodoApuracao) !== month.replace("-", "") ||
      !Number.isFinite(principal) || principal < 0 ||
      !/^\d{17}$/.test(String(detail?.numeroDocumento ?? ""))
    ) {
      return NextResponse.json({ error: "Os dados fiscais retornados não conferem com o CNPJ e a competência solicitados." }, { status: 502 });
    }

    const description = `DAS - Simples Nacional (${month.slice(5)}/${month.slice(0, 4)})`;
    const costDate = lastDayOfMonth(month);
    const { data: costs, error: lookupError } = await admin.from("treinamentos_custos")
      .select("id").eq("descricao", description).limit(2);
    if (lookupError) throw lookupError;
    if ((costs?.length ?? 0) > 1) throw new Error("Há custos DAS duplicados para esta competência. Corrija-os antes de sincronizar.");
    // Reaproveita um lançamento manual sem competência no título, caso já exista.
    const { data: legacy, error: legacyError } = costs?.length ? { data: [], error: null } :
      await admin.from("treinamentos_custos").select("id")
        .eq("descricao", "DAS - Simples Nacional")
        .gte("data_inicio", `${month}-01`)
        .lt("data_inicio", firstDayNextMonth(month))
        .limit(2);
    if (legacyError) throw legacyError;
    if ((legacy?.length ?? 0) > 1) throw new Error("Há custos DAS duplicados para esta competência. Corrija-os antes de sincronizar.");

    const payload = {
      descricao: description, categoria: "Obrigações Fiscais", tipo: "variavel",
      recorrencia: "unico", valor: principal, data_inicio: costDate,
      data_fim: costDate, ativo: true,
      observacao: `Competência ${month}; documento ${detail.numeroDocumento}; valor principal apurado via Integra Contador. Emissão não comprova pagamento.`,
    };
    const existingId = costs?.[0]?.id ?? legacy?.[0]?.id;
    const result = existingId
      ? await admin.from("treinamentos_custos").update(payload).eq("id", existingId)
      : await admin.from("treinamentos_custos").insert(payload);
    if (result.error) throw result.error;

    return NextResponse.json({ competencia: month, valor: principal, numeroDocumento: detail.numeroDocumento });
  } catch (error) {
    console.error("Falha na sincronização do DAS:", error);
    return NextResponse.json({ error: error instanceof Error && /duplicados/.test(error.message) ? error.message : "Não foi possível sincronizar o DAS. Verifique a configuração fiscal e tente novamente." }, { status: 500 });
  }
}
