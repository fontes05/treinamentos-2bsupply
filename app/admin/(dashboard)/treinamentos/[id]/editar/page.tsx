"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CheckCircle2,
  CircleCheck,
  FileUser,
  GraduationCap,
  ImageIcon,
  LoaderCircle,
  Plus,
  Save,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  UserRound,
  Video,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

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

type Modulo = {
  id: string;
  titulo: string;
  descricao: string;
};

type Beneficio = {
  id: string;
  titulo: string;
  icone: string;
};

type Certificado = {
  id: string;
  titulo: string;
  descricao: string;

  imagem_url: string | null;

  novaImagem: File | null;

  preview: string;
};

type StatusTreinamento =
  | "rascunho"
  | "publicado"
  | "inativo";

type ProfessorCarregado = {
  id: string;
  nome: string;
  descricao: string | null;
  foto_url: string | null;
  cargo: string | null;
};

type CursoProfessorRelation = {
  professor_id: string;
};

type Categoria = {
  id: number;
  nome: string;
  slug: string;
  ativo: boolean;
};

/* =========================================================
   ÍCONES DOS BENEFÍCIOS
========================================================= */

const benefitIcons = {
  BriefcaseBusiness,
  TrendingUp,
  FileUser,
  Award,
  Target,
  Brain,
  ChartNoAxesCombined,
  Sparkles,
};

type BenefitIconName =
  keyof typeof benefitIcons;

/* =========================================================
   HELPERS
========================================================= */

function generateId() {
  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  return Math.random()
    .toString(36)
    .substring(2, 10);
}

/* ---------------------------------------------------------
   SLUG
--------------------------------------------------------- */

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* ---------------------------------------------------------
   EXTENSÃO
--------------------------------------------------------- */

function getFileExtension(
  file: File
) {
  const parts =
    file.name.split(".");

  if (parts.length < 2) {
    if (
      file.type ===
      "image/png"
    ) {
      return "png";
    }

    if (
      file.type ===
      "image/webp"
    ) {
      return "webp";
    }

    return "jpg";
  }

  return (
    parts
      .pop()
      ?.toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      ) || "jpg"
  );
}

/* ---------------------------------------------------------
   VALIDAR IMAGEM
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
      "Use apenas imagens JPG, PNG ou WEBP."
    );
  }

  const limite =
    5 * 1024 * 1024;

  if (
    file.size > limite
  ) {
    throw new Error(
      "A imagem deve ter no máximo 5 MB."
    );
  }
}

/* ---------------------------------------------------------
   PEGAR PATH DO STORAGE
--------------------------------------------------------- */

function extrairStoragePath(
  publicUrl: string | null
) {
  if (!publicUrl) {
    return null;
  }

  const marker =
    "/storage/v1/object/public/treinamentos-media/";

  const index =
    publicUrl.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return decodeURIComponent(
    publicUrl.substring(
      index +
        marker.length
    )
  );
}

/* ---------------------------------------------------------
   SLUG ÚNICO
--------------------------------------------------------- */

