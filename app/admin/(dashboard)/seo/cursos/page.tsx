"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ExternalLink, LoaderCircle, Save, Search } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SITE_URL = "https://absuprimentos.com.br";

type Curso = {
  id: string;
  titulo: string;
  slug: string;
  descricao: string | null;
  status: string | null;
  seo_titulo: string | null;
  seo_descricao: string | null;
  seo_palavra_chave: string | null;
};

type CamposSeo = {
  titulo: string;
  descricao: string;
  palavraChave: string;
};

const camposVazios: CamposSeo = {
  titulo: "",
  descricao: "",
  palavraChave: "",
};

function limparTexto(valor: string | null | undefined) {
  return (valor || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function limitarTexto(valor: string, limite: number) {
  return valor.length <= limite
    ? valor
    : `${valor.slice(0, limite - 1).trim()}…`;
}

function camposDoCurso(curso: Curso): CamposSeo {
  return {
    titulo: curso.seo_titulo || "",
    descricao: curso.seo_descricao || "",
    palavraChave: curso.seo_palavra_chave || "",
  };
}

export default function SeoCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoId, setCursoId] = useState("");
  const [busca, setBusca] = useState("");
  const [campos, setCampos] = useState<CamposSeo>(camposVazios);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const supabase = createClient();
        const registros: Curso[] = [];
        const tamanhoPagina = 1000;

        // Carrega também os cursos que ultrapassarem o limite da API.
        for (let inicio = 0; ; inicio += tamanhoPagina) {
          const { data, error } = await supabase
            .from("treinamentos_cursos")
            .select(`
              id,
              titulo,
              slug,
              descricao,
              status,
              seo_titulo,
              seo_descricao,
              seo_palavra_chave
            `)
            .order("titulo", { ascending: true })
            .order("id", { ascending: true })
            .range(inicio, inicio + tamanhoPagina - 1);

          if (error) {
            throw new Error(error.message);
          }

          if (!ativo) return;

          const pagina = (data || []) as Curso[];
          registros.push(...pagina);

          if (pagina.length < tamanhoPagina) break;
        }

        if (ativo) setCursos(registros);
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os cursos."
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, []);

  const curso = cursos.find((item) => item.id === cursoId);

  const cursosFiltrados = cursos.filter((item) =>
    `${item.titulo} ${item.slug}`
      .toLocaleLowerCase("pt-BR")
      .includes(busca.trim().toLocaleLowerCase("pt-BR"))
  );

  const camposSalvos = curso ? camposDoCurso(curso) : camposVazios;

  const alterado =
    campos.titulo !== camposSalvos.titulo ||
    campos.descricao !== camposSalvos.descricao ||
    campos.palavraChave !== camposSalvos.palavraChave;

  const urlCurso = curso
    ? `${SITE_URL}/cursos/${encodeURIComponent(curso.slug)}`
    : SITE_URL;

  const tituloPreview =
    limparTexto(campos.titulo) || limparTexto(curso?.titulo);

  const descricaoPreview = limitarTexto(
    limparTexto(campos.descricao) ||
      limparTexto(curso?.descricao) ||
      `Conheça o treinamento ${curso?.titulo || ""} da Academia Brasileira de Suprimentos.`,
    160
  );

  function selecionarCurso(item: Curso) {
    if (item.id === cursoId) return;

    if (
      alterado &&
      !window.confirm(
        "Há alterações não salvas. Deseja trocar de curso e descartá-las?"
      )
    ) {
      return;
    }

    setCursoId(item.id);
    setCampos(camposDoCurso(item));
    setErro("");
    setSucesso("");
  }

  function editarCampo(chave: keyof CamposSeo, valor: string) {
    setCampos((atual) => ({ ...atual, [chave]: valor }));
    setSucesso("");
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!curso || salvando || !alterado) return;

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      const supabase = createClient();

      const valores = {
        seo_titulo: campos.titulo.trim() || null,
        seo_descricao: campos.descricao.trim() || null,
        seo_palavra_chave: campos.palavraChave.trim() || null,
      };

      const { data, error } = await supabase
        .from("treinamentos_cursos")
        .update(valores)
        .eq("id", curso.id)
        .select("id, seo_titulo, seo_descricao, seo_palavra_chave")
        .single();

      if (error) {
        throw new Error(`Não foi possível salvar: ${error.message}`);
      }

      if (!data) {
        throw new Error(
          "O curso não foi atualizado. Verifique as permissões da sua conta."
        );
      }

      const atualizado: Curso = {
        ...curso,
        seo_titulo: data.seo_titulo,
        seo_descricao: data.seo_descricao,
        seo_palavra_chave: data.seo_palavra_chave,
      };

      setCursos((atuais) =>
        atuais.map((item) =>
          item.id === atualizado.id ? atualizado : item
        )
      );

      setCampos(camposDoCurso(atualizado));
      setSucesso("SEO do curso salvo com sucesso.");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o SEO."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Search size={24} />
        </div>

        <div>
          <h1 className="text-2xl font-semibold !text-zinc-900">
            SEO dos cursos
          </h1>
          <p className="mt-1 text-sm !text-zinc-500">
            Configure os títulos e descrições dos treinamentos.
          </p>
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm !text-red-700"
        >
          {erro}
        </div>
      )}

      {sucesso && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm !text-emerald-700"
        >
          {sucesso}
        </div>
      )}

      {carregando ? (
        <div className="flex items-center gap-3 py-12 text-zinc-500">
          <LoaderCircle className="animate-spin" size={22} />
          Carregando cursos…
        </div>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Treinamentos</CardTitle>
              <CardDescription>
                Selecione o curso que deseja editar.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Label htmlFor="busca-cursos">Buscar curso</Label>
              <Input
                id="busca-cursos"
                placeholder="Nome ou URL do curso"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                disabled={salvando}
              />

              <div className="max-h-[600px] space-y-2 overflow-y-auto">
                {cursosFiltrados.map((item) => {
                  const completo = Boolean(
                    item.seo_titulo?.trim() &&
                    item.seo_descricao?.trim()
                  );

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={salvando}
                      aria-pressed={item.id === cursoId}
                      onClick={() => selecionarCurso(item)}
                      className={`
                        w-full rounded-xl border p-3 text-left transition
                        disabled:opacity-60
                        ${
                          item.id === cursoId
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-zinc-200 bg-white hover:bg-zinc-50"
                        }
                      `}
                    >
                      <span className="block text-sm font-semibold !text-zinc-800">
                        {item.titulo}
                      </span>

                      <span className="mt-1 block break-all text-xs !text-zinc-500">
                        /cursos/{item.slug}
                      </span>

                      <span className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] !text-zinc-600">
                          {item.status || "Sem status"}
                        </span>

                        <span
                          className={`rounded-md px-2 py-1 text-[11px] ${
                            completo
                              ? "bg-emerald-100 !text-emerald-700"
                              : "bg-amber-100 !text-amber-800"
                          }`}
                        >
                          {completo
                            ? "Título e descrição preenchidos"
                            : "SEO a preencher"}
                        </span>
                      </span>
                    </button>
                  );
                })}

                {cursosFiltrados.length === 0 && (
                  <p className="py-6 text-sm !text-zinc-500">
                    Nenhum curso encontrado.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {!curso ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Search
                  size={32}
                  className="mx-auto mb-4 text-emerald-600"
                />
                <p className="font-semibold !text-zinc-800">
                  Selecione um treinamento
                </p>
                <p className="mt-2 text-sm !text-zinc-500">
                  Os campos de SEO aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={salvar} className="min-w-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {curso.titulo}
                  </CardTitle>

                  <CardDescription>
                    Deixe um campo vazio para usar o conteúdo padrão do curso.
                  </CardDescription>

                  <div className="flex flex-wrap gap-4 pt-3 text-sm">
                    <Link
                      href={`/admin/treinamentos/${encodeURIComponent(curso.id)}/editar`}
                      className="!text-emerald-700 hover:underline"
                    >
                      Editar treinamento completo
                    </Link>

                    {curso.status === "publicado" && (
                      <a
                        href={urlCurso}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 !text-emerald-700 hover:underline"
                      >
                        Ver página pública
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <fieldset disabled={salvando} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="seo-titulo">Título SEO</Label>
                      <Input
                        id="seo-titulo"
                        value={campos.titulo}
                        onChange={(event) =>
                          editarCampo("titulo", event.target.value)
                        }
                        placeholder={curso.titulo}
                      />
                      <p className="text-xs !text-zinc-500">
                        {campos.titulo.length} caracteres. Referência de
                        edição: aproximadamente 50 a 60 caracteres.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seo-descricao">
                        Descrição SEO
                      </Label>
                      <Textarea
                        id="seo-descricao"
                        value={campos.descricao}
                        onChange={(event) =>
                          editarCampo("descricao", event.target.value)
                        }
                        placeholder="Descreva o conteúdo e os benefícios do treinamento."
                        className="min-h-[130px]"
                      />
                      <p className="text-xs !text-zinc-500">
                        {campos.descricao.length} caracteres. A página
                        pública atual limita a descrição a 160 caracteres.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seo-palavra-chave">
                        Palavra-chave principal
                      </Label>
                      <Input
                        id="seo-palavra-chave"
                        value={campos.palavraChave}
                        onChange={(event) =>
                          editarCampo("palavraChave", event.target.value)
                        }
                        placeholder="Ex.: curso de gestão de almoxarifado"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t pt-5">
                      <Button
                        type="submit"
                        disabled={salvando || !alterado}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        {salvando ? (
                          <LoaderCircle
                            size={17}
                            className="mr-2 animate-spin"
                          />
                        ) : (
                          <Save size={17} className="mr-2" />
                        )}

                        {salvando ? "Salvando…" : "Salvar SEO"}
                      </Button>

                      {alterado && (
                        <span className="text-xs !text-amber-700">
                          Existem alterações não salvas.
                        </span>
                      )}
                    </div>
                  </fieldset>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Prévia da busca
                  </CardTitle>
                  <CardDescription>
                    Simulação com os valores atuais do formulário.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="rounded-xl border border-zinc-200 bg-white p-5">
                    <p className="text-sm !text-zinc-800">
                      Academia Brasileira de Suprimentos
                    </p>

                    <p className="mt-1 break-all text-xs !text-zinc-500">
                      {urlCurso}
                    </p>

                    <p className="mt-3 break-words text-xl leading-7 !text-[#1a0dab]">
                      {tituloPreview}
                    </p>

                    <p className="mt-2 break-words text-sm leading-6 !text-zinc-600">
                      {descricaoPreview}
                    </p>
                  </div>

                  {curso.status !== "publicado" && (
                    <p className="mt-4 text-xs !text-amber-700">
                      Este curso está como {curso.status || "sem status"}.
                      A página pública atual só carrega cursos publicados.
                    </p>
                  )}
                </CardContent>
              </Card>
            </form>
          )}
        </div>
      )}
    </div>
  );
}