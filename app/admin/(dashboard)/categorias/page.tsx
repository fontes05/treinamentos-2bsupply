"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  Upload,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Categoria = {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
  icone_svg_url: string | null;
  ativo: boolean;
  created_at: string;
};

export default function CategoriasPage() {
  const supabase = createClient();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  const [iconeSvg, setIconeSvg] = useState<File | null>(null);
  const [iconeSvgPreview, setIconeSvgPreview] = useState("");
  const [iconeSvgAtualUrl, setIconeSvgAtualUrl] = useState("");
  const [iconeSvgOriginalUrl, setIconeSvgOriginalUrl] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);

  // =====================================================
  // GERAR SLUG
  // =====================================================

  function gerarSlug(texto: string) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // =====================================================
  // SVG
  // =====================================================

  async function validarSvg(file: File) {
    const nomeArquivo = file.name.toLowerCase();

    if (!nomeArquivo.endsWith(".svg")) {
      throw new Error("Envie um arquivo no formato SVG.");
    }

    if (file.type && file.type !== "image/svg+xml") {
      throw new Error("O arquivo selecionado não é um SVG válido.");
    }

    const limite = 1024 * 1024;

    if (file.size > limite) {
      throw new Error("O SVG deve ter no máximo 1 MB.");
    }

    const conteudo = await file.text();

    if (!/<svg[\s>]/i.test(conteudo)) {
      throw new Error("O arquivo selecionado não contém um SVG válido.");
    }

    if (
      /<script[\s>]/i.test(conteudo) ||
      /\bon\w+\s*=/i.test(conteudo) ||
      /javascript\s*:/i.test(conteudo)
    ) {
      throw new Error(
        "Por segurança, o SVG não pode conter scripts ou eventos JavaScript."
      );
    }
  }

  function extrairStoragePath(publicUrl: string | null) {
    if (!publicUrl) {
      return null;
    }

    const marker =
      "/storage/v1/object/public/treinamentos-media/";

    const index = publicUrl.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(
      publicUrl.substring(index + marker.length)
    );
  }

  async function uploadSvg(file: File) {
    await validarSvg(file);

    const path = `categorias/${crypto.randomUUID()}.svg`;

    const { error } = await supabase.storage
      .from("treinamentos-media")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/svg+xml",
      });

    if (error) {
      throw new Error(`Erro ao enviar SVG: ${error.message}`);
    }

    const { data } = supabase.storage
      .from("treinamentos-media")
      .getPublicUrl(path);

    return {
      path,
      url: data.publicUrl,
    };
  }

  async function handleSvgChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      await validarSvg(file);

      if (iconeSvgPreview) {
        URL.revokeObjectURL(iconeSvgPreview);
      }

      setIconeSvg(file);
      setIconeSvgPreview(URL.createObjectURL(file));

      event.target.value = "";
    } catch (error) {
      event.target.value = "";

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o SVG."
      );
    }
  }

  function removerSvgSelecionado() {
    if (iconeSvgPreview) {
      URL.revokeObjectURL(iconeSvgPreview);
    }

    setIconeSvg(null);
    setIconeSvgPreview("");
    setIconeSvgAtualUrl("");
  }

  // =====================================================
  // CARREGAR CATEGORIAS
  // =====================================================