async function validarSlugUnico(
  supabase: SupabaseClient,
  slugInformado: string,
  cursoId: string
) {
  const slug =
    slugify(slugInformado);

  if (!slug) {
    throw new Error(
      "Informe a URL do curso."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "treinamentos_cursos"
    )
    .select("id")
    .eq("slug", slug)
    .neq("id", cursoId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Não foi possível validar a URL do curso: ${error.message}`
    );
  }

  if (data) {
    throw new Error(
      "Já existe outro curso utilizando esta URL."
    );
  }

  return slug;
}

/* =========================================================
   PAGE
========================================================= */

export default function EditarTreinamentoPage() {
  const router =
    useRouter();

  const params =
    useParams();

  const cursoId =
    params.id as string;

  /* =======================================================
     STATUS DA PÁGINA
  ======================================================= */

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    sucesso,
    setSucesso,
  ] = useState("");

  /* =======================================================
     CURSO
  ======================================================= */

  const [
    titulo,
    setTitulo,
  ] = useState("");

  const [
    slugCurso,
    setSlugCurso,
  ] = useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    publicoAlvo,
    setPublicoAlvo,
  ] = useState("");

  const [
    porqueAprender,
    setPorqueAprender,
  ] = useState("");

  const [
    objetivoGeral,
    setObjetivoGeral,
  ] = useState("");

  const [
    beneficiosCurso,
    setBeneficiosCurso,
  ] = useState("");

  const [
    competenciasDesenvolvidas,
    setCompetenciasDesenvolvidas,
  ] = useState("");

  const [
    metodologiaAprendizagem,
    setMetodologiaAprendizagem,
  ] = useState("");

  const [
    avaliacaoCertificacao,
    setAvaliacaoCertificacao,
  ] = useState("");

  const [
    resultadoEsperado,
    setResultadoEsperado,
  ] = useState("");

  const [
    status,
    setStatus,
  ] =
    useState<StatusTreinamento>(
      "rascunho"
    );

  const [
    videoUrl,
    setVideoUrl,
  ] = useState("");

  /* =======================================================
     CATEGORIA
  ======================================================= */

  const [
    categorias,
    setCategorias,
  ] = useState<Categoria[]>([]);

  const [
    categoriaId,
    setCategoriaId,
  ] = useState("");

/* =======================================================
   PREÇO / INSCRIÇÃO
======================================================= */

const [
  precoDe,
  setPrecoDe,
] = useState("");

const [
  precoPara,
  setPrecoPara,
] = useState("");

const [
  parcelamento,
  setParcelamento,
] = useState("");

const [
  linkInscricao,
  setLinkInscricao,
] = useState("");

  /* =======================================================
     IMAGEM DO CURSO
  ======================================================= */

  const [
    imagemAtualUrl,
    setImagemAtualUrl,
  ] = useState("");

  const [
    imagemCurso,
    setImagemCurso,
  ] =
    useState<File | null>(
      null
    );

  const [
    imagemCursoPreview,
    setImagemCursoPreview,
  ] = useState("");

  /* =======================================================
     PROFESSOR
  ======================================================= */

  const [
    professorId,
    setProfessorId,
  ] =
    useState<
      string | null
    >(null);

  const [
    professorNome,
    setProfessorNome,
  ] = useState("");

  const [
    professorCargo,
    setProfessorCargo,
  ] = useState("");

  const [
    professorDescricao,
    setProfessorDescricao,
  ] = useState("");

  const [
    professorFotoAtualUrl,
    setProfessorFotoAtualUrl,
  ] = useState("");

  const [
    professorFoto,
    setProfessorFoto,
  ] =
    useState<File | null>(
      null
    );

  const [
    professorFotoPreview,
    setProfessorFotoPreview,
  ] = useState("");

  /* =======================================================
     MÓDULOS
  ======================================================= */

  const [
    modulos,
    setModulos,
  ] =
    useState<Modulo[]>(
      []
    );

  /* =======================================================
     BENEFÍCIOS
  ======================================================= */

  const [
    beneficios,
    setBeneficios,
  ] =
    useState<
      Beneficio[]
    >([]);

  /* =======================================================
     CERTIFICADOS
  ======================================================= */

  const [
    certificados,
    setCertificados,
  ] =
    useState<
      Certificado[]
    >([]);

  /*
   * Guardamos as imagens originais para podermos
   * apagar do Storage imagens de certificados que
   * forem removidos ou substituídos.
   */
  const [
    imagensCertificadosOriginais,
    setImagensCertificadosOriginais,
  ] =
    useState<
      string[]
    >([]);

  /* =======================================================
     CARREGAR
  ======================================================= */

  useEffect(() => {
    if (!cursoId) {
      return;
    }

    async function carregar() {
      setCarregando(true);
      setErro("");

      const supabase =
        createClient();

      try {
        /* ===============================================
           CATEGORIAS
        =============================================== */

        const {
          data:
            categoriasData,
          error:
            categoriasError,
        } = await supabase
          .from(
            "treinamentos_categorias"
          )
          .select(`
            id,
            nome,
            slug,
            ativo
          `)
          .order(
            "nome",
            {
              ascending:
                true,
            }
          );

        if (
          categoriasError
        ) {
          throw new Error(
            `Não foi possível carregar as categorias: ${categoriasError.message}`
          );
        }

        setCategorias(
          (categoriasData ??
            []) as Categoria[]
        );

        /* ===============================================
           CURSO
        =============================================== */

        const {
          data: curso,
          error:
            cursoError,
        } = await supabase
          .from(
            "treinamentos_cursos"
          )
.select(`
  id,
  titulo,
  slug,
  descricao,
  publico_alvo,
  porque_aprender,
  objetivo_geral,
  beneficios_curso,
  competencias_desenvolvidas,
  metodologia_aprendizagem,
  avaliacao_certificacao,
  resultado_esperado,
  imagem_url,
  video_introdutorio_url,
  preco_de,
  preco_para,
  parcelamento,
  link_inscricao,
  categoria_id,
  status
`)
          .eq(
            "id",
            cursoId
          )
          .single();

        if (cursoError) {
          throw new Error(
            `Não foi possível carregar o treinamento: ${cursoError.message}`
          );
        }

        setTitulo(
          curso.titulo || ""
        );

        setSlugCurso(
          curso.slug ||
            slugify(
              curso.titulo ||
                ""
            )
        );

        setDescricao(
          curso.descricao ||
            ""
        );

        setPublicoAlvo(
          curso.publico_alvo ||
            ""
        );

        setPorqueAprender(
          curso.porque_aprender ||
            ""
        );

        setObjetivoGeral(
          curso.objetivo_geral ||
            ""
        );

        setBeneficiosCurso(
          curso.beneficios_curso ||
            ""
        );

        setCompetenciasDesenvolvidas(
          curso.competencias_desenvolvidas ||
            ""
        );

        setMetodologiaAprendizagem(
          curso.metodologia_aprendizagem ||
            ""
        );

        setAvaliacaoCertificacao(
          curso.avaliacao_certificacao ||
            ""
        );

        setResultadoEsperado(
          curso.resultado_esperado ||
            ""
        );

        setVideoUrl(
          curso.video_introdutorio_url ||
            ""
        );

        setCategoriaId(
          curso.categoria_id != null
            ? String(
                curso.categoria_id
              )
            : ""
        );

setPrecoDe(
  curso.preco_de != null
    ? String(curso.preco_de)
    : ""
);

setPrecoPara(
  curso.preco_para != null
    ? String(curso.preco_para)
    : ""
);

setParcelamento(
  curso.parcelamento ||
    ""
);

setLinkInscricao(
  curso.link_inscricao ||
    ""
);

        setStatus(
          curso.status as StatusTreinamento
        );

        setImagemAtualUrl(
          curso.imagem_url ||
            ""
        );

        /* ===============================================
           MÓDULOS
        =============================================== */

        const {
          data:
            modulosData,
          error:
            modulosError,
        } = await supabase
          .from(
            "treinamentos_modulos"
          )
          .select(`
            id,
            titulo,
            descricao,
            ordem
          `)
          .eq(
            "curso_id",
            cursoId
          )
          .order(
            "ordem",
            {
              ascending:
                true,
            }
          );

        if (
          modulosError
        ) {
          throw new Error(
            `Erro ao carregar módulos: ${modulosError.message}`
          );
        }

        if (
          modulosData &&
          modulosData.length >
            0
        ) {
          setModulos(
            modulosData.map(
              (item) => ({
                id:
                  item.id,

                titulo:
                  item.titulo ||
                  "",

                descricao:
                  item.descricao ||
                  "",
              })
            )
          );
        } else {
          setModulos([
            {
              id:
                generateId(),

              titulo: "",

              descricao: "",
            },
          ]);
        }

        /* ===============================================
           BENEFÍCIOS
        =============================================== */

        const {
          data:
            beneficiosData,
          error:
            beneficiosError,
        } = await supabase
          .from(
            "treinamentos_beneficios"
          )
          .select(`
            id,
            titulo,
            icone,
            ordem
          `)
          .eq(
            "curso_id",
            cursoId
          )
          .order(
            "ordem",
            {
              ascending:
                true,
            }
          );

        if (
          beneficiosError
        ) {
          throw new Error(
            `Erro ao carregar benefícios: ${beneficiosError.message}`
          );
        }

        if (
          beneficiosData &&
          beneficiosData.length >
            0
        ) {
          setBeneficios(
            beneficiosData.map(
              (item) => ({
                id:
                  item.id,

                titulo:
                  item.titulo ||
                  "",

                icone:
                  item.icone ||
                  "Award",
              })
            )
          );
        } else {
          setBeneficios([
            {
              id:
                generateId(),

              titulo: "",

              icone:
                "BriefcaseBusiness",
            },
          ]);
        }

        /* ===============================================
           CERTIFICADOS
        =============================================== */

        const {
          data:
            certificadosData,
          error:
            certificadosError,
        } = await supabase
          .from(
            "treinamentos_certificados"
          )
          .select(`
            id,
            titulo,
            descricao,
            imagem_url,
            ordem
          `)
          .eq(
            "curso_id",
            cursoId
          )
          .order(
            "ordem",
            {
              ascending:
                true,
            }
          );

        if (
          certificadosError
        ) {
          throw new Error(
            `Erro ao carregar certificados: ${certificadosError.message}`
          );
        }

        if (
          certificadosData &&
          certificadosData.length >
            0
        ) {
          setCertificados(
            certificadosData.map(
              (
                certificado
              ) => ({
                id:
                  certificado.id,

                titulo:
                  certificado.titulo ||
                  "",

                descricao:
                  certificado.descricao ||
                  "",

                imagem_url:
                  certificado.imagem_url ||
                  null,

                novaImagem:
                  null,

                preview:
                  "",
              })
            )
          );

          setImagensCertificadosOriginais(
            certificadosData
              .map(
                (
                  certificado
                ) =>
                  certificado.imagem_url
              )
              .filter(
                (
                  url
                ): url is string =>
                  Boolean(
                    url
                  )
              )
          );
        } else {
          setCertificados([
            {
              id:
                generateId(),

              titulo:
                "Certificado de conclusão",

              descricao:
                "",

              imagem_url:
                null,

              novaImagem:
                null,

              preview:
                "",
            },
          ]);

          setImagensCertificadosOriginais(
            []
          );
        }

        /* ===============================================
           PROFESSOR
        =============================================== */

        const {
          data:
            relacaoProfessor,
          error:
            relacaoError,
        } = await supabase
          .from(
            "treinamentos_curso_professores"
          )
          .select(
            "professor_id"
          )
          .eq(
            "curso_id",
            cursoId
          )
          .order(
            "ordem",
            {
              ascending:
                true,
            }
          )
          .limit(1)
          .maybeSingle();

        if (
          relacaoError
        ) {
          throw new Error(
            `Erro ao carregar professor: ${relacaoError.message}`
          );
        }

        const relacao =
          relacaoProfessor as CursoProfessorRelation | null;

        if (
          relacao?.professor_id
        ) {
          const {
            data:
              professor,
            error:
              professorError,
          } = await supabase
            .from(
              "treinamentos_professores"
            )
            .select(`
              id,
              nome,
              descricao,
              foto_url,
              cargo
            `)
            .eq(
              "id",
              relacao.professor_id
            )
            .single();

          if (
            professorError
          ) {
            throw new Error(
              `Erro ao carregar dados do professor: ${professorError.message}`
            );
          }

          const dadosProfessor =
            professor as ProfessorCarregado;

          setProfessorId(
            dadosProfessor.id
          );

          setProfessorNome(
            dadosProfessor.nome ||
              ""
          );

          setProfessorCargo(
            dadosProfessor.cargo ||
              ""
          );

          setProfessorDescricao(
            dadosProfessor.descricao ||
              ""
          );

          setProfessorFotoAtualUrl(
            dadosProfessor.foto_url ||
              ""
          );
        }
      } catch (
        error
      ) {
        console.error(
          "Erro carregando treinamento:",
          error
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o treinamento."
        );
      } finally {
        setCarregando(
          false
        );
      }
    }

    void carregar();
  }, [cursoId]);

  /* =======================================================
     MÓDULOS
  ======================================================= */

  function adicionarModulo() {
    setModulos(
      (current) => [
        ...current,

        {
          id:
            generateId(),

          titulo: "",

          descricao: "",
        },
      ]
    );
  }

  function removerModulo(
    id: string
  ) {
    if (
      modulos.length === 1
    ) {
      return;
    }

    setModulos(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id
        )
    );
  }

  function atualizarModulo(
    id: string,
    campo: keyof Omit<
      Modulo,
      "id"
    >,
    valor: string
  ) {
    setModulos(
      (current) =>
        current.map(
          (item) =>
            item.id === id
              ? {
                  ...item,

                  [campo]:
                    valor,
                }
              : item
        )
    );
  }

  /* =======================================================
     BENEFÍCIOS
  ======================================================= */

  function adicionarBeneficio() {
    setBeneficios(
      (current) => [
        ...current,

        {
          id:
            generateId(),

          titulo: "",

          icone:
            "Award",
        },
      ]
    );
  }

  function removerBeneficio(
    id: string
  ) {
    if (
      beneficios.length ===
      1
    ) {
      return;
    }

    setBeneficios(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id
        )
    );
  }

  function atualizarBeneficio(
    id: string,
    campo: keyof Omit<
      Beneficio,
      "id"
    >,
    valor: string
  ) {
    setBeneficios(
      (current) =>
        current.map(
          (item) =>
            item.id === id
              ? {
                  ...item,

                  [campo]:
                    valor,
                }
              : item
        )
    );
  }

  /* =======================================================
     CERTIFICADOS
  ======================================================= */

  function adicionarCertificado() {
    setCertificados(
      (current) => [
        ...current,

        {
          id:
            generateId(),

          titulo:
            "Certificado de conclusão",

          descricao: "",

          imagem_url:
            null,

          novaImagem:
            null,

          preview:
            "",
        },
      ]
    );
  }

  function removerCertificado(
    id: string
  ) {
    setCertificados(
      (current) => {
        const certificado =
          current.find(
            (item) =>
              item.id === id
          );

        if (
          certificado?.preview
        ) {
          URL.revokeObjectURL(
            certificado.preview
          );
        }

        return current.filter(
          (item) =>
            item.id !== id
        );
      }
    );
  }

  function atualizarCertificado(
    id: string,
    campo:
      | "titulo"
      | "descricao",
    valor: string
  ) {
    setCertificados(
      (current) =>
        current.map(
          (
            certificado
          ) =>
            certificado.id ===
            id
              ? {
                  ...certificado,

                  [campo]:
                    valor,
                }
              : certificado
        )
    );
  }

  function atualizarImagemCertificado(
    id: string,
    file: File
  ) {
    validarImagem(file);

    setCertificados(
      (current) =>
        current.map(
          (
            certificado
          ) => {
            if (
              certificado.id !==
              id
            ) {
              return certificado;
            }

            if (
              certificado.preview
            ) {
              URL.revokeObjectURL(
                certificado.preview
              );
            }

            return {
              ...certificado,

              novaImagem:
                file,

              preview:
                URL.createObjectURL(
                  file
                ),
            };
          }
        )
    );
  }

  /* =======================================================
     IMAGEM CURSO
  ======================================================= */

  function handleImagemCurso(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target
        .files?.[0];

    if (!file) {
      return;
    }

    try {
      validarImagem(file);

      if (
        imagemCursoPreview
      ) {
        URL.revokeObjectURL(
          imagemCursoPreview
        );
      }

      setImagemCurso(file);

      setImagemCursoPreview(
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
        error instanceof Error
          ? error.message
          : "Imagem inválida."
      );
    }
  }

  /* =======================================================
     FOTO PROFESSOR
  ======================================================= */

  function handleProfessorFoto(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target
        .files?.[0];

    if (!file) {
      return;
    }

    try {
      validarImagem(file);

      if (
        professorFotoPreview
      ) {
        URL.revokeObjectURL(
          professorFotoPreview
        );
      }

      setProfessorFoto(file);

      setProfessorFotoPreview(
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
        error instanceof Error
          ? error.message
          : "Imagem inválida."
      );
    }
  }

  /* =======================================================
     UPLOAD
  ======================================================= */

  async function uploadImagem(
    supabase: SupabaseClient,
    file: File,
    pasta: string
  ) {
    validarImagem(file);

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
        `Erro ao enviar imagem: ${uploadError.message}`
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

  async function salvar() {
    if (salvando) {
      return;
    }

    setErro("");
    setSucesso("");

    /* -----------------------------------------------------
       VALIDAÇÕES
    ----------------------------------------------------- */

    if (
      !titulo.trim()
    ) {
      setErro(
        "Informe o título do treinamento."
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });

      return;
    }

    if (
      !slugify(
        slugCurso
      )
    ) {
      setErro(
        "Informe a URL do curso."
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });

      return;
    }

    if (
      !categoriaId
    ) {
      setErro(
        "Selecione uma categoria para o treinamento."
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });

      return;
    }

    if (
      !professorNome.trim()
    ) {
      setErro(
        "Informe o nome do professor."
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });

      return;
    }

    setSalvando(true);

    const supabase =
      createClient();

    const novosArquivos:
      string[] = [];

    try {
      /* ===============================================
         ADMIN
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
          "Você não possui permissão para editar este treinamento."
        );
      }

      /* ===============================================
         SLUG
      =============================================== */

      const slug =
        await validarSlugUnico(
          supabase,
          slugCurso,
          cursoId
        );

      /* ===============================================
         IMAGEM CURSO
      =============================================== */

      let novaImagemUrl =
        imagemAtualUrl ||
        null;

      let novaImagemPath:
        | string
        | null = null;

      if (
        imagemCurso
      ) {
        const upload =
          await uploadImagem(
            supabase,
            imagemCurso,
            "cursos"
          );

        novaImagemUrl =
          upload.url;

        novaImagemPath =
          upload.path;

        novosArquivos.push(
          upload.path
        );
      }

      /* ===============================================
         UPDATE CURSO
      =============================================== */

      const {
        error:
          cursoError,
      } = await supabase
        .from(
          "treinamentos_cursos"
        )
        .update({
          titulo:
            titulo.trim(),

          slug,

          categoria_id:
            Number(
              categoriaId
            ),

          descricao:
            descricao.trim() ||
            null,

          publico_alvo:
            publicoAlvo.trim() ||
            null,

          porque_aprender:
            porqueAprender.trim() ||
            null,

          objetivo_geral:
            objetivoGeral.trim() ||
            null,

          beneficios_curso:
            beneficiosCurso.trim() ||
            null,

          competencias_desenvolvidas:
            competenciasDesenvolvidas.trim() ||
            null,

          metodologia_aprendizagem:
            metodologiaAprendizagem.trim() ||
            null,

          avaliacao_certificacao:
            avaliacaoCertificacao.trim() ||
            null,

          resultado_esperado:
            resultadoEsperado.trim() ||
            null,

          imagem_url:
            novaImagemUrl,

         video_introdutorio_url:
  videoUrl.trim() ||
  null,

preco_de:
  precoDe.trim()
    ? Number(
        precoDe.replace(",", ".")
      )
    : null,

preco_para:
  precoPara.trim()
    ? Number(
        precoPara.replace(",", ".")
      )
    : null,

parcelamento:
  parcelamento.trim() ||
  null,

link_inscricao:
  linkInscricao.trim() ||
  null,

status,
        })
        .eq(
          "id",
          cursoId
        );

      if (
        cursoError
      ) {
        throw new Error(
          `Erro ao atualizar treinamento: ${cursoError.message}`
        );
      }

      /* ===============================================
         PROFESSOR
      =============================================== */

      let professorFinalId =
        professorId;

      if (
        !professorFinalId
      ) {
        const {
          data:
            novoProfessor,
          error:
            novoProfessorError,
        } = await supabase
          .from(
            "treinamentos_professores"
          )
          .insert({
            nome:
              professorNome.trim(),

            cargo:
              professorCargo.trim() ||
              null,

            descricao:
              professorDescricao.trim() ||
              null,

            foto_url:
              null,

            linkedin_url:
              null,

            ativo:
              true,
          })
          .select(
            "id"
          )
          .single();

        if (
          novoProfessorError
        ) {
          throw new Error(
            `Erro ao criar professor: ${novoProfessorError.message}`
          );
        }

        professorFinalId =
          novoProfessor.id;

        const {
          error:
            relacaoError,
        } = await supabase
          .from(
            "treinamentos_curso_professores"
          )
          .insert({
            curso_id:
              cursoId,

            professor_id:
              professorFinalId,

            papel:
              "Professor",

            ordem:
              0,
          });

        if (
          relacaoError
        ) {
          throw new Error(
            `Erro ao associar professor: ${relacaoError.message}`
          );
        }

        setProfessorId(
          professorFinalId
        );
      }

      if (
        !professorFinalId
      ) {
        throw new Error(
          "Não foi possível identificar o professor."
        );
      }

      /* ===============================================
         FOTO PROFESSOR
      =============================================== */

      let novaFotoProfessorUrl =
        professorFotoAtualUrl ||
        null;

      if (
        professorFoto
      ) {
        const upload =
          await uploadImagem(
            supabase,
            professorFoto,
            "professores"
          );

        novaFotoProfessorUrl =
          upload.url;

        novosArquivos.push(
          upload.path
        );
      }

      const {
        error:
          professorUpdateError,
      } = await supabase
        .from(
          "treinamentos_professores"
        )
        .update({
          nome:
            professorNome.trim(),

          cargo:
            professorCargo.trim() ||
            null,

          descricao:
            professorDescricao.trim() ||
            null,

          foto_url:
            novaFotoProfessorUrl,
        })
        .eq(
          "id",
          professorFinalId
        );

      if (
        professorUpdateError
      ) {
        throw new Error(
          `Erro ao atualizar professor: ${professorUpdateError.message}`
        );
      }

      /* ===============================================
         MÓDULOS
      =============================================== */

      const {
        error:
          deleteModulosError,
      } = await supabase
        .from(
          "treinamentos_modulos"
        )
        .delete()
        .eq(
          "curso_id",
          cursoId
        );

      if (
        deleteModulosError
      ) {
        throw new Error(
          `Erro ao atualizar módulos: ${deleteModulosError.message}`
        );
      }

      const modulosValidos =
        modulos
          .filter(
            (item) =>
              item.titulo.trim()
          )
          .map(
            (
              item,
              index
            ) => ({
              curso_id:
                cursoId,

              titulo:
                item.titulo.trim(),

              /*
               * O editor Tiptap salva HTML aqui.
               */
              descricao:
                item.descricao.trim() ||
                null,

              ordem:
                index +
                1,

              ativo:
                true,
            })
          );

      if (
        modulosValidos.length >
        0
      ) {
        const {
          error:
            insertModulosError,
        } = await supabase
          .from(
            "treinamentos_modulos"
          )
          .insert(
            modulosValidos
          );

        if (
          insertModulosError
        ) {
          throw new Error(
            `Erro ao salvar módulos: ${insertModulosError.message}`
          );
        }
      }

      /* ===============================================
         BENEFÍCIOS
      =============================================== */

      const {
        error:
          deleteBeneficiosError,
      } = await supabase
        .from(
          "treinamentos_beneficios"
        )
        .delete()
        .eq(
          "curso_id",
          cursoId
        );

      if (
        deleteBeneficiosError
      ) {
        throw new Error(
          `Erro ao atualizar benefícios: ${deleteBeneficiosError.message}`
        );
      }

      const beneficiosValidos =
        beneficios
          .filter(
            (item) =>
              item.titulo.trim()
          )
          .map(
            (
              item,
              index
            ) => ({
              curso_id:
                cursoId,

              titulo:
                item.titulo.trim(),

              /*
               * Não usamos mais descrição
               * nos benefícios.
               */
              descricao:
                null,

              icone:
                item.icone,

              ordem:
                index +
                1,

              ativo:
                true,
            })
          );

      if (
        beneficiosValidos.length >
        0
      ) {
        const {
          error:
            insertBeneficiosError,
        } = await supabase
          .from(
            "treinamentos_beneficios"
          )
          .insert(
            beneficiosValidos
          );

        if (
          insertBeneficiosError
        ) {
          throw new Error(
            `Erro ao salvar benefícios: ${insertBeneficiosError.message}`
          );
        }
      }

      /* ===============================================
         CERTIFICADOS
      =============================================== */

      const {
        error:
          deleteCertificadosError,
      } = await supabase
        .from(
          "treinamentos_certificados"
        )
        .delete()
        .eq(
          "curso_id",
          cursoId
        );

      if (
        deleteCertificadosError
      ) {
        throw new Error(
          `Erro ao atualizar certificados: ${deleteCertificadosError.message}`
        );
      }

      /*
       * Vamos guardar as URLs finais para descobrir
       * quais imagens antigas deixaram de ser usadas.
       */
      const urlsCertificadosFinais:
        string[] = [];

      for (
        let index = 0;
        index <
        certificados.length;
        index++
      ) {
        const certificado =
          certificados[index];

        if (
          !certificado.titulo.trim()
        ) {
          continue;
        }

        let imagemUrl =
          certificado.imagem_url;

        /*
         * Nova imagem selecionada.
         */
        if (
          certificado.novaImagem
        ) {
          const upload =
            await uploadImagem(
              supabase,
              certificado.novaImagem,
              "certificados"
            );

          novosArquivos.push(
            upload.path
          );

          imagemUrl =
            upload.url;
        }

        if (
          imagemUrl
        ) {
          urlsCertificadosFinais.push(
            imagemUrl
          );
        }

        const {
          error:
            certificadoError,
        } = await supabase
          .from(
            "treinamentos_certificados"
          )
          .insert({
            curso_id:
              cursoId,

            titulo:
              certificado.titulo.trim(),

            descricao:
              certificado.descricao.trim() ||
              null,

            imagem_url:
              imagemUrl ||
              null,

            ativo:
              true,

            ordem:
              index +
              1,
          });

        if (
          certificadoError
        ) {
          throw new Error(
            `Erro ao salvar certificado: ${certificadoError.message}`
          );
        }
      }

      /* ===============================================
         APAGAR IMAGEM ANTIGA DO CURSO
      =============================================== */

      if (
        imagemCurso &&
        imagemAtualUrl
      ) {
        const oldPath =
          extrairStoragePath(
            imagemAtualUrl
          );

        if (
          oldPath &&
          oldPath !==
            novaImagemPath
        ) {
          await supabase.storage
            .from(
              "treinamentos-media"
            )
            .remove([
              oldPath,
            ]);
        }
      }

      /* ===============================================
         APAGAR FOTO ANTIGA PROFESSOR
      =============================================== */

      if (
        professorFoto &&
        professorFotoAtualUrl
      ) {
        const oldPath =
          extrairStoragePath(
            professorFotoAtualUrl
          );

        if (
          oldPath
        ) {
          await supabase.storage
            .from(
              "treinamentos-media"
            )
            .remove([
              oldPath,
            ]);
        }
      }

      /* ===============================================
         APAGAR IMAGENS ANTIGAS DE CERTIFICADOS
      =============================================== */

      for (
        const urlOriginal
        of imagensCertificadosOriginais
      ) {
        if (
          urlsCertificadosFinais.includes(
            urlOriginal
          )
        ) {
          continue;
        }

        const oldPath =
          extrairStoragePath(
            urlOriginal
          );

        if (
          oldPath
        ) {
          await supabase.storage
            .from(
              "treinamentos-media"
            )
            .remove([
              oldPath,
            ]);
        }
      }

      /* ===============================================
         SUCESSO
      =============================================== */

      setSucesso(
        "Treinamento atualizado com sucesso."
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });

      setTimeout(() => {
        router.push(
          "/admin/treinamentos"
        );

        router.refresh();
      }, 1000);
    } catch (
      error
    ) {
      console.error(
        "Erro ao editar treinamento:",
        error
      );

      /*
       * Se ocorreu erro depois de enviar arquivos novos,
       * tenta removê-los para não deixar lixo no Storage.
       */
      if (
        novosArquivos.length >
        0
      ) {
        await supabase.storage
          .from(
            "treinamentos-media"
          )
          .remove(
            novosArquivos
          );
      }

      setErro(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao editar o treinamento."
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

    void salvar();
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    carregando
  ) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center">
        <LoaderCircle
          size={30}
          className="animate-spin text-emerald-600"
        />

        <p className="mt-3 text-sm text-zinc-500">
          Carregando treinamento...
        </p>
      </div>
    );
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
              href="/admin/treinamentos"
              className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-100"
            >
              <ArrowLeft
                size={18}
              />
            </Link>

            <div>
              <div className="mb-1 flex items-center gap-2">
                <p className="text-sm font-medium text-emerald-600">
                  Treinamentos
                </p>

                <span className="text-zinc-300">
                  /
                </span>

                <p className="text-sm text-zinc-500">
                  Editar
                </p>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-zinc-950 lg:text-3xl">
                Editar treinamento
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                Atualize as informações do treinamento.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={
              salvando
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

                Salvar alterações
              </>
            )}
          </Button>
        </div>

        {/* =================================================
            MENSAGENS
        ================================================= */}

        {erro && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="font-semibold text-red-800">
                Não foi possível salvar
              </p>

              <p className="mt-1 text-sm text-red-700">
                {erro}
              </p>
            </div>
          </div>
        )}

        {sucesso && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <p className="text-sm font-medium text-emerald-800">
              {sucesso}
            </p>
          </div>
        )}

        <Separator />

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
          {/* =================================================
              COLUNA PRINCIPAL
          ================================================= */}

          <div className="space-y-6">
            {/* =============================================
                INFORMAÇÕES PRINCIPAIS
            ============================================= */}

            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <BookOpen
                      size={20}
                    />
                  </div>

                  <div>
                    <CardTitle>
                      Informações principais
                    </CardTitle>

                    <CardDescription className="mt-1">
                      Informações que apresentam o treinamento.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>
                    Título
                  </Label>

                  <Input
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
                    disabled={
                      salvando
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    URL do curso
                  </Label>

                  <div className="flex overflow-hidden rounded-md border border-input shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50">
                    <div className="flex shrink-0 items-center border-r border-input bg-zinc-50 px-3 text-sm text-zinc-500">
                      /cursos/
                    </div>

                    <Input
                      value={
                        slugCurso
                      }
                      onChange={(
                        event
                      ) =>
                        setSlugCurso(
                          event.target
                            .value
                        )
                      }
                      onBlur={() =>
                        setSlugCurso(
                          slugify(
                            slugCurso
                          )
                        )
                      }
                      placeholder="nome-do-curso"
                      className="rounded-none border-0 shadow-none focus-visible:ring-0"
                      disabled={
                        salvando
                      }
                      required
                    />
                  </div>

                  <p className="text-xs text-zinc-500">
                    URL pública: /cursos/
                    {slugify(
                      slugCurso
                    ) ||
                      "nome-do-curso"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>
                    Categoria
                  </Label>

                  <Select
                    value={
                      categoriaId
                    }
                    disabled={
                      salvando
                    }
                    onValueChange={(value) =>
                      setCategoriaId(
                        value ?? ""
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>

                    <SelectContent>
                      {categorias.map(
                        (
                          categoria
                        ) => (
                          <SelectItem
                            key={
                              categoria.id
                            }
                            value={String(
                              categoria.id
                            )}
                          >
                            {
                              categoria.nome
                            }

                            {!categoria.ativo
                              ? " (Inativa)"
                              : ""}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>

                  <p className="text-xs text-zinc-500">
                    Categoria utilizada para organizar e filtrar este treinamento no site.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>
                    Descrição
                  </Label>

                  <Textarea
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
                    className="min-h-[150px]"
                    disabled={
                      salvando
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Público-alvo
                  </Label>

                  <Textarea
                    value={
                      publicoAlvo
                    }
                    onChange={(
                      event
                    ) =>
                      setPublicoAlvo(
                        event.target
                          .value
                      )
                    }
                    className="min-h-[120px]"
                    disabled={
                      salvando
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* =============================================
                POR QUE APRENDER
            ============================================= */}

            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Brain
                      size={20}
                    />
                  </div>

                  <div>
                    <CardTitle>
                      Por que aprender sobre este treinamento?
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Textarea
                  value={
                    porqueAprender
                  }
                  onChange={(
                    event
                  ) =>
                    setPorqueAprender(
                      event.target
                        .value
                    )
                  }
                  className="min-h-[170px]"
                  disabled={
                    salvando
                  }
                />
              </CardContent>
            </Card>

            {/* =============================================
                DETALHES DO CURSO
            ============================================= */}

            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Target
                      size={20}
                    />
                  </div>

                  <div>
                    <CardTitle>
                      Detalhes do curso
                    </CardTitle>

                    <CardDescription className="mt-1">
                      Informações complementares sobre objetivos, metodologia, competências e resultados.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>
                    Objetivo Geral
                  </Label>

                  <Textarea
                    value={
                      objetivoGeral
                    }
                    onChange={(
                      event
                    ) =>
                      setObjetivoGeral(
                        event.target
                          .value
                      )
                    }
                    placeholder="Descreva o objetivo geral do curso..."
                    className="min-h-[140px]"
                    disabled={
                      salvando
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Benefícios do curso
                  </Label>

                  <Textarea
                    value={
                      beneficiosCurso
                    }
                    onChange={(
                      event
                    ) =>
                      setBeneficiosCurso(
                        event.target
                          .value
                      )
                    }
                    placeholder="Descreva os principais benefícios do curso..."
                    className="min-h-[140px]"
                    disabled={
                      salvando
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Competências desenvolvidas
                  </Label>

                  <Textarea
                    value={
                      competenciasDesenvolvidas
                    }
                    onChange={(
                      event
                    ) =>
                      setCompetenciasDesenvolvidas(
                        event.target
                          .value
                      )
                    }
                    placeholder="Informe as competências que serão desenvolvidas..."
                    className="min-h-[140px]"
                    disabled={
                      salvando
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Metodologia de aprendizagem
                  </Label>

                  <Textarea
                    value={
                      metodologiaAprendizagem
                    }
                    onChange={(
                      event
                    ) =>
                      setMetodologiaAprendizagem(
                        event.target
                          .value
                      )
                    }
                    placeholder="Explique como será conduzida a aprendizagem..."
                    className="min-h-[140px]"
                    disabled={
                      salvando
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Avaliação e certificação
                  </Label>

                  <Textarea
                    value={
                      avaliacaoCertificacao
                    }
                    onChange={(
                      event
                    ) =>
                      setAvaliacaoCertificacao(
                        event.target
                          .value
                      )
                    }
                    placeholder="Explique os critérios de avaliação e certificação..."
                    className="min-h-[140px]"
                    disabled={
                      salvando
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Resultado esperado ao final do curso
                  </Label>

                  <Textarea
                    value={
                      resultadoEsperado
                    }
                    onChange={(
                      event
                    ) =>
                      setResultadoEsperado(
                        event.target
                          .value
                      )
                    }
                    placeholder="Descreva o resultado esperado ao final do curso..."
                    className="min-h-[140px]"
                    disabled={
                      salvando
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* =============================================
                CONTEÚDO / MÓDULOS
            ============================================= */}

            <Card>
              <CardHeader>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <GraduationCap
                        size={20}
                      />
                    </div>

                    <div>
                      <CardTitle>
                        Conteúdo do curso
                      </CardTitle>

                      <CardDescription className="mt-1">
                        Organize o conteúdo em módulos e utilize listas e formatação.
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      salvando
                    }
                    onClick={
                      adicionarModulo
                    }
                  >
                    <Plus
                      size={16}
                    />

                    Adicionar módulo
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {modulos.map(
                  (
                    modulo,
                    index
                  ) => (
                    <div
                      key={
                        modulo.id
                      }
                      className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
                            {index +
                              1}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-zinc-900">
                              Módulo{" "}
                              {index +
                                1}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={
                            modulos.length ===
                              1 ||
                            salvando
                          }
                          onClick={() =>
                            removerModulo(
                              modulo.id
                            )
                          }
                          className="text-zinc-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2
                            size={17}
                          />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>
                            Título do módulo
                          </Label>

                          <Input
                            value={
                              modulo.titulo
                            }
                            onChange={(
                              event
                            ) =>
                              atualizarModulo(
                                modulo.id,
                                "titulo",
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="Título do módulo"
                            disabled={
                              salvando
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Conteúdo do módulo
                          </Label>

                          <RichTextEditor
                            value={
                              modulo.descricao
                            }
                            disabled={
                              salvando
                            }
                            onChange={(
                              value
                            ) =>
                              atualizarModulo(
                                modulo.id,
                                "descricao",
                                value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}

                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    salvando
                  }
                  onClick={
                    adicionarModulo
                  }
                  className="w-full border-dashed"
                >
                  <Plus
                    size={16}
                  />

                  Adicionar outro módulo
                </Button>
              </CardContent>
            </Card>

            {/* =============================================
                BENEFÍCIOS
            ============================================= */}

            <Card>
              <CardHeader>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Sparkles
                        size={20}
                      />
                    </div>

                    <div>
                      <CardTitle>
                        Benefícios
                      </CardTitle>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      adicionarBeneficio
                    }
                    disabled={
                      salvando
                    }
                  >
                    <Plus
                      size={16}
                    />

                    Adicionar benefício
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {beneficios.map(
                  (
                    beneficio,
                    index
                  ) => {
                    const Icon =
                      benefitIcons[
                        beneficio.icone as BenefitIconName
                      ] ||
                      Award;

                    return (
                      <div
                        key={
                          beneficio.id
                        }
                        className="rounded-xl border border-zinc-200 p-5"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                              <Icon
                                size={19}
                              />
                            </div>

                            <p className="text-sm font-semibold text-zinc-900">
                              Benefício{" "}
                              {index +
                                1}
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={
                              beneficios.length ===
                                1 ||
                              salvando
                            }
                            onClick={() =>
                              removerBeneficio(
                                beneficio.id
                              )
                            }
                            className="text-zinc-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2
                              size={
                                17
                              }
                            />
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                          <div className="space-y-2">
                            <Label>
                              Ícone
                            </Label>

                            <Select
                              value={
                                beneficio.icone
                              }
                              disabled={
                                salvando
                              }
                              onValueChange={(value) =>
                                atualizarBeneficio(
                                  beneficio.id,
                                  "icone",
                                  value ?? ""
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>

                              <SelectContent>
                                <SelectItem value="BriefcaseBusiness">
                                  Atualização profissional
                                </SelectItem>

                                <SelectItem value="TrendingUp">
                                  Crescimento profissional
                                </SelectItem>

                                <SelectItem value="FileUser">
                                  Currículo
                                </SelectItem>

                                <SelectItem value="Award">
                                  Reconhecimento
                                </SelectItem>

                                <SelectItem value="Target">
                                  Objetivos
                                </SelectItem>

                                <SelectItem value="Brain">
                                  Conhecimento
                                </SelectItem>

                                <SelectItem value="ChartNoAxesCombined">
                                  Desenvolvimento
                                </SelectItem>

                                <SelectItem value="Sparkles">
                                  Destaque
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>
                              Título
                            </Label>

                            <Input
                              value={
                                beneficio.titulo
                              }
                              onChange={(
                                event
                              ) =>
                                atualizarBeneficio(
                                  beneficio.id,
                                  "titulo",
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder="Ex.: Atualização Profissional"
                              disabled={
                                salvando
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    adicionarBeneficio
                  }
                  disabled={
                    salvando
                  }
                  className="w-full border-dashed"
                >
                  <Plus
                    size={16}
                  />

                  Adicionar outro benefício
                </Button>
              </CardContent>
            </Card>

            {/* =============================================
                PROFESSOR
            ============================================= */}

            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <UserRound
                      size={20}
                    />
                  </div>

                  <div>
                    <CardTitle>
                      Professor
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
                  {/* FOTO */}

                  <div>
                    <Label>
                      Foto
                    </Label>

                    <label className="mt-2 flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50">
                      {professorFotoPreview ||
                      professorFotoAtualUrl ? (
                        <img
                          src={
                            professorFotoPreview ||
                            professorFotoAtualUrl
                          }
                          alt={
                            professorNome ||
                            "Professor"
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <Upload
                            size={21}
                            className="mx-auto text-zinc-400"
                          />

                          <p className="mt-2 text-xs text-zinc-500">
                            Enviar foto
                          </p>
                        </div>
                      )}

                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={
                          salvando
                        }
                        onChange={
                          handleProfessorFoto
                        }
                      />
                    </label>
                  </div>

                  {/* DADOS */}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        Nome
                      </Label>

                      <Input
                        value={
                          professorNome
                        }
                        onChange={(
                          event
                        ) =>
                          setProfessorNome(
                            event.target
                              .value
                          )
                        }
                        placeholder="Nome do professor"
                        disabled={
                          salvando
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Cargo / especialidade
                      </Label>

                      <Input
                        value={
                          professorCargo
                        }
                        onChange={(
                          event
                        ) =>
                          setProfessorCargo(
                            event.target
                              .value
                          )
                        }
                        placeholder="Cargo / especialidade"
                        disabled={
                          salvando
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Descrição
                      </Label>

                      <Textarea
                        value={
                          professorDescricao
                        }
                        onChange={(
                          event
                        ) =>
                          setProfessorDescricao(
                            event.target
                              .value
                          )
                        }
                        placeholder="Apresente o professor..."
                        className="min-h-[130px]"
                        disabled={
                          salvando
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* =============================================
                CERTIFICADOS
            ============================================= */}

            <Card>
              <CardHeader>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Award
                        size={20}
                      />
                    </div>

                    <div>
                      <CardTitle>
                        Certificados
                      </CardTitle>

                      <CardDescription className="mt-1">
                        Cadastre um ou mais certificados relacionados ao treinamento.
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      adicionarCertificado
                    }
                    disabled={
                      salvando
                    }
                  >
                    <Plus
                      size={16}
                    />

                    Adicionar certificado
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {certificados.length ===
                  0 && (
                  <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center">
                    <Award
                      size={24}
                      className="mx-auto text-zinc-300"
                    />

                    <p className="mt-3 text-sm text-zinc-500">
                      Nenhum certificado cadastrado.
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={
                        adicionarCertificado
                      }
                    >
                      <Plus
                        size={16}
                      />

                      Adicionar certificado
                    </Button>
                  </div>
                )}

                {certificados.map(
                  (
                    certificado,
                    index
                  ) => (
                    <div
                      key={
                        certificado.id
                      }
                      className="rounded-xl border border-zinc-200 p-5"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <Award
                              size={18}
                            />
                          </div>

                          <p className="text-sm font-semibold text-zinc-900">
                            Certificado{" "}
                            {index +
                              1}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={
                            salvando
                          }
                          onClick={() =>
                            removerCertificado(
                              certificado.id
                            )
                          }
                          className="text-zinc-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2
                            size={
                              17
                            }
                          />
                        </Button>
                      </div>

                      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                        {/* IMAGEM */}

                        <div>
                          <Label>
                            Imagem do certificado
                          </Label>

                          <label className="mt-2 flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition hover:border-emerald-400 hover:bg-emerald-50/30">
                            {certificado.preview ||
                            certificado.imagem_url ? (
                              <img
                                src={
                                  certificado.preview ||
                                  certificado.imagem_url ||
                                  ""
                                }
                                alt={
                                  certificado.titulo ||
                                  `Certificado ${index + 1}`
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="px-4 text-center">
                                <Upload
                                  size={21}
                                  className="mx-auto text-zinc-400"
                                />

                                <p className="mt-2 text-xs font-medium text-zinc-600">
                                  Enviar imagem
                                </p>

                                <p className="mt-1 text-[11px] text-zinc-400">
                                  JPG, PNG ou WEBP
                                </p>
                              </div>
                            )}

                            <input
                              type="file"
                              className="hidden"
                              accept="image/jpeg,image/png,image/webp"
                              disabled={
                                salvando
                              }
                              onChange={(
                                event
                              ) => {
                                const file =
                                  event.target
                                    .files?.[0];

                                if (
                                  !file
                                ) {
                                  return;
                                }

                                try {
                                  atualizarImagemCertificado(
                                    certificado.id,
                                    file
                                  );

                                  setErro(
                                    ""
                                  );
                                } catch (
                                  error
                                ) {
                                  event.target.value =
                                    "";

                                  setErro(
                                    error instanceof Error
                                      ? error.message
                                      : "Imagem inválida."
                                  );
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* DADOS */}

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>
                              Título
                            </Label>

                            <Input
                              value={
                                certificado.titulo
                              }
                              disabled={
                                salvando
                              }
                              placeholder="Ex.: Certificado de conclusão"
                              onChange={(
                                event
                              ) =>
                                atualizarCertificado(
                                  certificado.id,
                                  "titulo",
                                  event
                                    .target
                                    .value
                                )
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>
                              Descrição
                            </Label>

                            <Textarea
                              value={
                                certificado.descricao
                              }
                              disabled={
                                salvando
                              }
                              className="min-h-[120px]"
                              placeholder="Informações sobre este certificado..."
                              onChange={(
                                event
                              ) =>
                                atualizarCertificado(
                                  certificado.id,
                                  "descricao",
                                  event
                                    .target
                                    .value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {certificados.length >
                  0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      adicionarCertificado
                    }
                    disabled={
                      salvando
                    }
                    className="w-full border-dashed"
                  >
                    <Plus
                      size={16}
                    />

                    Adicionar outro certificado
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* =================================================
              COLUNA LATERAL
          ================================================= */}

          <div className="space-y-6 xl:sticky xl:top-[92px]">
            {/* =============================================
                PUBLICAÇÃO
            ============================================= */}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Publicação
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>
                    Status
                  </Label>

                  <Select
                    value={
                      status
                    }
                    disabled={
                      salvando
                    }
                    onValueChange={(value) => {
                      if (!value) {
                        return;
                      }

                      setStatus(
                        value as StatusTreinamento
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="rascunho">
                        Rascunho
                      </SelectItem>

                      <SelectItem value="publicado">
                        Publicado
                      </SelectItem>

                      <SelectItem value="inativo">
                        Inativo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">
                    Módulos
                  </span>

                  <Badge variant="secondary">
                    {
                      modulos.filter(
                        (
                          item
                        ) =>
                          item.titulo.trim()
                      ).length
                    }
                  </Badge>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">
                    Benefícios
                  </span>

                  <Badge variant="secondary">
                    {
                      beneficios.filter(
                        (
                          item
                        ) =>
                          item.titulo.trim()
                      ).length
                    }
                  </Badge>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">
                    Certificados
                  </span>

                  <Badge variant="secondary">
                    {
                      certificados.filter(
                        (
                          item
                        ) =>
                          item.titulo.trim()
                      ).length
                    }
                  </Badge>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">
                    Professor
                  </span>

                  {professorNome.trim() ? (
                    <CircleCheck
                      size={17}
                      className="text-emerald-600"
                    />
                  ) : (
                    <span className="text-xs text-zinc-400">
                      Pendente
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={
                    salvando
                  }
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
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

                      Salvar alterações
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* =============================================
                IMAGEM TREINAMENTO
            ============================================= */}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ImageIcon
                    size={18}
                    className="text-emerald-600"
                  />

                  <CardTitle className="text-base">
                    Imagem do treinamento
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent>
                <label className="flex aspect-[16/10] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition hover:border-emerald-400">
                  {imagemCursoPreview ||
                  imagemAtualUrl ? (
                    <img
                      src={
                        imagemCursoPreview ||
                        imagemAtualUrl
                      }
                      alt={
                        titulo ||
                        "Treinamento"
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload
                        size={21}
                        className="mx-auto text-zinc-400"
                      />

                      <p className="mt-2 text-xs text-zinc-500">
                        Enviar imagem
                      </p>
                    </div>
                  )}

                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      handleImagemCurso
                    }
                    disabled={
                      salvando
                    }
                  />
                </label>
              </CardContent>
            </Card>


{/* =============================================
    PREÇO E INSCRIÇÃO
============================================= */}

<Card>
  <CardHeader>
    <CardTitle className="text-base">
      Preço e inscrição
    </CardTitle>

    <CardDescription>
      Configure o valor e o link utilizado no botão Me inscrever.
    </CardDescription>
  </CardHeader>

  <CardContent className="space-y-5">
    {/* PREÇOS */}

    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label>
          De
        </Label>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
            R$
          </span>

          <Input
            type="number"
            min="0"
            step="0.01"
            value={precoDe}
            onChange={(event) =>
              setPrecoDe(
                event.target.value
              )
            }
            placeholder="1497,00"
            className="pl-10"
            disabled={salvando}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          Para
        </Label>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
            R$
          </span>

          <Input
            type="number"
            min="0"
            step="0.01"
            value={precoPara}
            onChange={(event) =>
              setPrecoPara(
                event.target.value
              )
            }
            placeholder="997,00"
            className="pl-10"
            disabled={salvando}
          />
        </div>
      </div>
    </div>

    {/* PARCELAMENTO */}

    <div className="space-y-2">
      <Label>
        Parcelamento
      </Label>

      <Input
        value={parcelamento}
        onChange={(event) =>
          setParcelamento(
            event.target.value
          )
        }
        placeholder="Ex.: 12x de R$ 83,08 sem juros"
        disabled={salvando}
      />

      <p className="text-xs text-zinc-400">
        Texto exibido abaixo do preço.
      </p>
    </div>

    {/* LINK */}

    <div className="space-y-2">
      <Label>
        Link do curso
      </Label>

      <Input
        type="url"
        value={linkInscricao}
        onChange={(event) =>
          setLinkInscricao(
            event.target.value
          )
        }
        placeholder="https://..."
        disabled={salvando}
      />

      <p className="text-xs text-zinc-400">
        Este endereço será utilizado no botão
        <strong className="ml-1 font-semibold text-zinc-600">
          Me inscrever
        </strong>.
      </p>
    </div>
  </CardContent>
</Card>

            {/* =============================================
                VÍDEO
            ============================================= */}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Video
                    size={18}
                    className="text-emerald-600"
                  />

                  <CardTitle className="text-base">
                    Vídeo introdutório
                  </CardTitle>
                </div>

                <CardDescription>
                  YouTube, Vimeo ou outro endereço de vídeo.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  <Label>
                    URL do vídeo
                  </Label>

                  <Input
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
                    placeholder="https://youtube.com/..."
                    disabled={
                      salvando
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </form>
  );
}