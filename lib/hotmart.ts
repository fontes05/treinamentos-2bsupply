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

  if (!clientId) {
    throw new Error("HOTMART_CLIENT_ID não configurado.");
  }

  if (!clientSecret) {
    throw new Error("HOTMART_CLIENT_SECRET não configurado.");
  }

  const basicToken = Buffer.from(
    `${clientId}:${clientSecret}`,
    "utf8",
  ).toString("base64");

  return {
    clientId,
    clientSecret,
    authorization: `Basic ${basicToken}`,
  };
}

export async function getHotmartAccessToken() {
  const { clientId, clientSecret, authorization } = getCredentials();

  const url = new URL(
    "https://api-sec-vlc.hotmart.com/security/oauth/token",
  );

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
    let hotmartMessage = `HTTP ${response.status}`;

    try {
      const data = JSON.parse(text);

      const description =
        data.error_description ||
        data.message ||
        data.error;

      if (description) {
        hotmartMessage =
          typeof description === "string"
            ? description
            : JSON.stringify(description);
      }
    } catch {
      if (text) {
        hotmartMessage = text;
      }
    }

    console.error(
      "Hotmart OAuth:",
      response.status,
      hotmartMessage,
    );

    throw new Error(
      `Hotmart OAuth ${response.status}: ${hotmartMessage}`,
    );
  }

  const data = JSON.parse(text) as HotmartTokenResponse;

  if (!data.access_token) {
    throw new Error(
      "Hotmart autenticou, mas não retornou access_token.",
    );
  }

  return data;
}

/* =========================================================
   TIPOS — VENDAS
========================================================= */

export type HotmartSale = {
  product?: {
    id?: number;
    name?: string;
  };

  buyer?: {
    name?: string;
    email?: string;
    ucode?: string;
  };

  producer?: {
    name?: string;
    ucode?: string;
  };

  purchase?: {
    transaction?: string;
    order_date?: number;
    approved_date?: number;
    status?: string;
    recurrency_number?: number;
    is_subscription?: boolean;
    commission_as?: string;

    price?: {
      value?: number;
      currency_code?: string;
    };

    payment?: {
      method?: string;
      type?: string;
      installments_number?: number;
    };

    tracking?: {
      source?: string;
      source_sck?: string;
      external_code?: string;
    };

    offer?: {
      code?: string;
      payment_mode?: string;
    };

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

/* =========================================================
   BUSCAR VENDAS
========================================================= */

export async function getHotmartSales(
  options?: HotmartSalesOptions,
): Promise<HotmartSalesResponse> {
  const startDate = options?.startDate;
  const endDate = options?.endDate;
  const maxResults = options?.maxResults ?? 50;

  if (
    startDate !== undefined &&
    (!Number.isSafeInteger(startDate) || startDate < 0)
  ) {
    throw new Error(
      "Data inicial inválida: informe um timestamp em milissegundos.",
    );
  }

  if (
    endDate !== undefined &&
    (!Number.isSafeInteger(endDate) || endDate < 0)
  ) {
    throw new Error(
      "Data final inválida: informe um timestamp em milissegundos.",
    );
  }

  if (
    startDate !== undefined &&
    endDate !== undefined &&
    startDate >= endDate
  ) {
    throw new Error(
      "O início da consulta Hotmart precisa ser anterior ao fim.",
    );
  }

  if (!Number.isSafeInteger(maxResults) || maxResults < 1) {
    throw new Error(
      "maxResults precisa ser um número inteiro positivo.",
    );
  }

  const tokenData = await getHotmartAccessToken();

  const url = new URL(
    "https://developers.hotmart.com/payments/api/v1/sales/history",
  );

  if (!options?.omitMaxResults) {
  url.searchParams.set("max_results", String(maxResults));
}

  if (startDate !== undefined) {
    url.searchParams.set("start_date", String(startDate));
  }

  if (endDate !== undefined) {
    url.searchParams.set("end_date", String(endDate));
  }

  if (options?.pageToken) {
    url.searchParams.set("page_token", options.pageToken);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
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
      const json = JSON.parse(text);

      const description =
        json.error_description ||
        json.message ||
        json.error;

      if (description) {
        message =
          typeof description === "string"
            ? description
            : JSON.stringify(description);
      }

      details =
        json.details ??
        json.errors ??
        json;
    } catch {
      message = text || message;
    }

    console.error("Hotmart Sales: consulta recusada", {
      status: response.status,
      startDate,
      endDate,
      maxResults,
      hasPageToken: Boolean(options?.pageToken),
      details,
    });

    throw new Error(
      `Hotmart Sales ${response.status}: ${message}`,
    );
  }

  return JSON.parse(text) as HotmartSalesResponse;
  
}