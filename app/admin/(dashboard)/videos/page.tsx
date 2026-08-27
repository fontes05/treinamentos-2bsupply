"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Film,
  LoaderCircle,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  Video,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* =========================================================
   TIPOS
========================================================= */

type VideoTreinamento = {
  id: string;
  curso_id: string;

  titulo: string;
  descricao: string | null;

  video_url: string;
  thumbnail_url: string | null;

  duracao: string | null;
  tipo: string;

  ordem: number;
  ativo: boolean;

  created_at: string;
};

type Curso = {
  id: string;
  titulo: string;
  slug: string;
};

type VideoComCurso = VideoTreinamento & {
  curso_titulo: string;
  curso_slug: string | null;
};

/* =========================================================
   HELPERS
========================================================= */

function formatarData(
  value: string
) {
  try {
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    ).format(
      new Date(value)
    );
  } catch {
    return "-";
  }
}

function formatarTipo(
  tipo: string
) {
  const tipos: Record<
    string,
    string
  > = {
    previa: "Prévia",
    introducao: "Introdução",
    aula_gratuita:
      "Aula gratuita",
    demonstracao:
      "Demonstração",
    professor:
      "Apresentação do professor",
    depoimento: "Depoimento",
    institucional:
      "Institucional",
    trailer: "Trailer",
  };

  return tipos[tipo] || tipo;
}

