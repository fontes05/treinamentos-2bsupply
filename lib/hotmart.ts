import "server-only";
import { get as httpsGet } from "node:https";

type HotmartTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
};

function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

function getCredentials() {
  const clientId = clean(process.env.HOTMART_CLIENT_ID);
  const clientSecret = clean(process.env.HOTMART_CLIENT_SECRET);

  if (!clientId) throw new Error("HOTMART_CLIENT_ID não configurado.");
  if (!clientSecret) throw new Error("HOTMART_CLIENT_SECRET não configurado.");

  const basicToken = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
  return { clientId, clientSecret, authorization: `Basic ${basicToken}` };
}

function errorDescription(data: Record<string, unknown>, fallback: string) {
  const description = data.error_description || data.message || data.error;
  return description
    ? typeof description === "string" ? description : JSON.stringify(description)
    : fallback;
}

export async function getHotmartAccessToken(): Promise<HotmartTokenResponse> {
  const { clientId, clientSecret, authorization } = getCredentials();
  const url = new URL("https://api-sec-vlc.hotmart.com/security/oauth/token");
  url.searchParams.set("grant_type", "client_credentials");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: authorization,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      message = errorDescription(JSON.parse(text), message);
    } catch {
      message = text || message;
    }
    console.error("Hotmart OAuth:", response.status, message);
    throw new Error(`Hotmart OAuth ${response.status}: ${message}`);
  }

  const data = JSON.parse(text) as HotmartTokenResponse;
  if (!data.access_token) {
    throw new Error("Hotmart autenticou, mas não retornou access_token.");
  }
  return data;
}

export type HotmartSale = {
  product?: { id?: number; name?: string };
  buyer?: { name?: string; email?: string; ucode?: string };
  producer?: { name?: string; ucode?: string };
  purchase?: {
    transaction?: string;
    order_date?: number;
    approved_date?: number;
    status?: string;
    recurrency_number?: number;
    is_subscription?: boolean;
    commission_as?: string;
    price?: { value?: number; currency_code?: string };
    payment?: { method?: string; type?: string; installments_number?: number };
    tracking?: { source?: string; source_sck?: string; external_code?: string };
    offer?: { code?: string; payment_mode?: string };
    hotmart_fee?: {
      total?: number;
      fixed?: number;
      base?: number;
      percentage?: number;
      currency_code?: string;
    };
  };
};

export type HotmartSalesResponse = {
  items?: HotmartSale[];
  page_info?: {
    total_results?: number;
    results_per_page?: number;
    next_page_token?: string;
    prev_page_token?: string;
  };
};

type HotmartSalesOptions = {
  startDate?: number;
  endDate?: number;
  maxResults?: number;
  pageToken?: string;
  omitMaxResults?: boolean;
};

const SALES_HISTORY_URL = "https://developers.hotmart.com/payments/api/v1/sales/history";

export async function getHotmartSales(
  options?: HotmartSalesOptions,
): Promise<HotmartSalesResponse> {
  const startDate = options?.startDate;
  const endDate = options?.endDate;
  const maxResults = options?.maxResults ?? 50;

  if (startDate !== undefined && (!Number.isSafeInteger(startDate) || startDate < 0)) {
    throw new Error("Data inicial inválida: informe um timestamp em milissegundos.");
  }
  if (endDate !== undefined && (!Number.isSafeInteger(endDate) || endDate < 0)) {
    throw new Error("Data final inválida: informe um timestamp em milissegundos.");
  }
  if (startDate !== undefined && endDate !== undefined && startDate >= endDate) {
    throw new Error("O início da consulta Hotmart precisa ser anterior ao fim.");
  }
  if (!Number.isSafeInteger(maxResults) || maxResults < 1) {
    throw new Error("maxResults precisa ser um número inteiro positivo.");
  }

  const token = await getHotmartAccessToken();
  const url = new URL(SALES_HISTORY_URL);
  if (!options?.omitMaxResults) url.searchParams.set("max_results", String(maxResults));
  if (startDate !== undefined) url.searchParams.set("start_date", String(startDate));
  if (endDate !== undefined) url.searchParams.set("end_date", String(endDate));
  if (options?.pageToken) url.searchParams.set("page_token", options.pageToken);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    let details: unknown = null;
    try {
      const data = JSON.parse(text);
      message = errorDescription(data, message);
      details = data.details ?? data.errors ?? data;
    } catch {
      message = text || message;
    }
    console.error("Hotmart Sales: consulta recusada", {
      status: response.status,
      startDate,
      endDate,
      maxResults: options?.omitMaxResults ? null : maxResults,
      hasPageToken: Boolean(options?.pageToken),
      details,
    });
    throw new Error(`Hotmart Sales ${response.status}: ${message}`);
  }
  return JSON.parse(text) as HotmartSalesResponse;
}

type HttpsDiagnosticResult = {
  ok: boolean;
  status?: number;
  quantidade?: number;
  error?: string;
};

// Consulta isolada: sem filtros, sem gravar dados e sem substituir o fetch
// utilizado pela sincronização normal. Nunca retorna o token ou as vendas.
export async function diagnosticarHotmartHttps(): Promise<HttpsDiagnosticResult> {
  try {
    const token = await getHotmartAccessToken();
    return await new Promise<HttpsDiagnosticResult>((resolve, reject) => {
      const request = httpsGet(SALES_HISTORY_URL, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }, (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk: string) => { body += chunk; });
        response.on("error", reject);
        response.on("aborted", () => reject(new Error("Resposta HTTPS interrompida.")));
        response.on("end", () => {
          const status = response.statusCode ?? 502;
          try {
            const data = JSON.parse(body);
            const ok = status >= 200 && status < 300;
            resolve(ok
              ? { ok: true, status, quantidade: data.items?.length ?? 0 }
              : { ok: false, status, error: errorDescription(data, `HTTP ${status}`) });
          } catch {
            resolve({ ok: false, status, error: "Hotmart retornou uma resposta sem JSON válido." });
          }
        });
      });
      const timeout = setTimeout(() => {
        request.destroy(new Error("Tempo limite na consulta HTTPS."));
      }, 15000);
      request.on("close", () => clearTimeout(timeout));
      request.on("error", reject);
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro HTTPS." };
  }
}
