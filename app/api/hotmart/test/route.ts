import { NextResponse } from "next/server";

import {
  getHotmartAccessToken,
} from "@/lib/hotmart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tokenData =
      await getHotmartAccessToken();

    return NextResponse.json({
      ok: true,

      message:
        "Hotmart conectada com sucesso.",

      token_type:
        tokenData.token_type ?? null,

      expires_in:
        tokenData.expires_in ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      {
        status: 500,
      },
    );
  }
}