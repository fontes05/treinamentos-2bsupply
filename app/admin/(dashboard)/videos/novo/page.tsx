"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Film,
  ImageIcon,
  LoaderCircle,
  Play,
  Save,
  Upload,
  Video,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

/* =========================================================
   TIPOS
========================================================= */

type Curso = {
  id: string;
  titulo: string;
  slug: string;
  status: string;
};

type TipoVideo =
  | "previa"
  | "introducao"
  | "aula_gratuita"
  | "demonstracao"
  | "professor"
  | "depoimento"
  | "institucional"
  | "trailer";

/* =========================================================
   CONSTANTES
========================================================= */

const TIPOS_VIDEO: {
  value: TipoVideo;
  label: string;
  descricao: string;
}[] = [
  {
    value: "previa",
    label: "Prévia",
    descricao: "Trecho curto para apresentar o treinamento.",
  },
  {
    value: "introducao",
    label: "Introdução",
    descricao: "Vídeo introdutório sobre o treinamento.",
  },
  {
    value: "aula_gratuita",
    label: "Aula gratuita",
    descricao: "Aula disponibilizada gratuitamente.",
  },
  {
    value: "demonstracao",
    label: "Demonstração",
    descricao: "Demonstração de uma aula ou conteúdo.",
  },
  {
    value: "professor",
    label: "Apresentação do professor",
    descricao: "Vídeo de apresentação do professor.",
  },
  {
    value: "depoimento",
    label: "Depoimento",
    descricao: "Depoimento relacionado ao treinamento.",
  },
  {
    value: "trailer",
    label: "Trailer",
    descricao: "Trailer promocional do treinamento.",
  },
  {
    value: "institucional",
    label: "Institucional",
    descricao: "Vídeo institucional relacionado ao curso.",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getFileExtension(
  file: File
) {
  const parts =
    file.name.split(".");

  if (
    parts.length > 1
  ) {
    return (
      parts
        .pop()
        ?.toLowerCase()
        .replace(
          /[^a-z0-9]/g,
          ""
        ) || "bin"
    );
  }

  if (
    file.type === "video/mp4"
  ) {
    return "mp4";
  }

  if (
    file.type === "video/webm"
  ) {
    return "webm";
  }

  if (
    file.type === "video/quicktime"
  ) {
    return "mov";
  }

  if (
    file.type === "image/png"
  ) {
    return "png";
  }

  if (
    file.type === "image/webp"
  ) {
    return "webp";
  }

  return "jpg";
}

/* ---------------------------------------------------------
   Formatar tamanho
--------------------------------------------------------- */

function formatFileSize(
  bytes: number
) {
  if (
    bytes < 1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

/* ---------------------------------------------------------
   Validar imagem
--------------------------------------------------------- */

function validarImagem(
  file: File
) {
  const tiposPermitidos = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (
    !tiposPermitidos.includes(
      file.type
    )
  ) {
    throw new Error(
      "A thumbnail deve ser JPG, PNG ou WEBP."
    );
  }

  const limite =
    5 * 1024 * 1024;

  if (
    file.size > limite
  ) {
    throw new Error(
      "A thumbnail deve ter no máximo 5 MB."
    );
  }
}

/* ---------------------------------------------------------
   Validar vídeo
--------------------------------------------------------- */

function validarVideo(
  file: File
) {
  const tiposPermitidos = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];

  if (
    !tiposPermitidos.includes(
      file.type
    )
  ) {
    throw new Error(
      "Use vídeos MP4, WEBM ou MOV."
    );
  }

  /*
   * Limite da interface.
   *
   * O bucket do Supabase também precisa
   * aceitar o tamanho do arquivo.
   */
  const limite =
    200 * 1024 * 1024;

  if (
    file.size > limite
  ) {
    throw new Error(
      "O vídeo deve ter no máximo 200 MB."
    );
  }
}

/* ---------------------------------------------------------
   Thumbnail YouTube
--------------------------------------------------------- */

function getYoutubeThumbnail(
  url: string
) {
  if (
    !url.trim()
  ) {
    return null;
  }

  try {
    const parsed =
      new URL(url);

    let videoId = "";

    if (
      parsed.hostname.includes(
        "youtu.be"
      )
    ) {
      videoId =
        parsed.pathname
          .replace("/", "")
          .split("?")[0];
    }

    if (
      parsed.hostname.includes(
        "youtube.com"
      )
    ) {
      videoId =
        parsed.searchParams.get(
          "v"
        ) || "";

      if (
        !videoId &&
        parsed.pathname.includes(
          "/embed/"
        )
      ) {
        videoId =
          parsed.pathname
            .split(
              "/embed/"
            )[1]
            ?.split("/")[0] ||
          "";
      }

      if (
        !videoId &&
        parsed.pathname.includes(
          "/shorts/"
        )
      ) {
        videoId =
          parsed.pathname
            .split(
              "/shorts/"
            )[1]
            ?.split("/")[0] ||
          "";
      }
    }

    if (
      !videoId
    ) {
      return null;
    }

    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  } catch {
    return null;
  }
}

/* =========================================================
   PÁGINA
========================================================= */

export default function NovoVideoPage() {
  const router =
    useRouter();

  /* =======================================================
     CURSOS
  ======================================================= */

  const [
    cursos,
    setCursos,
  ] =
    useState<Curso[]>(
      []
    );

  const [
    carregandoCursos,
    setCarregandoCursos,
  ] =
    useState(true);

  const [
    cursoId,
    setCursoId,
  ] =
    useState("");

  /* =======================================================
     INFORMAÇÕES
  ======================================================= */

  const [
    titulo,
    setTitulo,
  ] =
    useState("");

  const [
    descricao,
    setDescricao,
  ] =
    useState("");

  const [
    tipo,
    setTipo,
  ] =
    useState<TipoVideo>(
      "previa"
    );

  const [
    duracao,
    setDuracao,
  ] =
    useState("");

  const [
    ordem,
    setOrdem,
  ] =
    useState("1");

  const [
    ativo,
    setAtivo,
  ] =
    useState(true);

  /* =======================================================
     VÍDEO
  ======================================================= */

  const [
    videoUrl,
    setVideoUrl,
  ] =
    useState("");

  const [
    videoFile,
    setVideoFile,
  ] =
    useState<File | null>(
      null
    );

  /* =======================================================
     THUMBNAIL
  ======================================================= */

  const [
    thumbnailFile,
    setThumbnailFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    thumbnailPreview,
    setThumbnailPreview,
  ] =
    useState("");

  /* =======================================================
     SALVAMENTO
  ======================================================= */

  const [
    salvando,
    setSalvando,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const [
    sucesso,
    setSucesso,
  ] =
    useState("");

  /* =======================================================
     CURSO SELECIONADO
  ======================================================= */

  const cursoSelecionado =
    useMemo(
      () =>
        cursos.find(
          (curso) =>
            curso.id ===
            cursoId
        ),
      [
        cursos,
        cursoId,
      ]
    );

  /* =======================================================
     THUMBNAIL AUTOMÁTICA DO YOUTUBE
  ======================================================= */

  const youtubeThumbnail =
    useMemo(
      () =>
        getYoutubeThumbnail(
          videoUrl
        ),
      [videoUrl]
    );

  const previewThumbnail =
    thumbnailPreview ||
    youtubeThumbnail;

  /* =======================================================
     CARREGAR TREINAMENTOS
  ======================================================= */

  useEffect(() => {
    let ativo =
      true;

    async function carregarCursos() {
      const supabase =
        createClient();

      try {
        setCarregandoCursos(
          true
        );

        setErro("");

        /* ===============================================
           VERIFICAR USUÁRIO
        =============================================== */

        const {
          data:
            userData,
          error:
            userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !userData.user
        ) {
          throw new Error(
            "Sua sessão expirou. Faça login novamente."
          );
        }

        /* ===============================================
           VERIFICAR ADMIN
        =============================================== */

        const {
          data:
            isAdmin,
          error:
            adminError,
        } =
          await supabase.rpc(
            "treinamentos_is_admin"
          );

        if (
          adminError ||
          isAdmin !== true
        ) {
          throw new Error(
            "Você não possui permissão para cadastrar vídeos."
          );
        }

        /* ===============================================
           CURSOS
        =============================================== */

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "treinamentos_cursos"
            )
            .select(`
              id,
              titulo,
              slug,
              status
            `)
            .order(
              "titulo",
              {
                ascending:
                  true,
              }
            );

        if (
          error
        ) {
          throw new Error(
            `Erro ao carregar treinamentos: ${error.message}`
          );
        }

        if (
          !ativo
        ) {
          return;
        }

        setCursos(
          (data ??
            []) as Curso[]
        );
      } catch (
        error
      ) {
        if (
          !ativo
        ) {
          return;
        }

        console.error(
          error
        );

        setErro(
          error instanceof
            Error
            ? error.message
            : "Não foi possível carregar os treinamentos."
        );
      } finally {
        if (
          ativo
        ) {
          setCarregandoCursos(
            false
          );
        }
      }
    }

    void carregarCursos();

    return () => {
      ativo =
        false;
    };
  }, []);

  /* =======================================================
     ARQUIVO DE VÍDEO
  ======================================================= */

  function handleVideoFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target
        .files?.[0];

    if (
      !file
    ) {
      return;
    }

    try {
      validarVideo(
        file
      );

      setVideoFile(
        file
      );

      setErro("");
    } catch (
      error
    ) {
      event.target.value =
        "";

      setVideoFile(
        null
      );

      setErro(
        error instanceof
          Error
          ? error.message
          : "Vídeo inválido."
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    }
  }

  /* =======================================================
     THUMBNAIL
  ======================================================= */

  function handleThumbnail(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target
        .files?.[0];

    if (
      !file
    ) {
      return;
    }

    try {
      validarImagem(
        file
      );

      if (
        thumbnailPreview
      ) {
        URL.revokeObjectURL(
          thumbnailPreview
        );
      }

      setThumbnailFile(
        file
      );

      setThumbnailPreview(
        URL.createObjectURL(
          file
        )
      );

      setErro("");
    } catch (
      error
    ) {
      event.target.value =
        "";

      setErro(
        error instanceof
          Error
          ? error.message
          : "Imagem inválida."
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    }
  }

  function removerThumbnail() {
    if (
      thumbnailPreview
    ) {
      URL.revokeObjectURL(
        thumbnailPreview
      );
    }

    setThumbnailFile(
      null
    );

    setThumbnailPreview(
      ""
    );
  }

  /* =======================================================
     UPLOAD GENÉRICO
  ======================================================= */

  async function uploadArquivo(
    supabase: SupabaseClient,
    file: File,
    pasta: string
  ) {
    const extension =
      getFileExtension(
        file
      );

    const fileName =
      `${crypto.randomUUID()}.${extension}`;

    const path =
      `${pasta}/${fileName}`;

    const {
      error:
        uploadError,
    } =
      await supabase.storage
        .from(
          "treinamentos-media"
        )
        .upload(
          path,
          file,
          {
            cacheControl:
              "3600",

            upsert:
              false,

            contentType:
              file.type,
          }
        );

    if (
      uploadError
    ) {
      throw new Error(
        `Erro ao enviar arquivo: ${uploadError.message}`
      );
    }

    const {
      data:
        publicUrlData,
    } =
      supabase.storage
        .from(
          "treinamentos-media"
        )
        .getPublicUrl(
          path
        );

    return {
      path,

      url:
        publicUrlData.publicUrl,
    };
  }

  /* =======================================================
     SALVAR
  ======================================================= */

  async function salvarVideo() {
    if (
      salvando
    ) {
      return;
    }

    setErro("");
    setSucesso("");

    /* -----------------------------------------------------
       VALIDAÇÕES
    ----------------------------------------------------- */

    if (
      !cursoId
    ) {
      setErro(
        "Selecione o treinamento ao qual este vídeo pertence."
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });

      return;
    }

    if (
      !titulo.trim()
    ) {
      setErro(
        "Informe o título do vídeo."
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });

      return;
    }

    if (
      !videoFile &&
      !videoUrl.trim()
    ) {
      setErro(
        "Informe a URL do vídeo ou envie um arquivo."
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });

      return;
    }

    if (
      videoUrl.trim() &&
      !videoFile
    ) {
      try {
        new URL(
          videoUrl.trim()
        );
      } catch {
        setErro(
          "Informe uma URL de vídeo válida."
        );

        window.scrollTo({
          top: 0,
          behavior:
            "smooth",
        });

        return;
      }
    }

    const ordemNumero =
      Number(
        ordem
      );

    if (
      !Number.isInteger(
        ordemNumero
      ) ||
      ordemNumero < 0
    ) {
      setErro(
        "A ordem deve ser um número inteiro igual ou maior que zero."
      );

      return;
    }

    setSalvando(
      true
    );

    const supabase =
      createClient();

    const arquivosEnviados:
      string[] = [];

    try {
      /* ===============================================
         1. USUÁRIO
      =============================================== */

      const {
        data:
          userData,
        error:
          userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !userData.user
      ) {
        throw new Error(
          "Sua sessão expirou. Faça login novamente."
        );
      }

      /* ===============================================
         2. ADMIN
      =============================================== */

      const {
        data:
          isAdmin,
        error:
          adminError,
      } =
        await supabase.rpc(
          "treinamentos_is_admin"
        );

      if (
        adminError ||
        isAdmin !== true
      ) {
        throw new Error(
          "Você não possui permissão para cadastrar vídeos."
        );
      }

      /* ===============================================
         3. URL FINAL DO VÍDEO
      =============================================== */

      let videoUrlFinal =
        videoUrl
          .trim();

      if (
        videoFile
      ) {
        validarVideo(
          videoFile
        );

        const upload =
          await uploadArquivo(
            supabase,
            videoFile,
            `videos/${cursoId}`
          );

        videoUrlFinal =
          upload.url;

        arquivosEnviados.push(
          upload.path
        );
      }

      /* ===============================================
         4. THUMBNAIL
      =============================================== */

      let thumbnailUrlFinal:
        | string
        | null =
        youtubeThumbnail;

      if (
        thumbnailFile
      ) {
        validarImagem(
          thumbnailFile
        );

        const upload =
          await uploadArquivo(
            supabase,
            thumbnailFile,
            `videos/${cursoId}/thumbnails`
          );

        thumbnailUrlFinal =
          upload.url;

        arquivosEnviados.push(
          upload.path
        );
      }

      /* ===============================================
         5. INSERT
      =============================================== */

      const {
        error:
          insertError,
      } =
        await supabase
          .from(
            "treinamentos_videos"
          )
          .insert({
            curso_id:
              cursoId,

            titulo:
              titulo.trim(),

            descricao:
              descricao.trim() ||
              null,

            video_url:
              videoUrlFinal,

            thumbnail_url:
              thumbnailUrlFinal,

            duracao:
              duracao.trim() ||
              null,

            tipo,

            ordem:
              ordemNumero,

            ativo,
          });

      if (
        insertError
      ) {
        throw new Error(
          `Erro ao cadastrar vídeo: ${insertError.message}`
        );
      }

      /* ===============================================
         6. SUCESSO
      =============================================== */

      setSucesso(
        ativo
          ? "Vídeo cadastrado e publicado com sucesso."
          : "Vídeo cadastrado como inativo com sucesso."
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });

      setTimeout(() => {
        router.push(
          "/admin/videos"
        );

        router.refresh();
      }, 1000);
    } catch (
      error
    ) {
      console.error(
        "Erro ao cadastrar vídeo:",
        error
      );

      /*
       * Se enviamos algum arquivo,
       * mas o cadastro no banco falhou,
       * removemos o arquivo para não
       * deixar arquivos órfãos.
       */

      if (
        arquivosEnviados.length >
        0
      ) {
        await supabase.storage
          .from(
            "treinamentos-media"
          )
          .remove(
            arquivosEnviados
          );
      }

      setErro(
        error instanceof
          Error
          ? error.message
          : "Erro inesperado ao cadastrar o vídeo."
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    } finally {
      setSalvando(
        false
      );
    }
  }

  /* =======================================================
     SUBMIT
  ======================================================= */

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    void salvarVideo();
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <form
      onSubmit={
        handleSubmit
      }
    >
      <div className="mx-auto max-w-[1500px] space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">

          <div className="flex items-start gap-4">

            <Link
              href="/admin/videos"
              className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 hover:text-zinc-950"
            >
              <ArrowLeft
                size={18}
              />
            </Link>

            <div>

              <div className="mb-1 flex items-center gap-2">

                <p className="text-sm font-medium !text-emerald-600">
                  Vídeos / Prévias
                </p>

                <span className="!text-zinc-300">
                  /
                </span>

                <p className="text-sm !text-zinc-500">
                  Novo
                </p>

              </div>

              <h1 className="text-2xl font-bold tracking-tight !text-zinc-950 lg:text-3xl">
                Adicionar vídeo
              </h1>

              <p className="mt-1 text-sm !text-zinc-500">
                Adicione uma prévia ou outro vídeo a um treinamento.
              </p>

            </div>

          </div>

          <div className="flex items-center gap-3">

            <Button
              type="button"
              variant="outline"
              disabled={
                salvando
              }
              asChild
            >
              <Link href="/admin/videos">
                Cancelar
              </Link>
            </Button>

            <Button
              type="submit"
              disabled={
                salvando ||
                carregandoCursos
              }
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {salvando ? (
                <>
                  <LoaderCircle
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

                  Salvar vídeo
                </>
              )}
            </Button>

          </div>

        </div>

        {/* =================================================
            MENSAGENS
        ================================================= */}

        {erro && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 !text-red-600"
            />

            <div>

              <p className="text-sm font-semibold !text-red-800">
                Não foi possível salvar o vídeo
              </p>

              <p className="mt-1 text-sm !text-red-700">
                {erro}
              </p>

            </div>

          </div>
        )}

        {sucesso && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">

            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0 !text-emerald-600"
            />

            <div>

              <p className="text-sm font-semibold !text-emerald-800">
                Tudo certo!
              </p>

              <p className="mt-1 text-sm !text-emerald-700">
                {sucesso}
              </p>

            </div>

          </div>
        )}

        <Separator />

        {/* =================================================
            GRID PRINCIPAL
        ================================================= */}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

          {/* =================================================
              COLUNA PRINCIPAL
          ================================================= */}

          <div className="space-y-6">

            {/* ===============================================
                INFORMAÇÕES
            =============================================== */}

            <Card>

              <CardHeader>

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 !text-emerald-600">
                    <Video
                      size={20}
                    />
                  </div>

                  <div>

                    <CardTitle>
                      Informações do vídeo
                    </CardTitle>

                    <CardDescription className="mt-1">
                      Defina a qual treinamento o vídeo pertence e como ele será identificado.
                    </CardDescription>

                  </div>

                </div>

              </CardHeader>

              <CardContent className="space-y-6">

                {/* TREINAMENTO */}

                <div className="space-y-2">

                  <Label>
                    Treinamento

                    <span className="ml-1 !text-red-500">
                      *
                    </span>
                  </Label>

                  <Select
                    value={
                      cursoId
                    }
                    disabled={
                      salvando ||
                      carregandoCursos
                    }
                    onValueChange={
                      setCursoId
                    }
                  >

                    <SelectTrigger className="w-full">

                      <SelectValue
                        placeholder={
                          carregandoCursos
                            ? "Carregando treinamentos..."
                            : "Selecione um treinamento"
                        }
                      />

                    </SelectTrigger>

                    <SelectContent>

                      {cursos.map(
                        (
                          curso
                        ) => (
                          <SelectItem
                            key={
                              curso.id
                            }
                            value={
                              curso.id
                            }
                          >
                            {curso.titulo}
                          </SelectItem>
                        )
                      )}

                    </SelectContent>

                  </Select>

                  {!carregandoCursos &&
                    cursos.length ===
                      0 && (
                      <p className="text-xs !text-red-600">
                        Nenhum treinamento encontrado.
                      </p>
                    )}

                </div>

                {/* TÍTULO */}

                <div className="space-y-2">

                  <Label htmlFor="titulo-video">
                    Título do vídeo

                    <span className="ml-1 !text-red-500">
                      *
                    </span>
                  </Label>

                  <Input
                    id="titulo-video"
                    value={
                      titulo
                    }
                    onChange={(
                      event
                    ) =>
                      setTitulo(
                        event.target
                          .value
                      )
                    }
                    placeholder="Ex.: Conheça o treinamento"
                    disabled={
                      salvando
                    }
                    required
                  />

                  <p className="text-xs !text-zinc-500">
                    Esse título será exibido junto à prévia do treinamento.
                  </p>

                </div>

                {/* DESCRIÇÃO */}

                <div className="space-y-2">

                  <Label htmlFor="descricao-video">
                    Descrição
                  </Label>

                  <Textarea
                    id="descricao-video"
                    value={
                      descricao
                    }
                    onChange={(
                      event
                    ) =>
                      setDescricao(
                        event.target
                          .value
                      )
                    }
                    placeholder="Ex.: Veja uma prévia do conteúdo e conheça a proposta deste treinamento..."
                    className="min-h-[120px] resize-y"
                    disabled={
                      salvando
                    }
                  />

                </div>

                {/* TIPO + DURAÇÃO */}

                <div className="grid gap-5 md:grid-cols-2">

                  <div className="space-y-2">

                    <Label>
                      Tipo de vídeo
                    </Label>

                    <Select
                      value={
                        tipo
                      }
                      disabled={
                        salvando
                      }
                      onValueChange={(
                        value
                      ) =>
                        setTipo(
                          value as TipoVideo
                        )
                      }
                    >

                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>

                        {TIPOS_VIDEO.map(
                          (
                            item
                          ) => (
                            <SelectItem
                              key={
                                item.value
                              }
                              value={
                                item.value
                              }
                            >
                              {item.label}
                            </SelectItem>
                          )
                        )}

                      </SelectContent>

                    </Select>

                    <p className="text-xs !text-zinc-500">
                      {
                        TIPOS_VIDEO.find(
                          (
                            item
                          ) =>
                            item.value ===
                            tipo
                        )
                          ?.descricao
                      }
                    </p>

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="duracao">
                      Duração
                    </Label>

                    <Input
                      id="duracao"
                      value={
                        duracao
                      }
                      onChange={(
                        event
                      ) =>
                        setDuracao(
                          event.target
                            .value
                        )
                      }
                      placeholder="Ex.: 02:35"
                      disabled={
                        salvando
                      }
                    />

                    <p className="text-xs !text-zinc-500">
                      Opcional. Ex.: 02:35 ou 15:20.
                    </p>

                  </div>

                </div>

              </CardContent>

            </Card>

            {/* ===============================================
                VÍDEO
            =============================================== */}

            <Card>

              <CardHeader>

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 !text-emerald-600">
                    <Film
                      size={20}
                    />
                  </div>

                  <div>

                    <CardTitle>
                      Arquivo do vídeo
                    </CardTitle>

                    <CardDescription className="mt-1">
                      Você pode informar uma URL externa ou enviar o arquivo diretamente.
                    </CardDescription>

                  </div>

                </div>

              </CardHeader>

              <CardContent className="space-y-6">

                {/* URL */}

                <div className="space-y-2">

                  <Label htmlFor="video-url">
                    URL do vídeo
                  </Label>

                  <Input
                    id="video-url"
                    type="url"
                    value={
                      videoUrl
                    }
                    onChange={(
                      event
                    ) =>
                      setVideoUrl(
                        event.target
                          .value
                      )
                    }
                    placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                    disabled={
                      salvando
                    }
                  />

                  <p className="text-xs leading-relaxed !text-zinc-500">
                    Pode ser YouTube, Vimeo ou uma URL direta de vídeo.
                  </p>

                </div>

                {/* SEPARADOR */}

                <div className="flex items-center gap-4">

                  <div className="h-px flex-1 bg-zinc-200" />

                  <span className="text-xs font-medium uppercase tracking-wide !text-zinc-400">
                    ou
                  </span>

                  <div className="h-px flex-1 bg-zinc-200" />

                </div>

                {/* UPLOAD */}

                <div className="space-y-3">

                  <Label>
                    Enviar vídeo
                  </Label>

                  {!videoFile ? (
                    <label
                      className={`
                        flex min-h-[180px] cursor-pointer flex-col items-center
                        justify-center rounded-xl border-2 border-dashed
                        border-zinc-200 bg-zinc-50 px-6 py-8
                        text-center transition-colors
                        hover:border-emerald-300 hover:bg-emerald-50/40
                        ${
                          salvando
                            ? "pointer-events-none opacity-60"
                            : ""
                        }
                      `}
                    >

                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">

                        <Upload
                          size={22}
                          className="!text-emerald-600"
                        />

                      </div>

                      <p className="text-sm font-semibold !text-zinc-800">
                        Clique para selecionar um vídeo
                      </p>

                      <p className="mt-1 text-xs !text-zinc-500">
                        MP4, WEBM ou MOV
                      </p>

                      <p className="mt-1 text-xs !text-zinc-400">
                        Máximo de 200 MB
                      </p>

                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                        className="hidden"
                        disabled={
                          salvando
                        }
                        onChange={
                          handleVideoFile
                        }
                      />

                    </label>
                  ) : (
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white !text-emerald-600 shadow-sm">

                          <Video
                            size={20}
                          />

                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold !text-zinc-900">
                            {
                              videoFile.name
                            }
                          </p>

                          <p className="mt-1 text-xs !text-zinc-500">
                            {formatFileSize(
                              videoFile.size
                            )}
                          </p>

                        </div>

                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={
                          salvando
                        }
                        onClick={() =>
                          setVideoFile(
                            null
                          )
                        }
                        className="shrink-0 !text-zinc-500 hover:!bg-red-50 hover:!text-red-600"
                      >
                        <X
                          size={18}
                        />
                      </Button>

                    </div>
                  )}

                  {videoFile && (
                    <p className="text-xs !text-emerald-700">
                      O arquivo enviado será usado no lugar da URL informada acima.
                    </p>
                  )}

                </div>

              </CardContent>

            </Card>

            {/* ===============================================
                THUMBNAIL
            =============================================== */}

            <Card>

              <CardHeader>

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 !text-emerald-600">
                    <ImageIcon
                      size={20}
                    />
                  </div>

                  <div>

                    <CardTitle>
                      Capa do vídeo
                    </CardTitle>

                    <CardDescription className="mt-1">
                      Adicione uma imagem que será exibida antes do vídeo começar.
                    </CardDescription>

                  </div>

                </div>

              </CardHeader>

              <CardContent>

                {previewThumbnail ? (
                  <div className="space-y-4">

                    <div className="relative aspect-video w-full max-w-[650px] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">

                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          previewThumbnail
                        }
                        alt="Prévia da thumbnail"
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">

                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">

                          <Play
                            size={21}
                            fill="currentColor"
                            className="ml-1 !text-zinc-900"
                          />

                        </div>

                      </div>

                    </div>

                    {thumbnailFile ? (
                      <div className="flex flex-wrap items-center gap-3">

                        <Button
                          type="button"
                          variant="outline"
                          disabled={
                            salvando
                          }
                          onClick={
                            removerThumbnail
                          }
                        >
                          <X
                            size={16}
                          />

                          Remover imagem
                        </Button>

                        <p className="text-xs !text-zinc-500">
                          {thumbnailFile.name}
                        </p>

                      </div>
                    ) : youtubeThumbnail ? (
                      <p className="text-xs !text-emerald-700">
                        A thumbnail foi identificada automaticamente pelo link do YouTube.
                      </p>
                    ) : null}

                  </div>
                ) : (
                  <label
                    className={`
                      flex min-h-[190px] cursor-pointer flex-col
                      items-center justify-center rounded-xl border-2
                      border-dashed border-zinc-200 bg-zinc-50 px-6
                      py-8 text-center transition-colors
                      hover:border-emerald-300 hover:bg-emerald-50/40
                      ${
                        salvando
                          ? "pointer-events-none opacity-60"
                          : ""
                      }
                    `}
                  >

                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">

                      <ImageIcon
                        size={21}
                        className="!text-emerald-600"
                      />

                    </div>

                    <p className="text-sm font-semibold !text-zinc-800">
                      Adicionar thumbnail
                    </p>

                    <p className="mt-1 text-xs !text-zinc-500">
                      JPG, PNG ou WEBP — máximo 5 MB
                    </p>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={
                        salvando
                      }
                      onChange={
                        handleThumbnail
                      }
                    />

                  </label>
                )}

                {youtubeThumbnail &&
                  !thumbnailFile && (
                    <div className="mt-4">

                      <label className="inline-flex cursor-pointer">

                        <span className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium !text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100">
                          Escolher outra imagem
                        </span>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={
                            salvando
                          }
                          onChange={
                            handleThumbnail
                          }
                        />

                      </label>

                    </div>
                  )}

              </CardContent>

            </Card>

          </div>

          {/* =================================================
              COLUNA LATERAL
          ================================================= */}

          <div className="space-y-6 xl:sticky xl:top-[92px]">

            {/* ===============================================
                PUBLICAÇÃO
            =============================================== */}

            <Card>

              <CardHeader>

                <CardTitle>
                  Publicação
                </CardTitle>

                <CardDescription>
                  Defina a disponibilidade e a posição do vídeo.
                </CardDescription>

              </CardHeader>

              <CardContent className="space-y-5">

                {/* STATUS */}

                <div className="space-y-3">

                  <Label>
                    Status
                  </Label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-4 transition-colors hover:bg-zinc-50">

                    <input
                      type="checkbox"
                      checked={
                        ativo
                      }
                      disabled={
                        salvando
                      }
                      onChange={(
                        event
                      ) =>
                        setAtivo(
                          event.target
                            .checked
                        )
                      }
                      className="mt-0.5 h-4 w-4 accent-emerald-600"
                    />

                    <div>

                      <p className="text-sm font-semibold !text-zinc-900">
                        Vídeo ativo
                      </p>

                      <p className="mt-1 text-xs leading-relaxed !text-zinc-500">
                        Quando ativo, o vídeo poderá ser exibido na página pública do treinamento.
                      </p>

                    </div>

                  </label>

                </div>

                <Separator />

                {/* ORDEM */}

                <div className="space-y-2">

                  <Label htmlFor="ordem">
                    Ordem
                  </Label>

                  <Input
                    id="ordem"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      ordem
                    }
                    onChange={(
                      event
                    ) =>
                      setOrdem(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      salvando
                    }
                  />

                  <p className="text-xs leading-relaxed !text-zinc-500">
                    Define a posição do vídeo quando houver várias prévias no mesmo treinamento.
                  </p>

                </div>

              </CardContent>

            </Card>

            {/* ===============================================
                TREINAMENTO SELECIONADO
            =============================================== */}

            <Card>

              <CardHeader>

                <CardTitle>
                  Treinamento
                </CardTitle>

                <CardDescription>
                  Curso ao qual o vídeo será vinculado.
                </CardDescription>

              </CardHeader>

              <CardContent>

                {cursoSelecionado ? (
                  <div className="space-y-4">

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white !text-emerald-600 shadow-sm">

                        <Film
                          size={19}
                        />

                      </div>

                      <p className="font-semibold !text-zinc-900">
                        {
                          cursoSelecionado.titulo
                        }
                      </p>

                      <p className="mt-1 text-xs capitalize !text-zinc-500">
                        Status:{" "}
                        {
                          cursoSelecionado.status
                        }
                      </p>

                    </div>

                    {cursoSelecionado.slug && (
                      <Button
                        type="button"
                        variant="outline"
                        asChild
                        className="w-full"
                      >

                        <Link
                          href={`/${cursoSelecionado.slug}`}
                          target="_blank"
                        >
                          <ExternalLink
                            size={16}
                          />

                          Ver treinamento
                        </Link>

                      </Button>
                    )}

                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-zinc-200 p-5 text-center">

                    <Video
                      size={25}
                      className="mx-auto !text-zinc-300"
                    />

                    <p className="mt-2 text-sm !text-zinc-500">
                      Selecione um treinamento.
                    </p>

                  </div>
                )}

              </CardContent>

            </Card>

            {/* ===============================================
                DICA
            =============================================== */}

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

              <p className="text-sm font-semibold !text-blue-900">
                Dica
              </p>

              <p className="mt-1.5 text-xs leading-relaxed !text-blue-800">
                Para prévias, prefira vídeos curtos que apresentem rapidamente o conteúdo e despertem interesse no treinamento.
              </p>

            </div>

          </div>

        </div>

      </div>
    </form>
  );
}