async function carregarCategorias() {
  setLoading(true);

  try {
    const { data, error } = await supabase
      .from("treinamentos_categorias")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      console.error("ERRO SUPABASE:");
      console.error("message:", error.message);
      console.error("details:", error.details);
      console.error("hint:", error.hint);
      console.error("code:", error.code);

      alert(
        `Não foi possível carregar as categorias.\n\n${error.message}`
      );

      setCategorias([]);
      return;
    }

    console.log("Categorias carregadas:", data);

    setCategorias(data ?? []);
  } catch (err) {
    console.error("Erro inesperado:", err);

    alert("Ocorreu um erro inesperado ao carregar as categorias.");
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    carregarCategorias();
  }, []);

  // =====================================================
  // SALVAR / EDITAR
  // =====================================================

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!nome.trim()) {
      alert("Digite o nome da categoria.");
      return;
    }

    setSalvando(true);

    const slug = gerarSlug(nome);

    let novoSvgPath: string | null = null;

    try {
      let svgFinalUrl = iconeSvgAtualUrl || null;

      if (iconeSvg) {
        const upload = await uploadSvg(iconeSvg);

        novoSvgPath = upload.path;
        svgFinalUrl = upload.url;
      }

      const dadosCategoria = {
        nome: nome.trim(),
        slug,
        descricao: descricao.trim() || null,
        icone_svg_url: svgFinalUrl,
      };

      const { error } = editandoId
        ? await supabase
            .from("treinamentos_categorias")
            .update(dadosCategoria)
            .eq("id", editandoId)
        : await supabase
            .from("treinamentos_categorias")
            .insert({
              ...dadosCategoria,
              ativo: true,
            });

      if (error) {
        if (novoSvgPath) {
          await supabase.storage
            .from("treinamentos-media")
            .remove([novoSvgPath]);
        }

        console.error(error);

        if (error.code === "23505") {
          alert("Já existe uma categoria com esse nome.");
        } else {
          alert(`Erro ao salvar categoria: ${error.message}`);
        }

        return;
      }

      /*
       * Se o ícone antigo foi substituído ou removido,
       * apagamos o arquivo anterior do Storage.
       */
      if (
        iconeSvgOriginalUrl &&
        svgFinalUrl !== iconeSvgOriginalUrl
      ) {
        const oldPath = extrairStoragePath(iconeSvgOriginalUrl);

        if (oldPath) {
          const { error: removeError } = await supabase.storage
            .from("treinamentos-media")
            .remove([oldPath]);

          if (removeError) {
            console.warn(
              "Não foi possível apagar o SVG antigo:",
              removeError
            );
          }
        }
      }

      limparFormulario();
      await carregarCategorias();
    } catch (error) {
      if (novoSvgPath) {
        await supabase.storage
          .from("treinamentos-media")
          .remove([novoSvgPath]);
      }

      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro inesperado ao salvar a categoria."
      );
    } finally {
      setSalvando(false);
    }
  }

  // =====================================================
  // EDITAR
  // =====================================================

  function editarCategoria(categoria: Categoria) {
    if (iconeSvgPreview) {
      URL.revokeObjectURL(iconeSvgPreview);
    }

    setEditandoId(categoria.id);
    setNome(categoria.nome);
    setDescricao(categoria.descricao || "");

    setIconeSvg(null);
    setIconeSvgPreview("");
    setIconeSvgAtualUrl(categoria.icone_svg_url || "");
    setIconeSvgOriginalUrl(categoria.icone_svg_url || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =====================================================
  // CANCELAR EDIÇÃO
  // =====================================================

  function limparFormulario() {
    if (iconeSvgPreview) {
      URL.revokeObjectURL(iconeSvgPreview);
    }

    setEditandoId(null);
    setNome("");
    setDescricao("");

    setIconeSvg(null);
    setIconeSvgPreview("");
    setIconeSvgAtualUrl("");
    setIconeSvgOriginalUrl("");
  }

  // =====================================================
  // ATIVAR / DESATIVAR
  // =====================================================

  async function alterarStatus(categoria: Categoria) {
    const { error } = await supabase
      .from("treinamentos_categorias")
      .update({
        ativo: !categoria.ativo,
      })
      .eq("id", categoria.id);

    if (error) {
      console.error(error);
      alert("Erro ao alterar status.");
      return;
    }

    carregarCategorias();
  }

  // =====================================================
  // EXCLUIR
  // =====================================================

  async function excluirCategoria(categoria: Categoria) {
    const confirmar = window.confirm(
      `Deseja realmente excluir a categoria "${categoria.nome}"?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("treinamentos_categorias")
      .delete()
      .eq("id", categoria.id);

    if (error) {
      console.error(error);

      if (error.code === "23503") {
        alert(
          "Essa categoria está vinculada a um ou mais cursos e não pode ser excluída."
        );
      } else {
        alert("Não foi possível excluir a categoria.");
      }

      return;
    }

    if (categoria.icone_svg_url) {
      const path = extrairStoragePath(categoria.icone_svg_url);

      if (path) {
        const { error: removeError } = await supabase.storage
          .from("treinamentos-media")
          .remove([path]);

        if (removeError) {
          console.warn(
            "Não foi possível apagar o SVG da categoria:",
            removeError
          );
        }
      }
    }

    void carregarCategorias();
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            CABEÇALHO
        ====================================================== */}

        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#3bb3ed] via-[#667cf8] to-[#9961e9] text-white shadow-sm">
              <FolderOpen size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Categorias
              </h1>

              <p className="text-sm text-slate-500">
                Crie e organize as categorias dos treinamentos.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* =====================================================
              FORMULÁRIO
          ====================================================== */}

          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                {editandoId ? "Editar categoria" : "Nova categoria"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editandoId
                  ? "Atualize as informações da categoria."
                  : "Adicione uma nova categoria para organizar seus cursos."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nome da categoria
                </label>

                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Inteligência Artificial"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#667cf8] focus:ring-4 focus:ring-[#667cf8]/10"
                />

                {nome && (
                  <p className="mt-2 text-xs text-slate-400">
                    Slug: {gerarSlug(nome)}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ícone da categoria
                </label>

                <label className="flex min-h-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-5 transition hover:border-[#667cf8]/50 hover:bg-[#667cf8]/5">
                  {iconeSvgPreview || iconeSvgAtualUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white p-3 shadow-sm">
                        <img
                          src={iconeSvgPreview || iconeSvgAtualUrl}
                          alt="Prévia do ícone da categoria"
                          className="h-full w-full object-contain"
                        />
                      </div>

                      <span className="text-xs font-medium text-slate-500">
                        Clique para substituir o SVG
                      </span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload
                        size={24}
                        className="mx-auto text-[#667cf8]"
                      />

                      <p className="mt-2 text-sm font-medium text-slate-700">
                        Enviar ícone SVG
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Somente .svg · máximo 1 MB
                      </p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept=".svg,image/svg+xml"
                    className="hidden"
                    disabled={salvando}
                    onChange={handleSvgChange}
                  />
                </label>

                {(iconeSvgPreview || iconeSvgAtualUrl) && (
                  <button
                    type="button"
                    onClick={removerSvgSelecionado}
                    disabled={salvando}
                    className="mt-2 text-xs font-medium text-red-500 transition hover:text-red-600 disabled:opacity-50"
                  >
                    Remover ícone
                  </button>
                )}

                <p className="mt-2 text-xs text-slate-400">
                  O SVG será utilizado como ícone visual desta categoria no site.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Descrição
                </label>

                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Breve descrição da categoria..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#667cf8] focus:ring-4 focus:ring-[#667cf8]/10"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3bb3ed] via-[#667cf8] to-[#9961e9] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Salvando...
                    </>
                  ) : editandoId ? (
                    <>
                      <Check size={17} />
                      Salvar alterações
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Criar categoria
                    </>
                  )}
                </button>

                {editandoId && (
                  <button
                    type="button"
                    onClick={limparFormulario}
                    className="flex items-center justify-center rounded-xl border border-slate-200 px-4 text-slate-500 transition hover:bg-slate-50"
                    title="Cancelar edição"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* =====================================================
              LISTAGEM
          ====================================================== */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Categorias cadastradas
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {categorias.length}{" "}
                  {categorias.length === 1 ? "categoria" : "categorias"}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Loader2
                  size={28}
                  className="animate-spin text-[#667cf8]"
                />
              </div>
            ) : categorias.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <FolderOpen size={25} className="text-slate-400" />
                </div>

                <h3 className="font-semibold text-slate-800">
                  Nenhuma categoria cadastrada
                </h3>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Crie a primeira categoria para começar a organizar seus
                  treinamentos.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {categorias.map((categoria) => (
                  <div
                    key={categoria.id}
                    className="flex items-center gap-4 px-6 py-5 transition hover:bg-slate-50/70"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#667cf8]/10 p-2.5">
                      {categoria.icone_svg_url ? (
                        <img
                          src={categoria.icone_svg_url}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <FolderOpen size={20} className="text-[#667cf8]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-800">
                          {categoria.nome}
                        </h3>

                        <button
                          type="button"
                          onClick={() => alterarStatus(categoria)}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            categoria.ativo
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {categoria.ativo ? "Ativa" : "Inativa"}
                        </button>
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        /{categoria.slug}
                      </p>

                      {categoria.descricao && (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                          {categoria.descricao}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editarCategoria(categoria)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-[#667cf8]/30 hover:bg-[#667cf8]/5 hover:text-[#667cf8]"
                        title="Editar categoria"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => excluirCategoria(categoria)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                        title="Excluir categoria"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}