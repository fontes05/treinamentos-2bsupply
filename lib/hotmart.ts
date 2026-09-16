import "server-only";

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
  const clientId = clean(
    process.env.HOTMART_CLIENT_ID,
  );

  const clientSecret = clean(
    process.env.HOTMART_CLIENT_SECRET,
  );

  if (!clientId) {
    throw new Error(
      "HOTMART_CLIENT_ID não configurado.",
    );
  }

  if (!clientSecret) {
    throw new Error(
      "HOTMART_CLIENT_SECRET não configurado.",
    );
  }

  // Gera o Basic automaticamente:
  //
  // Base64(
  //   CLIENT_ID:CLIENT_SECRET
  // )
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
  const {
    clientId,
    clientSecret,
    authorization,
  } = getCredentials();

  const url = new URL(
    "https://api-sec-vlc.hotmart.com/security/oauth/token",
  );

  url.searchParams.set(
    "grant_type",
    "client_credentials",
  );

  url.searchParams.set(
    "client_id",
    clientId,
  );

  url.searchParams.set(
    "client_secret",
    clientSecret,
  );

  const response = await fetch(
    url.toString(),
    {
      method: "POST",

      headers: {
        Authorization: authorization,
        Accept: "application/json",
        "Content-Type": "application/json",
      },

      cache: "no-store",
    },
  );

  const text =
    await response.text();

  if (!response.ok) {
    let hotmartMessage =
      `HTTP ${response.status}`;

    try {
      const data =
        JSON.parse(text);

      hotmartMessage =
        data.error_description ||
        data.message ||
        data.error ||
        hotmartMessage;
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

  const data =
    JSON.parse(
      text,
    ) as HotmartTokenResponse;

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

/* =========================================================
   BUSCAR VENDAS
========================================================= */

export async function getHotmartSales(
  options?: {
    startDate?: number;
    endDate?: number;
    maxResults?: number;
    pageToken?: string;
  }
): Promise<HotmartSalesResponse> {
  const tokenData =
    await getHotmartAccessToken();

  const url = new URL(
    "https://developers.hotmart.com/payments/api/v1/sales/history"
  );

  url.searchParams.set(
    "max_results",
    String(
      options?.maxResults ??
      50
    )
  );

  if (options?.startDate) {
    url.searchParams.set(
      "start_date",
      String(options.startDate)
    );
  }

  if (options?.endDate) {
    url.searchParams.set(
      "end_date",
      String(options.endDate)
    );
  }

  if (options?.pageToken) {
    url.searchParams.set(
      "page_token",
      options.pageToken
    );
  }

  const response =
    await fetch(
      url.toString(),
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${tokenData.access_token}`,

          Accept:
            "application/json",

          "Content-Type":
            "application/json",
        },

        cache:
          "no-store",
      }
    );

  const text =
    await response.text();

  if (!response.ok) {
    let message =
      `HTTP ${response.status}`;

    try {
      const json =
        JSON.parse(text);

      message =
        json.error_description ||
        json.message ||
        json.error ||
        message;
    } catch {
      if (text) {
        message =
          text;
      }
    }

    throw new Error(
      `Hotmart Sales ${response.status}: ${message}`
    );
  }

  return JSON.parse(
    text
  ) as HotmartSalesResponse;
}