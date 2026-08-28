"use client";

import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Monitor,
  Save,
  Smartphone,
  Upload,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/* =========================================================
   TIPOS
========================================================= */

type BannerData = {
  id: string;
  desktop_url: string | null;
  mobile_url: string | null;
  updated_at: string;
};

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const BUCKET =
  "treinamentos-banners";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/* =========================================================
   PÁGINA
========================================================= */

export default function BannersPage() {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    desktopUrl,
    setDesktopUrl,
  ] = useState("");

  const [
    mobileUrl,
    setMobileUrl,
  ] = useState("");

  const [
    desktopFile,
    setDesktopFile,
  ] = useState<File | null>(
    null,
  );

  const [
    mobileFile,
    setMobileFile,
  ] = useState<File | null>(
    null,
  );

  const [
    desktopPreview,
    setDesktopPreview,
  ] = useState("");

  const [
    mobilePreview,
    setMobilePreview,
  ] = useState("");

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    sucesso,
    setSucesso,
  ] = useState("");

  /* =======================================================
     CARREGAR BANNERS
  ======================================================= */

  useEffect(() => {
    async function carregarBanners() {
      setLoading(true);

      setErro("");

      const supabase =
        createClient();

      try {
        const {
          data,
          error,
        } = await supabase
          .from(
            "treinamentos_banners",
          )
          .select(
            `
              id,
              desktop_url,
              mobile_url,
              updated_at
            `,
          )
          .eq(
            "id",
            "home",
          )
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          const banner =
            data as BannerData;

          setDesktopUrl(
            banner.desktop_url ??
              "",
          );

          setMobileUrl(
            banner.mobile_url ??
              "",
          );

          setDesktopPreview(
            banner.desktop_url ??
              "",
          );

          setMobilePreview(
            banner.mobile_url ??
              "",
          );
        }
      } catch (error: any) {
        console.error(
          "Erro ao carregar banners:",
          error,
        );

        setErro(
          error?.message
            ? `Erro ao carregar banners: ${error.message}`
            : "Não foi possível carregar os banners.",
        );
      } finally {
        setLoading(false);
      }
    }

    void carregarBanners();
  }, []);

  /* =======================================================
     VALIDAR ARQUIVO
  ======================================================= */

  function validarArquivo(
    file: File,
  ) {
    if (
      !TIPOS_PERMITIDOS.includes(
        file.type,
      )
    ) {
      throw new Error(
        "Utilize uma imagem JPG, PNG ou WEBP.",
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      throw new Error(
        "A imagem deve ter no máximo 10 MB.",
      );
    }
  }

  /* =======================================================
     SELECIONAR DESKTOP
  ======================================================= */

  function selecionarDesktop(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setErro("");
      setSucesso("");

      validarArquivo(
        file,
      );

      setDesktopFile(
        file,
      );

      setDesktopPreview(
        URL.createObjectURL(
          file,
        ),
      );
    } catch (error: any) {
      setErro(
        error?.message ||
          "Imagem inválida.",
      );

      event.target.value =
        "";
    }
  }

  /* =======================================================
     SELECIONAR MOBILE
  ======================================================= */

  function selecionarMobile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setErro("");
      setSucesso("");

      validarArquivo(
        file,
      );

      setMobileFile(
        file,
      );

      setMobilePreview(
        URL.createObjectURL(
          file,
        ),
      );
    } catch (error: any) {
      setErro(
        error?.message ||
          "Imagem inválida.",
      );

      event.target.value =
        "";
    }
  }

  /* =======================================================
     UPLOAD
  ======================================================= */

  async function enviarArquivo(
    file: File,
    tipo:
      | "desktop"
      | "mobile",
  ) {
    const supabase =
      createClient();

    const extensao =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";

    const nomeArquivo =
      `${tipo}-${crypto.randomUUID()}.${extensao}`;

    const caminho =
      `home/${nomeArquivo}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from(
        BUCKET,
      )
      .upload(
        caminho,
        file,
        {
          cacheControl:
            "3600",

          upsert: false,
        },
      );

    if (uploadError) {
      throw new Error(
        `Erro ao enviar banner ${tipo}: ${uploadError.message}`,
      );
    }

    const {
      data,
    } = supabase.storage
      .from(
        BUCKET,
      )
      .getPublicUrl(
        caminho,
      );

    return {
      url:
        data.publicUrl,

      caminho,
    };
  }

  /* =======================================================
     PEGAR CAMINHO PELO URL
  ======================================================= */

  function obterCaminhoStorage(
    url: string,
  ) {
    if (!url) {
      return null;
    }

    const marcador =
      `/storage/v1/object/public/${BUCKET}/`;

    const indice =
      url.indexOf(
        marcador,
      );

    if (
      indice === -1
    ) {
      return null;
    }

    return decodeURIComponent(
      url.substring(
        indice +
          marcador.length,
      ),
    );
  }

  /* =======================================================
     REMOVER ARQUIVO ANTIGO
  ======================================================= */

  async function removerArquivoAntigo(
    url: string,
  ) {
    if (!url) {
      return;
    }

    const caminho =
      obterCaminhoStorage(
        url,
      );

    if (!caminho) {
      return;
    }

    const supabase =
      createClient();

    const {
      error,
    } = await supabase.storage
      .from(
        BUCKET,
      )
      .remove([
        caminho,
      ]);

    if (error) {
      console.warn(
        "Não foi possível remover banner antigo:",
        error.message,
      );
    }
  }

  /* =======================================================
     SALVAR
  ======================================================= */

  async function salvarBanners() {
    if (
      !desktopFile &&
      !mobileFile
    ) {
      setErro(
        "Selecione pelo menos um novo banner para salvar.",
      );

      return;
    }

    setSaving(true);

    setErro("");
    setSucesso("");

    const supabase =
      createClient();

    let novoDesktopUrl =
      desktopUrl;

    let novoMobileUrl =
      mobileUrl;

    let novoDesktopPath:
      | string
      | null = null;

    let novoMobilePath:
      | string
      | null = null;

    try {
      /* =========================================
         DESKTOP
      ========================================= */

      if (
        desktopFile
      ) {
        const resultado =
          await enviarArquivo(
            desktopFile,
            "desktop",
          );

        novoDesktopUrl =
          resultado.url;

        novoDesktopPath =
          resultado.caminho;
      }

      /* =========================================
         MOBILE
      ========================================= */

      if (
        mobileFile
      ) {
        const resultado =
          await enviarArquivo(
            mobileFile,
            "mobile",
          );

        novoMobileUrl =
          resultado.url;

        novoMobilePath =
          resultado.caminho;
      }

      /* =========================================
         SALVA NO BANCO
      ========================================= */

      const {
        error,
      } = await supabase
        .from(
          "treinamentos_banners",
        )
        .upsert(
          {
            id: "home",

            desktop_url:
              novoDesktopUrl ||
              null,

            mobile_url:
              novoMobileUrl ||
              null,

            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "id",
          },
        );

      if (error) {
        throw error;
      }

      /* =========================================
         APAGA IMAGENS ANTIGAS
      ========================================= */

      if (
        desktopFile &&
        desktopUrl &&
        desktopUrl !==
          novoDesktopUrl
      ) {
        await removerArquivoAntigo(
          desktopUrl,
        );
      }

      if (
        mobileFile &&
        mobileUrl &&
        mobileUrl !==
          novoMobileUrl
      ) {
        await removerArquivoAntigo(
          mobileUrl,
        );
      }

      /* =========================================
         ATUALIZA ESTADO
      ========================================= */

      setDesktopUrl(
        novoDesktopUrl,
      );

      setMobileUrl(
        novoMobileUrl,
      );

      setDesktopPreview(
        novoDesktopUrl,
      );

      setMobilePreview(
        novoMobileUrl,
      );

      setDesktopFile(
        null,
      );

      setMobileFile(
        null,
      );

      setSucesso(
        "Banners atualizados com sucesso.",
      );
    } catch (error: any) {
      console.error(
        "Erro ao salvar banners:",
        error,
      );

      /* =========================================
         LIMPA NOVOS ARQUIVOS CASO BANCO FALHE
      ========================================= */

      const caminhosParaExcluir =
        [
          novoDesktopPath,
          novoMobilePath,
        ].filter(
          Boolean,
        ) as string[];

      if (
        caminhosParaExcluir.length >
        0
      ) {
        await supabase.storage
          .from(
            BUCKET,
          )
          .remove(
            caminhosParaExcluir,
          );
      }

      setErro(
        error?.message
          ? `Não foi possível salvar os banners: ${error.message}`
          : "Não foi possível salvar os banners.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     CANCELAR DESKTOP
  ======================================================= */

  function cancelarDesktop() {
    setDesktopFile(
      null,
    );

    setDesktopPreview(
      desktopUrl,
    );
  }

  /* =======================================================
     CANCELAR MOBILE
  ======================================================= */

  function cancelarMobile() {
    setMobileFile(
      null,
    );

    setMobilePreview(
      mobileUrl,
    );
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={28}
            className="animate-spin !text-emerald-600"
          />

          <p className="text-sm !text-[#71717a]">
            Carregando banners...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7">

      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <div>
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
            <ImageIcon
              size={19}
              className="!text-emerald-600"
            />
          </div>

          <span className="text-sm font-medium !text-emerald-700">
            Banners
          </span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight !text-[#18181b]">
          Banners da Home
        </h2>

        <p className="mt-1 text-sm !text-[#71717a]">
          Envie as versões desktop e mobile do banner principal da página inicial.
        </p>
      </div>

      {/* =====================================================
          MENSAGENS
      ===================================================== */}

      {erro && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 !text-red-600"
          />

          <div>
            <p className="text-sm font-semibold !text-red-800">
              Não foi possível salvar
            </p>

            <p className="mt-1 text-sm !text-red-700">
              {erro}
            </p>
          </div>
        </div>
      )}

      {sucesso && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 !text-emerald-600"
          />

          <p className="text-sm font-medium !text-emerald-800">
            {sucesso}
          </p>
        </div>
      )}

      {/* =====================================================
          GRID
      ===================================================== */}

      <div className="grid gap-6 xl:grid-cols-2">

        {/* =================================================
            DESKTOP
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white">

          {/* TOPO */}

          <div className="flex items-center justify-between border-b border-[#e4e4e7] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0fdf4]">
                <Monitor
                  size={20}
                  className="!text-emerald-600"
                />
              </div>

              <div>
                <h3 className="text-base font-semibold !text-[#18181b]">
                  Banner Desktop
                </h3>

                <p className="mt-0.5 text-xs !text-[#71717a]">
                  Recomendado: 1920 × 800 px
                </p>
              </div>
            </div>
          </div>

          {/* PREVIEW */}

          <div className="p-6">
            <div
              className="
                relative
                aspect-[12/5]
                overflow-hidden
                rounded-xl
                border
                border-dashed
                border-[#d4d4d8]
                bg-[#f8fafc]
              "
            >
              {desktopPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    desktopPreview
                  }
                  alt="Banner desktop"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <ImageIcon
                    size={32}
                    className="!text-[#a1a1aa]"
                  />

                  <div>
                    <p className="text-sm font-medium !text-[#52525b]">
                      Nenhum banner desktop
                    </p>

                    <p className="mt-1 text-xs !text-[#a1a1aa]">
                      Envie uma imagem para começar.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* CONTROLES */}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <label
                className="
                  inline-flex
                  h-10
                  cursor-pointer
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-[#009b69]
                  px-4
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-[#00875a]
                "
              >
                <Upload
                  size={17}
                />

                {desktopPreview
                  ? "Trocar imagem"
                  : "Selecionar imagem"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    selecionarDesktop
                  }
                  className="hidden"
                />
              </label>

              {desktopFile && (
                <button
                  type="button"
                  onClick={
                    cancelarDesktop
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e4e4e7] bg-white px-4 text-sm font-medium !text-[#52525b] hover:bg-[#f8f8f9]"
                >
                  <X
                    size={16}
                  />

                  Cancelar alteração
                </button>
              )}
            </div>

            <p className="mt-4 text-xs leading-relaxed !text-[#8b8b97]">
              JPG, PNG ou WEBP. Máximo de 10 MB. Para melhor qualidade utilize 1920 × 800 pixels.
            </p>
          </div>
        </div>

        {/* =================================================
            MOBILE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white">

          {/* TOPO */}

          <div className="flex items-center justify-between border-b border-[#e4e4e7] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0fdf4]">
                <Smartphone
                  size={20}
                  className="!text-emerald-600"
                />
              </div>

              <div>
                <h3 className="text-base font-semibold !text-[#18181b]">
                  Banner Mobile
                </h3>

                <p className="mt-0.5 text-xs !text-[#71717a]">
                  Recomendado: 1080 × 1350 px
                </p>
              </div>
            </div>
          </div>

          {/* PREVIEW */}

          <div className="p-6">
            <div className="mx-auto max-w-[300px]">
              <div
                className="
                  relative
                  aspect-[4/5]
                  overflow-hidden
                  rounded-xl
                  border
                  border-dashed
                  border-[#d4d4d8]
                  bg-[#f8fafc]
                "
              >
                {mobilePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      mobilePreview
                    }
                    alt="Banner mobile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <Smartphone
                      size={32}
                      className="!text-[#a1a1aa]"
                    />

                    <div>
                      <p className="text-sm font-medium !text-[#52525b]">
                        Nenhum banner mobile
                      </p>

                      <p className="mt-1 text-xs !text-[#a1a1aa]">
                        Envie uma imagem para dispositivos móveis.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CONTROLES */}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <label
                className="
                  inline-flex
                  h-10
                  cursor-pointer
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-[#009b69]
                  px-4
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-[#00875a]
                "
              >
                <Upload
                  size={17}
                />

                {mobilePreview
                  ? "Trocar imagem"
                  : "Selecionar imagem"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    selecionarMobile
                  }
                  className="hidden"
                />
              </label>

              {mobileFile && (
                <button
                  type="button"
                  onClick={
                    cancelarMobile
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e4e4e7] bg-white px-4 text-sm font-medium !text-[#52525b] hover:bg-[#f8f8f9]"
                >
                  <X
                    size={16}
                  />

                  Cancelar alteração
                </button>
              )}
            </div>

            <p className="mt-4 text-xs leading-relaxed !text-[#8b8b97]">
              JPG, PNG ou WEBP. Máximo de 10 MB. Recomendamos 1080 × 1350 pixels.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          SALVAR
      ===================================================== */}

      <div className="flex items-center justify-end rounded-2xl border border-[#e4e4e7] bg-white p-5">
        <button
          type="button"
          onClick={
            salvarBanners
          }
          disabled={
            saving ||
            (!desktopFile &&
              !mobileFile)
          }
          className="
            inline-flex
            min-w-[190px]
            items-center
            justify-center
            gap-2
            rounded-lg
            bg-[#009b69]
            px-5
            py-3
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-[#00875a]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {saving ? (
            <>
              <Loader2
                size={17}
                className="animate-spin"
              />

              Salvando...
            </>
          ) : (
            <>
              <Save
                size={17}
              />

              Salvar banners
            </>
          )}
        </button>
      </div>
    </div>
  );
}