function getYoutubeThumbnail(
  url: string
) {
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
        parsed.pathname.replace(
          "/",
          ""
        );
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
            .split("/embed/")[1]
            ?.split("/")[0] || "";
      }

      if (
        !videoId &&
        parsed.pathname.includes(
          "/shorts/"
        )
      ) {
        videoId =
          parsed.pathname
            .split("/shorts/")[1]
            ?.split("/")[0] || "";
      }
    }

    if (!videoId) {
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

export default function VideosPage() {
  const [
    videos,
    setVideos,
  ] = useState<
    VideoComCurso[]
  >([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    excluindoId,
    setExcluindoId,
  ] = useState<
    string | null
  >(null);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    sucesso,
    setSucesso,
  ] = useState("");

  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    filtroTipo,
    setFiltroTipo,
  ] = useState("todos");

  const [
    filtroStatus,
    setFiltroStatus,
  ] = useState("todos");

  /* =======================================================
     CARREGAR VÍDEOS
  ======================================================= */

  const carregarVideos =
    useCallback(
      async () => {
        setCarregando(true);
        setErro("");

        const supabase =
          createClient();

        try {
          /* ===============================================
             BUSCAR VÍDEOS
          =============================================== */

          const {
            data:
              videosData,
            error:
              videosError,
          } =
            await supabase
              .from(
                "treinamentos_videos"
              )
              .select(`
                id,
                curso_id,
                titulo,
                descricao,
                video_url,
                thumbnail_url,
                duracao,
                tipo,
                ordem,
                ativo,
                created_at
              `)
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              );

          if (
            videosError
          ) {
            throw new Error(
              `Erro ao carregar vídeos: ${videosError.message}`
            );
          }

          const listaVideos =
            (videosData ??
              []) as VideoTreinamento[];

          if (
            listaVideos.length ===
            0
          ) {
            setVideos([]);
            return;
          }

          /* ===============================================
             IDs DOS CURSOS
          =============================================== */

          const cursoIds = [
            ...new Set(
              listaVideos.map(
                (video) =>
                  video.curso_id
              )
            ),
          ];

          /* ===============================================
             CARREGAR CURSOS RELACIONADOS
          =============================================== */

          const {
            data:
              cursosData,
            error:
              cursosError,
          } =
            await supabase
              .from(
                "treinamentos_cursos"
              )
              .select(`
                id,
                titulo,
                slug
              `)
              .in(
                "id",
                cursoIds
              );

          if (
            cursosError
          ) {
            throw new Error(
              `Erro ao carregar treinamentos: ${cursosError.message}`
            );
          }

          const cursos =
            (cursosData ??
              []) as Curso[];

          const cursosMap =
            new Map(
              cursos.map(
                (curso) => [
                  curso.id,
                  curso,
                ]
              )
            );

          /* ===============================================
             JUNTAR VÍDEO + TREINAMENTO
          =============================================== */

          const listaFinal =
            listaVideos.map(
              (video) => {
                const curso =
                  cursosMap.get(
                    video.curso_id
                  );

                return {
                  ...video,

                  curso_titulo:
                    curso?.titulo ||
                    "Treinamento não encontrado",

                  curso_slug:
                    curso?.slug ||
                    null,
                };
              }
            );

          setVideos(
            listaFinal
          );
        } catch (
          error
        ) {
          console.error(
            error
          );

          setErro(
            error instanceof
              Error
              ? error.message
              : "Não foi possível carregar os vídeos."
          );
        } finally {
          setCarregando(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    carregarVideos();
  }, [
    carregarVideos,
  ]);

  /* =======================================================
     FILTROS
  ======================================================= */

  const videosFiltrados =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLowerCase();

      return videos.filter(
        (video) => {
          const matchBusca =
            !termo ||
            video.titulo
              .toLowerCase()
              .includes(
                termo
              ) ||
            video.curso_titulo
              .toLowerCase()
              .includes(
                termo
              ) ||
            video.tipo
              .toLowerCase()
              .includes(
                termo
              );

          const matchTipo =
            filtroTipo ===
              "todos" ||
            video.tipo ===
              filtroTipo;

          const matchStatus =
            filtroStatus ===
              "todos" ||
            (filtroStatus ===
              "ativo" &&
              video.ativo) ||
            (filtroStatus ===
              "inativo" &&
              !video.ativo);

          return (
            matchBusca &&
            matchTipo &&
            matchStatus
          );
        }
      );
    }, [
      videos,
      busca,
      filtroTipo,
      filtroStatus,
    ]);

  /* =======================================================
     TIPOS DISPONÍVEIS
  ======================================================= */

  const tiposDisponiveis =
    useMemo(() => {
      return [
        ...new Set(
          videos
            .map(
              (video) =>
                video.tipo
            )
            .filter(Boolean)
        ),
      ];
    }, [videos]);

  /* =======================================================
     EXCLUIR
  ======================================================= */

  async function excluirVideo(
    video: VideoComCurso
  ) {
    const confirmar =
      window.confirm(
        `Tem certeza que deseja excluir o vídeo "${video.titulo}"?\n\nEssa ação não poderá ser desfeita.`
      );

    if (!confirmar) {
      return;
    }

    setExcluindoId(
      video.id
    );

    setErro("");
    setSucesso("");

    const supabase =
      createClient();

    try {
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
          "Você não possui permissão para excluir vídeos."
        );
      }

      /* ===============================================
         EXCLUIR
      =============================================== */

      const {
        error:
          deleteError,
      } =
        await supabase
          .from(
            "treinamentos_videos"
          )
          .delete()
          .eq(
            "id",
            video.id
          );

      if (
        deleteError
      ) {
        throw new Error(
          `Erro ao excluir vídeo: ${deleteError.message}`
        );
      }

      setVideos(
        (
          currentVideos
        ) =>
          currentVideos.filter(
            (item) =>
              item.id !==
              video.id
          )
      );

      setSucesso(
        "Vídeo excluído com sucesso."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      setErro(
        error instanceof
          Error
          ? error.message
          : "Não foi possível excluir o vídeo."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setExcluindoId(
        null
      );
    }
  }

  /* =======================================================
     CONTADORES
  ======================================================= */

  const totalAtivos =
    videos.filter(
      (video) =>
        video.ativo
    ).length;

  const totalInativos =
    videos.length -
    totalAtivos;

  /* =======================================================
     LOADING
  ======================================================= */

  if (carregando) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle
            className="animate-spin !text-emerald-600"
            size={32}
          />

          <p className="text-sm !text-[#71717a]">
            Carregando vídeos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">

      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <Video
                size={19}
                className="!text-emerald-600"
              />
            </div>

            <span className="text-sm font-medium !text-emerald-700">
              Vídeos / Prévias
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight !text-[#18181b]">
            Vídeos dos treinamentos
          </h2>

          <p className="mt-1 text-sm !text-[#71717a]">
            Gerencie prévias, trailers, aulas demonstrativas e outros vídeos dos treinamentos.
          </p>
        </div>

        <Link
          href="/admin/videos/novo"
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#009b69] px-4 text-sm font-medium text-white transition-colors hover:bg-[#00875a]"
        >
          <Plus
            size={17}
            className="mr-2"
          />

          Adicionar vídeo
        </Link>
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
              Ocorreu um erro
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
          CARDS DE RESUMO
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-3">

        <Card className="border-[#e4e4e7] shadow-none">
          <CardContent className="flex items-center gap-4 p-5">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
              <Film
                size={21}
                className="!text-zinc-600"
              />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide !text-[#71717a]">
                Total
              </p>

              <p className="mt-1 text-2xl font-bold !text-[#18181b]">
                {videos.length}
              </p>
            </div>

          </CardContent>
        </Card>

        <Card className="border-[#e4e4e7] shadow-none">
          <CardContent className="flex items-center gap-4 p-5">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2
                size={21}
                className="!text-emerald-600"
              />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide !text-[#71717a]">
                Ativos
              </p>

              <p className="mt-1 text-2xl font-bold !text-[#18181b]">
                {totalAtivos}
              </p>
            </div>

          </CardContent>
        </Card>

        <Card className="border-[#e4e4e7] shadow-none">
          <CardContent className="flex items-center gap-4 p-5">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <Video
                size={21}
                className="!text-amber-600"
              />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide !text-[#71717a]">
                Inativos
              </p>

              <p className="mt-1 text-2xl font-bold !text-[#18181b]">
                {totalInativos}
              </p>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* =====================================================
          CONTEÚDO
      ===================================================== */}

      <Card className="border-[#e4e4e7] shadow-none">

        <CardHeader className="border-b border-[#e4e4e7]">

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

            <div>
              <CardTitle className="!text-[#18181b]">
                Todos os vídeos
              </CardTitle>

              <CardDescription className="mt-1">
                {videosFiltrados.length}{" "}
                {videosFiltrados.length === 1
                  ? "vídeo encontrado"
                  : "vídeos encontrados"}
              </CardDescription>
            </div>

            {/* FILTROS */}

            <div className="flex flex-col gap-2 sm:flex-row">

              {/* BUSCA */}

              <div className="relative min-w-[260px]">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 !text-[#a1a1aa]"
                />

                <Input
                  value={busca}
                  onChange={(
                    event
                  ) =>
                    setBusca(
                      event.target
                        .value
                    )
                  }
                  placeholder="Buscar vídeo ou treinamento..."
                  className="h-10 pl-9"
                />
              </div>

              {/* TIPO */}

              <Select
                value={
                  filtroTipo
                }
                onValueChange={(value) =>
                  setFiltroTipo(
                    value ?? "todos"
                  )
                }
              >
                <SelectTrigger className="h-10 w-full sm:w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="todos">
                    Todos os tipos
                  </SelectItem>

                  {tiposDisponiveis.map(
                    (tipo) => (
                      <SelectItem
                        key={
                          tipo
                        }
                        value={
                          tipo
                        }
                      >
                        {formatarTipo(
                          tipo
                        )}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>

              {/* STATUS */}

              <Select
                value={
                  filtroStatus
                }
                onValueChange={(value) =>
                  setFiltroStatus(
                    value ?? "todos"
                  )
                }
              >
                <SelectTrigger className="h-10 w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="todos">
                    Todos
                  </SelectItem>

                  <SelectItem value="ativo">
                    Ativos
                  </SelectItem>

                  <SelectItem value="inativo">
                    Inativos
                  </SelectItem>
                </SelectContent>
              </Select>

            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">

          {/* =================================================
              ESTADO VAZIO TOTAL
          ================================================= */}

          {videos.length ===
          0 ? (
            <div className="flex min-h-[380px] flex-col items-center justify-center px-6 py-12 text-center">

              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                <Video
                  size={30}
                  strokeWidth={1.6}
                  className="!text-emerald-600"
                />
              </div>

              <h3 className="text-lg font-semibold !text-[#18181b]">
                Nenhum vídeo cadastrado
              </h3>

              <p className="mt-2 max-w-md text-sm leading-relaxed !text-[#71717a]">
                Adicione prévias dos treinamentos, trailers, aulas demonstrativas ou apresentações dos professores.
              </p>

              <Link
                href="/admin/videos/novo"
                className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-[#009b69] px-4 text-sm font-medium text-white transition-colors hover:bg-[#00875a]"
              >
                <Plus
                  size={17}
                  className="mr-2"
                />

                Adicionar primeiro vídeo
              </Link>

            </div>
          ) : videosFiltrados
              .length ===
            0 ? (

            /* =================================================
                NENHUM RESULTADO DA BUSCA
            ================================================= */

            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">

              <Search
                size={30}
                className="mb-4 !text-[#a1a1aa]"
              />

              <h3 className="font-semibold !text-[#18181b]">
                Nenhum resultado encontrado
              </h3>

              <p className="mt-1 text-sm !text-[#71717a]">
                Tente alterar os filtros ou o termo pesquisado.
              </p>

              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setBusca("");
                  setFiltroTipo(
                    "todos"
                  );
                  setFiltroStatus(
                    "todos"
                  );
                }}
              >
                Limpar filtros
              </Button>

            </div>
          ) : (

            /* =================================================
                TABELA
            ================================================= */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px]">

                <thead>
                  <tr className="border-b border-[#e4e4e7] bg-[#fafafa]">

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide !text-[#71717a]">
                      Vídeo
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide !text-[#71717a]">
                      Treinamento
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide !text-[#71717a]">
                      Tipo
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide !text-[#71717a]">
                      Status
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide !text-[#71717a]">
                      Data
                    </th>

                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide !text-[#71717a]">
                      Ações
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {videosFiltrados.map(
                    (video) => {

                      const thumbnail =
                        video.thumbnail_url ||
                        getYoutubeThumbnail(
                          video.video_url
                        );

                      const excluindo =
                        excluindoId ===
                        video.id;

                      return (
                        <tr
                          key={
                            video.id
                          }
                          className="border-b border-[#eeeeef] transition-colors last:border-b-0 hover:bg-[#fafafa]"
                        >

                          {/* VÍDEO */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="relative flex h-[64px] w-[108px] shrink-0 overflow-hidden rounded-lg border border-[#e4e4e7] bg-zinc-100">

                                {thumbnail ? (
                                  <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={
                                        thumbnail
                                      }
                                      alt={
                                        video.titulo
                                      }
                                      className="h-full w-full object-cover"
                                    />

                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90">
                                        <Play
                                          size={13}
                                          fill="currentColor"
                                          className="ml-0.5 !text-[#18181b]"
                                        />
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Video
                                      size={24}
                                      className="!text-[#a1a1aa]"
                                    />
                                  </div>
                                )}

                              </div>

                              <div className="min-w-0">

                                <p className="max-w-[280px] truncate text-sm font-semibold !text-[#18181b]">
                                  {
                                    video.titulo
                                  }
                                </p>

                                {video.duracao && (
                                  <p className="mt-1 text-xs !text-[#71717a]">
                                    Duração:{" "}
                                    {
                                      video.duracao
                                    }
                                  </p>
                                )}

                                <p className="mt-1 text-xs !text-[#a1a1aa]">
                                  Ordem:{" "}
                                  {
                                    video.ordem
                                  }
                                </p>

                              </div>

                            </div>
                          </td>

                          {/* TREINAMENTO */}

                          <td className="px-5 py-4">

                            <div className="max-w-[240px]">

                              <p className="text-sm font-medium !text-[#3f3f46]">
                                {
                                  video.curso_titulo
                                }
                              </p>

                              {video.curso_slug && (
                                <Link
                                  href={`/${video.curso_slug}`}
                                  target="_blank"
                                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium !text-emerald-700 hover:underline"
                                >
                                  Ver treinamento

                                  <ExternalLink
                                    size={11}
                                  />
                                </Link>
                              )}

                            </div>
                          </td>

                          {/* TIPO */}

                          <td className="px-5 py-4">

                            <Badge
                              variant="secondary"
                              className="whitespace-nowrap bg-zinc-100 !text-zinc-700 hover:bg-zinc-100"
                            >
                              {formatarTipo(
                                video.tipo
                              )}
                            </Badge>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            {video.ativo ? (
                              <Badge className="border border-emerald-200 bg-emerald-50 !text-emerald-700 hover:bg-emerald-50">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="border border-zinc-200 bg-zinc-100 !text-zinc-600 hover:bg-zinc-100"
                              >
                                Inativo
                              </Badge>
                            )}

                          </td>

                          {/* DATA */}

                          <td className="px-5 py-4 text-sm !text-[#71717a]">
                            {formatarData(
                              video.created_at
                            )}
                          </td>

                          {/* AÇÕES */}

                          <td className="px-5 py-4">

                            <div className="flex items-center justify-end gap-1">

                              {/* ASSISTIR */}

                              <a
                                href={
                                  video.video_url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-md !text-[#71717a] transition-colors hover:!bg-emerald-50 hover:!text-emerald-700"
                                title="Assistir vídeo"
                                aria-label="Assistir vídeo"
                              >
                                <Play
                                  size={17}
                                />
                              </a>

                              {/* EDITAR */}

                              <Link
                                href={`/admin/videos/${video.id}/editar`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-md !text-[#71717a] transition-colors hover:!bg-blue-50 hover:!text-blue-700"
                                title="Editar vídeo"
                                aria-label="Editar vídeo"
                              >
                                <Pencil
                                  size={17}
                                />
                              </Link>

                              {/* EXCLUIR */}

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={
                                  excluindo
                                }
                                onClick={() =>
                                  excluirVideo(
                                    video
                                  )
                                }
                                className="h-9 w-9 !text-[#71717a] hover:!bg-red-50 hover:!text-red-600"
                                title="Excluir vídeo"
                              >
                                {excluindo ? (
                                  <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={17}
                                  />
                                )}
                              </Button>

                            </div>
                          </td>

                        </tr>
                      );
                    }
                  )}
                </tbody>

              </table>

            </div>
          )}

        </CardContent>
      </Card>

    </div>
  );
}