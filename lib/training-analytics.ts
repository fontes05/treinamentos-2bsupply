import { createClient } from "@/lib/supabase/client";

export type TrainingAnalyticsEvent =
  | "curso_click"
  | "inscricao_click"
  | "previa_click";

type RegistrarEventoTreinamentoParams = {
  slug: string;
  titulo: string;
  evento: TrainingAnalyticsEvent;
  origem?: string;
};

export async function registrarEventoTreinamento({
  slug,
  titulo,
  evento,
  origem,
}: RegistrarEventoTreinamentoParams): Promise<void> {
  try {
    const supabase = createClient();

    const origemAtual =
      origem ??
      (typeof window !== "undefined"
        ? window.location.pathname
        : null);

    const { error } = await supabase
      .from("treinamentos_analytics")
      .insert({
        curso_slug: slug,
        curso_titulo: titulo,
        evento,
        origem: origemAtual,
      });

    if (error) {
      console.error(
        "[Training Analytics] Erro ao registrar evento:",
        {
          slug,
          titulo,
          evento,
          error,
        }
      );
    }
  } catch (error) {
    console.error(
      "[Training Analytics] Erro inesperado:",
      error
    );
  }
}