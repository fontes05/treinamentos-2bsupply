import HomeClient, {
  type BannerHome,
  type Categoria,
  type Testimonial,
  type TreinamentoHome,
} from "./HomeClient";

import { createPublicServerClient } from "@/lib/supabase/public-server";

const FALLBACK_BANNER =
  "/reuniao-estrategica-com-dashboard-global.png";

export const revalidate = 300;

export default async function HomePage() {
  const supabase = createPublicServerClient();

  const [
    bannerResult,
    categoriesResult,
    trainingsResult,
    testimonialsResult,
  ] = await Promise.all([
    supabase
      .from("treinamentos_banners")
      .select("id, desktop_url, mobile_url")
      .eq("id", "home")
      .maybeSingle(),
    supabase
      .from("treinamentos_categorias")
      .select(
        "id, nome, slug, descricao, icone_svg_url, ativo",
      )
      .eq("ativo", true)
      .order("nome", { ascending: true }),
    supabase
      .from("treinamentos_cursos")
      .select(
        "id, titulo, slug, descricao, imagem_url, destaque, categoria_id, nome_botao_curso, linha_destaque_card, voce_vai_aprender, ordem_home",
      )
      .eq("status", "publicado")
      .order("ordem_home", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("treinamentos_depoimentos")
      .select(
        "id, depoimento, nome, cargo, foto_url, estrelas",
      )
      .order("created_at", { ascending: false }),
  ]);

  for (const [source, error] of [
    ["banner", bannerResult.error],
    ["categorias", categoriesResult.error],
    ["treinamentos", trainingsResult.error],
    ["depoimentos", testimonialsResult.error],
  ] as const) {
    if (error) {
      console.error(
        `Erro ao carregar ${source} da Home:`,
        error,
      );
    }
  }

  const banner = bannerResult.data as BannerHome | null;
  const bannerDesktop =
    banner?.desktop_url ||
    banner?.mobile_url ||
    FALLBACK_BANNER;
  const bannerMobile =
    banner?.mobile_url ||
    banner?.desktop_url ||
    FALLBACK_BANNER;

  return (
    <HomeClient
      categories={
        (categoriesResult.data ?? []) as Categoria[]
      }
      bannerDesktop={bannerDesktop}
      bannerMobile={bannerMobile}
      treinamentos={
        (trainingsResult.data ?? []) as TreinamentoHome[]
      }
      testimonials={
        (testimonialsResult.data ?? []) as Testimonial[]
      }
    />
  );
}
