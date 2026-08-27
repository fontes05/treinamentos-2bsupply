"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

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

type Categoria = {
  id: number;
  nome: string;
  slug: string;
  ativo: boolean;
};

type Modulo = {
  id: string;
  titulo: string;
  descricao: string;
};

type Beneficio = {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
};

type StatusTreinamento =
  | "rascunho"
  | "publicado"
  | "inativo";

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
   Gerar slug
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
   Garante slug único
--------------------------------------------------------- */

async function gerarSlugUnico(
  supabase: SupabaseClient,
  titulo: string
) {
  const base =
    slugify(titulo) ||
    `treinamento-${Date.now()}`;

  let slug = base;
  let numero = 2;

  while (true) {
    const {
      data,
      error,
    } = await supabase
      .from("treinamentos_cursos")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Não foi possível gerar o slug: ${error.message}`
      );
    }

    if (!data) {
      return slug;
    }

    slug = `${base}-${numero}`;
    numero++;
  }
}

/* ---------------------------------------------------------
   Extensão da imagem
--------------------------------------------------------- */

function getFileExtension(file: File) {
  const parts = file.name.split(".");

  if (parts.length < 2) {
    if (file.type === "image/png") {
      return "png";
    }

    if (file.type === "image/webp") {
      return "webp";
    }

    return "jpg";
  }

  return (
    parts
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") ||
    "jpg"
  );
}

/* ---------------------------------------------------------
   Validação de imagem
--------------------------------------------------------- */

function validarImagem(file: File) {
  const tiposPermitidos = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (
    !tiposPermitidos.includes(file.type)
  ) {
    throw new Error(
      "Use apenas imagens JPG, PNG ou WEBP."
    );
  }

  const limite = 5 * 1024 * 1024;

  if (file.size > limite) {
    throw new Error(
      "A imagem deve ter no máximo 5 MB."
    );
  }
}

/* =========================================================
   PÁGINA
========================================================= */

export default function NovoTreinamentoPage() {
  const router = useRouter();

  /* =======================================================
     INFORMAÇÕES PRINCIPAIS
  ======================================================= */

  const [titulo, setTitulo] =
    useState("");

  const [descricao, setDescricao] =
    useState("");

  const [
    publicoAlvo,
    setPublicoAlvo,
  ] = useState("");

  const [
    porqueAprender,
    setPorqueAprender,
  ] = useState("");

  const [status, setStatus] =
    useState<StatusTreinamento>(
      "rascunho"
    );

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

  const [
    carregandoCategorias,
    setCarregandoCategorias,
  ] = useState(true);

  /* =======================================================
     IMAGEM DO CURSO
  ======================================================= */

  const [
    imagemCurso,
    setImagemCurso,
  ] = useState<File | null>(null);

  const [
    imagemCursoPreview,
    setImagemCursoPreview,
  ] = useState("");

  /* =======================================================
     VÍDEO
  ======================================================= */

  const [videoUrl, setVideoUrl] =
    useState("");

  /* =======================================================
     PROFESSOR
  ======================================================= */

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
    professorFoto,
    setProfessorFoto,
  ] = useState<File | null>(null);

  const [
    professorFotoPreview,
    setProfessorFotoPreview,
  ] = useState("");

  /* =======================================================
     CERTIFICADO
  ======================================================= */

  const [
    certificadoTitulo,
    setCertificadoTitulo,
  ] = useState(
    "Certificado de conclusão"
  );

  const [
    certificadoDescricao,
    setCertificadoDescricao,
  ] = useState("");

  /* =======================================================
     MÓDULOS
  ======================================================= */

  const [modulos, setModulos] =
    useState<Modulo[]>([
      {
        id: generateId(),
        titulo: "",
        descricao: "",
      },
    ]);

  /* =======================================================
     BENEFÍCIOS
  ======================================================= */

  const [
    beneficios,
    setBeneficios,
  ] = useState<Beneficio[]>([
    {
      id: generateId(),
      titulo: "",
      descricao: "",
      icone: "BriefcaseBusiness",
    },
  ]);

  /* =======================================================
     ESTADO DO SALVAMENTO
  ======================================================= */

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  /* =======================================================
     CARREGAR CATEGORIAS
  ======================================================= */

  useEffect(() => {
    async function carregarCategorias() {
      setCarregandoCategorias(true);

      const supabase =
        createClient();

      try {
        const {
          data,
          error,
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
          .eq(
            "ativo",
            true
          )
          .order(
            "nome",
            {
              ascending:
                true,
            }
          );

        if (error) {
          throw new Error(
            `Não foi possível carregar as categorias: ${error.message}`
          );
        }

        setCategorias(
          (data ?? []) as Categoria[]
        );
      } catch (error) {
        console.error(
          "Erro ao carregar categorias:",
          error
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as categorias."
        );
      } finally {
        setCarregandoCategorias(
          false
        );
      }
    }

    void carregarCategorias();
  }, []);

  /* =======================================================
     MÓDULOS
  ======================================================= */

  function adicionarModulo() {
    setModulos((current) => [
      ...current,
      {
        id: generateId(),
        titulo: "",
        descricao: "",
      },
    ]);
  }

  function removerModulo(
    id: string
  ) {
    if (modulos.length === 1) {
      return;
    }

    setModulos((current) =>
      current.filter(
        (modulo) =>
          modulo.id !== id
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
    setModulos((current) =>
      current.map((modulo) =>
        modulo.id === id
          ? {
              ...modulo,
              [campo]: valor,
            }
          : modulo
      )
    );
  }

  /* =======================================================
     BENEFÍCIOS
  ======================================================= */

  function adicionarBeneficio() {
    setBeneficios((current) => [
      ...current,
      {
        id: generateId(),
        titulo: "",
        descricao: "",
        icone: "Award",
      },
    ]);
  }

  function removerBeneficio(
    id: string
  ) {
    if (beneficios.length === 1) {
      return;
    }

    setBeneficios((current) =>
      current.filter(
        (beneficio) =>
          beneficio.id !== id
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
    setBeneficios((current) =>
      current.map(
        (beneficio) =>
          beneficio.id === id
            ? {
                ...beneficio,
                [campo]: valor,
              }
            : beneficio
      )
    );
  }

  /* =======================================================
     IMAGEM DO CURSO
  ======================================================= */

  function handleImagemCurso(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

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
        URL.createObjectURL(file)
      );

      setErro("");
    } catch (error) {
      event.target.value = "";

      setErro(
        error instanceof Error
          ? error.message
          : "Imagem inválida."
      );
    }
  }

  /* =======================================================
     FOTO DO PROFESSOR
  ======================================================= */

  function handleProfessorFoto(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

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
        URL.createObjectURL(file)
      );

      setErro("");
    } catch (error) {
      event.target.value = "";

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
      getFileExtension(file);

    const fileName =
      `${crypto.randomUUID()}.${extension}`;

    const path =
      `${pasta}/${fileName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("treinamentos-media")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(
        `Erro ao enviar imagem: ${uploadError.message}`
      );
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from("treinamentos-media")
      .getPublicUrl(path);

    return {
      path,
      url:
        publicUrlData.publicUrl,
    };
  }

  /* =======================================================
     SALVAR
  ======================================================= */

  async function salvarTreinamento(
    statusParaSalvar:
      StatusTreinamento
  ) {
    if (salvando) {
      return;
    }

    setErro("");
    setSucesso("");

    /* -----------------------------------------------------
       VALIDAÇÕES
    ----------------------------------------------------- */

    if (!titulo.trim()) {
      setErro(
        "Informe o título do treinamento."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (!categoriaId) {
      setErro(
        "Selecione uma categoria para o treinamento."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (!professorNome.trim()) {
      setErro(
        "Informe o nome do professor."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setSalvando(true);

    const supabase =
      createClient();

    let cursoId:
      | string
      | null = null;

    let professorId:
      | string
      | null = null;

    const arquivosEnviados:
      string[] = [];

    try {
      /* ===================================================
         1. VERIFICAR SESSÃO
      =================================================== */

      const {
        data: userData,
        error: userError,
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

      /* ===================================================
         2. VERIFICAR ADMIN
      =================================================== */

      const {
        data: isAdmin,
        error: adminError,
      } = await supabase.rpc(
        "treinamentos_is_admin"
      );

      if (
        adminError ||
        isAdmin !== true
      ) {
        throw new Error(
          "Você não possui permissão para cadastrar treinamentos."
        );
      }

      /* ===================================================
         3. GERAR SLUG
      =================================================== */

      const slug =
        await gerarSlugUnico(
          supabase,
          titulo
        );

      /* ===================================================
         4. CRIAR CURSO
      =================================================== */

      const {
        data: curso,
        error: cursoError,
      } = await supabase
        .from(
          "treinamentos_cursos"
        )
        .insert({
          titulo:
            titulo.trim(),

          slug,

          categoria_id:
            Number(categoriaId),

          descricao:
            descricao.trim() ||
            null,

          publico_alvo:
            publicoAlvo.trim() ||
            null,

          porque_aprender:
            porqueAprender.trim() ||
            null,

          imagem_url: null,

          video_introdutorio_url:
            videoUrl.trim() ||
            null,

          status:
            statusParaSalvar,

          destaque: false,

          ordem: 0,
        })
        .select("id")
        .single();

      if (cursoError) {
        throw new Error(
          `Erro ao criar treinamento: ${cursoError.message}`
        );
      }

      cursoId = curso.id;

      /* ===================================================
         5. UPLOAD IMAGEM DO CURSO
      =================================================== */

      if (imagemCurso) {
        const upload =
          await uploadImagem(
            supabase,
            imagemCurso,
            "cursos"
          );

        arquivosEnviados.push(
          upload.path
        );

        const {
          error:
            cursoImagemError,
        } = await supabase
          .from(
            "treinamentos_cursos"
          )
          .update({
            imagem_url:
              upload.url,
          })
          .eq("id", cursoId);

        if (
          cursoImagemError
        ) {
          throw new Error(
            `Erro ao salvar imagem do treinamento: ${cursoImagemError.message}`
          );
        }
      }

      /* ===================================================
         6. CRIAR PROFESSOR
      =================================================== */

      const {
        data: professor,
        error: professorError,
      } = await supabase
        .from(
          "treinamentos_professores"
        )
        .insert({
          nome:
            professorNome.trim(),

          descricao:
            professorDescricao.trim() ||
            null,

          foto_url: null,

          cargo:
            professorCargo.trim() ||
            null,

          linkedin_url: null,

          ativo: true,
        })
        .select("id")
        .single();

      if (professorError) {
        throw new Error(
          `Erro ao cadastrar professor: ${professorError.message}`
        );
      }

      professorId =
        professor.id;

      /* ===================================================
         7. FOTO DO PROFESSOR
      =================================================== */

      if (professorFoto) {
        const upload =
          await uploadImagem(
            supabase,
            professorFoto,
            "professores"
          );

        arquivosEnviados.push(
          upload.path
        );

        const {
          error:
            professorFotoError,
        } = await supabase
          .from(
            "treinamentos_professores"
          )
          .update({
            foto_url:
              upload.url,
          })
          .eq(
            "id",
            professorId
          );

        if (
          professorFotoError
        ) {
          throw new Error(
            `Erro ao salvar foto do professor: ${professorFotoError.message}`
          );
        }
      }

      /* ===================================================
         8. RELAÇÃO CURSO x PROFESSOR
      =================================================== */

      const {
        error:
          cursoProfessorError,
      } = await supabase
        .from(
          "treinamentos_curso_professores"
        )
        .insert({
          curso_id:
            cursoId,

          professor_id:
            professorId,

          papel:
            "Professor",

          ordem: 0,
        });

      if (
        cursoProfessorError
      ) {
        throw new Error(
          `Erro ao associar professor ao treinamento: ${cursoProfessorError.message}`
        );
      }

      /* ===================================================
         9. MÓDULOS
      =================================================== */

      const modulosValidos =
        modulos
          .filter(
            (modulo) =>
              modulo.titulo.trim()
          )
          .map(
            (modulo, index) => ({
              curso_id:
                cursoId,

              titulo:
                modulo.titulo.trim(),

              descricao:
                modulo.descricao.trim() ||
                null,

              ordem:
                index + 1,

              ativo: true,
            })
          );

      if (
        modulosValidos.length >
        0
      ) {
        const {
          error:
            modulosError,
        } = await supabase
          .from(
            "treinamentos_modulos"
          )
          .insert(
            modulosValidos
          );

        if (modulosError) {
          throw new Error(
            `Erro ao salvar módulos: ${modulosError.message}`
          );
        }
      }

      /* ===================================================
         10. BENEFÍCIOS
      =================================================== */

      const beneficiosValidos =
        beneficios
          .filter(
            (beneficio) =>
              beneficio.titulo.trim()
          )
          .map(
            (
              beneficio,
              index
            ) => ({
              curso_id:
                cursoId,

              titulo:
                beneficio.titulo.trim(),

              descricao:
                beneficio.descricao.trim() ||
                null,

              icone:
                beneficio.icone,

              ordem:
                index + 1,

              ativo: true,
            })
          );

      if (
        beneficiosValidos.length >
        0
      ) {
        const {
          error:
            beneficiosError,
        } = await supabase
          .from(
            "treinamentos_beneficios"
          )
          .insert(
            beneficiosValidos
          );

        if (
          beneficiosError
        ) {
          throw new Error(
            `Erro ao salvar benefícios: ${beneficiosError.message}`
          );
        }
      }

      /* ===================================================
         11. CERTIFICADO
      =================================================== */

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
            certificadoTitulo.trim() ||
            "Certificado de conclusão",

          descricao:
            certificadoDescricao.trim() ||
            null,

          imagem_url: null,

          ativo: true,

          ordem: 1,
        });

      if (
        certificadoError
      ) {
        throw new Error(
          `Erro ao salvar certificado: ${certificadoError.message}`
        );
      }

      /* ===================================================
         12. SUCESSO
      =================================================== */

      setSucesso(
        statusParaSalvar ===
          "rascunho"
          ? "Treinamento salvo como rascunho com sucesso."
          : statusParaSalvar ===
              "publicado"
            ? "Treinamento publicado com sucesso."
            : "Treinamento salvo com sucesso."
      );

      setStatus(
        statusParaSalvar
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      /*
       * Por enquanto voltamos para o dashboard,
       * pois ainda vamos criar a listagem:
       *
       * /admin/treinamentos
       */

setTimeout(() => {
  router.push("/admin/treinamentos");
  router.refresh();
}, 1200);
    } catch (error) {
      console.error(
        "Erro ao salvar treinamento:",
        error
      );

      /* ===================================================
         ROLLBACK
      =================================================== */

      /*
       * Como estamos fazendo vários inserts pelo navegador,
       * não temos uma transação PostgreSQL única.
       *
       * Se ocorrer erro, tentamos apagar o que já foi criado.
       */

      if (cursoId) {
        await supabase
          .from(
            "treinamentos_cursos"
          )
          .delete()
          .eq("id", cursoId);
      }

      if (professorId) {
        await supabase
          .from(
            "treinamentos_professores"
          )
          .delete()
          .eq(
            "id",
            professorId
          );
      }

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

      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro inesperado ao salvar o treinamento.";

      setErro(mensagem);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSalvando(false);
    }
  }

  /* =======================================================
     SUBMIT
  ======================================================= */

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    void salvarTreinamento(
      status
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div className="flex items-start gap-4">
            <Link
              href="/admin"
              className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 hover:text-zinc-950"
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
                  Novo
                </p>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-zinc-950 lg:text-3xl">
                Novo treinamento
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                Cadastre todas as
                informações do
                treinamento.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              type="button"
              disabled={salvando}
              onClick={() =>
                void salvarTreinamento(
                  "rascunho"
                )
              }
            >
              {salvando ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              Salvar rascunho
            </Button>

            <Button
              type="submit"
              disabled={salvando}
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
                  <Save size={17} />

                  Salvar treinamento
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
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="text-sm font-semibold text-red-800">
                Não foi possível
                salvar o treinamento
              </p>

              <p className="mt-1 text-sm text-red-700">
                {erro}
              </p>
            </div>
          </div>
        )}

        {sucesso && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Tudo certo!
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                {sucesso}
              </p>
            </div>
          </div>
        )}

        <Separator />

        {/* =================================================
            LAYOUT
        ================================================= */}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
          {/* ===============================================
              COLUNA PRINCIPAL
          =============================================== */}

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
                      Informações
                      principais
                    </CardTitle>

                    <CardDescription className="mt-1">
                      Informações que
                      identificam e
                      apresentam o
                      treinamento.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="titulo">
                    Título do
                    treinamento

                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </Label>

                  <Input
                    id="titulo"
                    value={titulo}
                    onChange={(event) =>
                      setTitulo(
                        event.target
                          .value
                      )
                    }
                    placeholder="Ex.: Strategic Sourcing"
                    disabled={salvando}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Categoria

                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </Label>

                  <Select
                    value={categoriaId}
                    disabled={
                      salvando ||
                      carregandoCategorias
                    }
                    onValueChange={(value) =>
                      setCategoriaId(
                        value ?? ""
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          carregandoCategorias
                            ? "Carregando categorias..."
                            : "Selecione uma categoria"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {categorias.map(
                        (categoria) => (
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
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>

                  {!carregandoCategorias &&
                    categorias.length ===
                      0 && (
                      <p className="text-xs text-amber-600">
                        Nenhuma categoria ativa cadastrada.
                      </p>
                    )}

                  <p className="text-xs text-zinc-500">
                    A categoria será utilizada para organizar e filtrar o treinamento no site.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">
                    Descrição
                  </Label>

                  <Textarea
                    id="descricao"
                    value={descricao}
                    onChange={(event) =>
                      setDescricao(
                        event.target
                          .value
                      )
                    }
                    placeholder="Apresente o treinamento e explique do que ele trata..."
                    className="min-h-[150px] resize-y"
                    disabled={salvando}
                  />

                  <p className="text-xs text-zinc-500">
                    Esse texto será
                    utilizado na
                    apresentação
                    principal do
                    treinamento.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publico-alvo">
                    Público-alvo
                  </Label>

                  <Textarea
                    id="publico-alvo"
                    value={
                      publicoAlvo
                    }
                    onChange={(event) =>
                      setPublicoAlvo(
                        event.target
                          .value
                      )
                    }
                    placeholder="Ex.: Compradores, analistas, gestores de suprimentos..."
                    className="min-h-[120px] resize-y"
                    disabled={salvando}
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
                      Por que aprender
                      sobre este
                      treinamento?
                    </CardTitle>

                    <CardDescription className="mt-1">
                      Explique a
                      importância e
                      como o conteúdo
                      pode ajudar o
                      aluno
                      profissionalmente.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Textarea
                  value={
                    porqueAprender
                  }
                  onChange={(event) =>
                    setPorqueAprender(
                      event.target
                        .value
                    )
                  }
                  placeholder="Explique por que este conhecimento é importante..."
                  className="min-h-[170px] resize-y"
                  disabled={salvando}
                />
              </CardContent>
            </Card>

            {/* =============================================
                MÓDULOS
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
                        Conteúdo do
                        curso
                      </CardTitle>

                      <CardDescription className="mt-1">
                        Organize o
                        conteúdo do
                        treinamento em
                        módulos.
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      adicionarModulo
                    }
                    disabled={salvando}
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

                            <p className="text-xs text-zinc-500">
                              Defina o
                              título e
                              o conteúdo
                              deste
                              módulo.
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
                            size={
                              17
                            }
                          />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>
                            Título do
                            módulo
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
                            placeholder={
                              index ===
                              0
                                ? "Ex.: Fundamentos e introdução"
                                : "Ex.: Conteúdo do módulo"
                            }
                            disabled={
                              salvando
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Descrição /
                            conteúdo
                          </Label>

                          <Textarea
                            value={
                              modulo.descricao
                            }
                            onChange={(
                              event
                            ) =>
                              atualizarModulo(
                                modulo.id,
                                "descricao",
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="Descreva os assuntos abordados neste módulo..."
                            className="min-h-[110px]"
                            disabled={
                              salvando
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
                  onClick={
                    adicionarModulo
                  }
                  disabled={salvando}
                  className="w-full border-dashed"
                >
                  <Plus size={16} />

                  Adicionar outro
                  módulo
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
                        Benefícios do
                        curso
                      </CardTitle>

                      <CardDescription className="mt-1">
                        Mostre ao aluno
                        os benefícios
                        que ele terá ao
                        realizar o
                        treinamento.
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      adicionarBeneficio
                    }
                    disabled={salvando}
                  >
                    <Plus
                      size={16}
                    />

                    Adicionar
                    benefício
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
                      ] || Award;

                    return (
                      <div
                        key={
                          beneficio.id
                        }
                        className="rounded-xl border border-zinc-200 p-5"
                      >
                        <div className="mb-5 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                              <Icon
                                size={
                                  21
                                }
                              />
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-zinc-900">
                                Benefício{" "}
                                {index +
                                  1}
                              </p>

                              <p className="text-xs text-zinc-500">
                                Será
                                exibido
                                em
                                destaque
                                na
                                página
                                do
                                treinamento.
                              </p>
                            </div>
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
                              onValueChange={(value) => {
                                if (!value) {
                                  return;
                                }

                                atualizarBeneficio(
                                  beneficio.id,
                                  "icone",
                                  value
                                );
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>

                              <SelectContent>
                                <SelectItem value="BriefcaseBusiness">
                                  Atualização
                                  profissional
                                </SelectItem>

                                <SelectItem value="TrendingUp">
                                  Crescimento
                                  profissional
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

                          <div className="space-y-2 md:col-span-2">
                            <Label>
                              Descrição
                            </Label>

                            <Textarea
                              value={
                                beneficio.descricao
                              }
                              onChange={(
                                event
                              ) =>
                                atualizarBeneficio(
                                  beneficio.id,
                                  "descricao",
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder="Explique esse benefício..."
                              className="min-h-[90px]"
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
                  disabled={salvando}
                  className="w-full border-dashed"
                >
                  <Plus size={16} />

                  Adicionar outro
                  benefício
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

                    <CardDescription className="mt-1">
                      Informações sobre
                      o profissional
                      responsável pelo
                      treinamento.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
                  {/* FOTO */}

                  <div>
                    <Label>
                      Foto do
                      professor
                    </Label>

                    <label className="mt-2 flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition hover:border-emerald-400 hover:bg-emerald-50/40">
                      {professorFotoPreview ? (
                        <img
                          src={
                            professorFotoPreview
                          }
                          alt="Professor"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <>
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                            <Upload
                              size={
                                19
                              }
                              className="text-zinc-500"
                            />
                          </div>

                          <span className="mt-3 text-xs font-medium text-zinc-600">
                            Enviar
                            foto
                          </span>
                        </>
                      )}

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={
                          handleProfessorFoto
                        }
                        disabled={
                          salvando
                        }
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* DADOS */}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        Nome

                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </Label>

                      <Input
                        value={
                          professorNome
                        }
                        onChange={(
                          event
                        ) =>
                          setProfessorNome(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Nome completo do professor"
                        disabled={
                          salvando
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Cargo /
                        especialidade
                      </Label>

                      <Input
                        value={
                          professorCargo
                        }
                        onChange={(
                          event
                        ) =>
                          setProfessorCargo(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Ex.: Especialista em Strategic Sourcing"
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
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Apresente a experiência e especialidades do professor..."
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
                CERTIFICADO
            ============================================= */}

            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Award
                      size={20}
                    />
                  </div>

                  <div>
                    <CardTitle>
                      Certificado
                    </CardTitle>

                    <CardDescription className="mt-1">
                      Informe o
                      certificado
                      oferecido ao
                      aluno.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Título
                  </Label>

                  <Input
                    value={
                      certificadoTitulo
                    }
                    onChange={(
                      event
                    ) =>
                      setCertificadoTitulo(
                        event.target
                          .value
                      )
                    }
                    placeholder="Certificado de conclusão"
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
                      certificadoDescricao
                    }
                    onChange={(
                      event
                    ) =>
                      setCertificadoDescricao(
                        event.target
                          .value
                      )
                    }
                    placeholder="Explique como funciona o certificado..."
                    className="min-h-[110px]"
                    disabled={
                      salvando
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ===============================================
              COLUNA LATERAL
          =============================================== */}

          <div className="space-y-6 xl:sticky xl:top-[92px]">
            {/* =============================================
                PUBLICAÇÃO
            ============================================= */}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Publicação
                </CardTitle>

                <CardDescription>
                  Defina o status
                  deste treinamento.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>
                    Status
                  </Label>

                  <Select
                    value={status}
                    disabled={salvando}
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

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">
                      Módulos
                    </span>

                    <Badge variant="secondary">
                      {
                        modulos.filter(
                          (
                            modulo
                          ) =>
                            modulo.titulo.trim()
                        ).length
                      }
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">
                      Benefícios
                    </span>

                    <Badge variant="secondary">
                      {
                        beneficios.filter(
                          (
                            beneficio
                          ) =>
                            beneficio.titulo.trim()
                        ).length
                      }
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
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
                </div>

                <Button
                  type="submit"
                  disabled={salvando}
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

                      Salvar
                      treinamento
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* =============================================
                IMAGEM DO CURSO
            ============================================= */}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ImageIcon
                    size={18}
                    className="text-emerald-600"
                  />

                  <CardTitle className="text-base">
                    Imagem do
                    treinamento
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent>
                <label className="flex aspect-[16/10] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition hover:border-emerald-400 hover:bg-emerald-50/30">
                  {imagemCursoPreview ? (
                    <img
                      src={
                        imagemCursoPreview
                      }
                      alt="Treinamento"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="px-5 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                        <Upload
                          size={19}
                          className="text-zinc-500"
                        />
                      </div>

                      <p className="mt-3 text-sm font-medium text-zinc-700">
                        Enviar imagem
                      </p>

                      <p className="mt-1 text-xs text-zinc-400">
                        JPG, PNG ou
                        WEBP
                      </p>

                      <p className="mt-1 text-[11px] text-zinc-400">
                        Máximo 5 MB
                      </p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={
                      handleImagemCurso
                    }
                    disabled={
                      salvando
                    }
                    className="hidden"
                  />
                </label>

                {imagemCurso && (
                  <p className="mt-2 truncate text-xs text-zinc-500">
                    {
                      imagemCurso.name
                    }
                  </p>
                )}
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
                    Vídeo
                    introdutório
                  </CardTitle>
                </div>

                <CardDescription>
                  YouTube, Vimeo ou
                  outro endereço de
                  vídeo.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  <Label>
                    URL do vídeo
                  </Label>

                  <Input
                    type="url"
                    value={videoUrl}
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