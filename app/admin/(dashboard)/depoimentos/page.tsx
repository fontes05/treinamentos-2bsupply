"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Depoimento = {
  id: string;
  depoimento: string;
  nome: string;
  cargo: string;
  foto_url: string | null;
  estrelas: number;
  created_at: string;
};

type FormState = {
  depoimento: string;
  nome: string;
  cargo: string;
  estrelas: number;
  foto_url: string;
};

const initialForm: FormState = {
  depoimento: "",
  nome: "",
  cargo: "",
  estrelas: 5,
  foto_url: "",
};

export default function DepoimentosPage() {
  const supabase = createClient();

  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(initialForm);

  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  /* ============================================================
     CARREGAR DEPOIMENTOS
  ============================================================ */

  const carregarDepoimentos = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");

      const { data, error } = await supabase
        .from("treinamentos_depoimentos")
        .select(
          `
            id,
            depoimento,
            nome,
            cargo,
            foto_url,
            estrelas,
            created_at
          `,
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setDepoimentos((data ?? []) as Depoimento[]);
    } catch (error: any) {
      console.error(error);

      setErro(
        error?.message
          ? `Erro ao carregar depoimentos: ${error.message}`
          : "Erro ao carregar os depoimentos.",
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    carregarDepoimentos();
  }, [carregarDepoimentos]);

  /* ============================================================
     FORM
  ============================================================ */

  function limparForm() {
    setForm(initialForm);

    setFotoFile(null);
    setFotoPreview("");

    setEditingId(null);

    setErro("");
    setSucesso("");
  }

  function alterarCampo(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /* ============================================================
     FOTO
  ============================================================ */

  function selecionarFoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setErro("");

    const formatosPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!formatosPermitidos.includes(file.type)) {
      setErro(
        "A foto precisa estar no formato JPG, PNG ou WEBP.",
      );

      event.target.value = "";

      return;
    }

    const limite = 5 * 1024 * 1024;

    if (file.size > limite) {
      setErro("A foto deve ter no máximo 5 MB.");

      event.target.value = "";

      return;
    }

    setFotoFile(file);

    const preview = URL.createObjectURL(file);

    setFotoPreview(preview);
  }

  async function enviarFoto() {
    if (!fotoFile) {
      return form.foto_url || null;
    }

    const extensao =
      fotoFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const nomeArquivo = `${crypto.randomUUID()}.${extensao}`;

    const caminho = `depoimentos/${nomeArquivo}`;

    const { error: uploadError } = await supabase.storage
      .from("treinamentos-depoimentos")
      .upload(caminho, fotoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(
        `Erro ao enviar foto: ${uploadError.message}`,
      );
    }

    const { data } = supabase.storage
      .from("treinamentos-depoimentos")
      .getPublicUrl(caminho);

    return data.publicUrl;
  }

  /* ============================================================
     PEGAR CAMINHO DA FOTO NO STORAGE
  ============================================================ */

  function obterCaminhoFotoStorage(fotoUrl: string) {
    try {
      const marcador =
        "/storage/v1/object/public/treinamentos-depoimentos/";

      const indice = fotoUrl.indexOf(marcador);

      if (indice === -1) {
        return null;
      }

      return decodeURIComponent(
        fotoUrl.substring(indice + marcador.length),
      );
    } catch {
      return null;
    }
  }

  /* ============================================================
     SALVAR
  ============================================================ */

  async function salvarDepoimento(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      if (!form.nome.trim()) {
        throw new Error(
          "Informe o nome da pessoa.",
        );
      }

      if (!form.cargo.trim()) {
        throw new Error(
          "Informe o cargo da pessoa.",
        );
      }

      if (!form.depoimento.trim()) {
        throw new Error(
          "Informe o depoimento.",
        );
      }

      if (
        form.estrelas < 1 ||
        form.estrelas > 5
      ) {
        throw new Error(
          "A avaliação deve ter entre 1 e 5 estrelas.",
        );
      }

      const fotoUrl = await enviarFoto();

      const payload = {
        depoimento: form.depoimento.trim(),
        nome: form.nome.trim(),
        cargo: form.cargo.trim(),
        foto_url: fotoUrl,
        estrelas: form.estrelas,
      };

      if (editingId) {
        const { error } = await supabase
          .from("treinamentos_depoimentos")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          throw error;
        }

        setSucesso(
          "Depoimento atualizado com sucesso.",
        );
      } else {
        const { error } = await supabase
          .from("treinamentos_depoimentos")
          .insert(payload);

        if (error) {
          throw error;
        }

        setSucesso(
          "Depoimento cadastrado com sucesso.",
        );
      }

      setForm(initialForm);
      setFotoFile(null);
      setFotoPreview("");
      setEditingId(null);

      await carregarDepoimentos();
    } catch (error: any) {
      console.error(error);

      setErro(
        error?.message ||
          "Não foi possível salvar o depoimento.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* ============================================================
     EDITAR
  ============================================================ */

  function editarDepoimento(item: Depoimento) {
    setEditingId(item.id);

    setForm({
      depoimento: item.depoimento,
      nome: item.nome,
      cargo: item.cargo,
      foto_url: item.foto_url ?? "",
      estrelas: item.estrelas,
    });

    setFotoPreview(item.foto_url ?? "");
    setFotoFile(null);

    setErro("");
    setSucesso("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* ============================================================
     EXCLUIR
  ============================================================ */

  async function excluirDepoimento(item: Depoimento) {
    if (deletingId) {
      return;
    }

    const confirmou = window.confirm(
      `Deseja realmente excluir o depoimento de "${item.nome}"?\n\nEssa ação não poderá ser desfeita.`,
    );

    if (!confirmou) {
      return;
    }

    try {
      setDeletingId(item.id);
      setErro("");
      setSucesso("");

      /* --------------------------------------------------------
         1. EXCLUI O REGISTRO DO BANCO
      -------------------------------------------------------- */

      const { error: deleteError } = await supabase
        .from("treinamentos_depoimentos")
        .delete()
        .eq("id", item.id);

      if (deleteError) {
        throw deleteError;
      }

      /* --------------------------------------------------------
         2. REMOVE DA LISTA IMEDIATAMENTE
      -------------------------------------------------------- */

      setDepoimentos((prev) =>
        prev.filter(
          (depoimento) =>
            depoimento.id !== item.id,
        ),
      );

      /* --------------------------------------------------------
         3. SE ESTIVER EDITANDO ESTE ITEM, LIMPA O FORM
      -------------------------------------------------------- */

      if (editingId === item.id) {
        setForm(initialForm);
        setFotoFile(null);
        setFotoPreview("");
        setEditingId(null);
      }

      /* --------------------------------------------------------
         4. TENTA EXCLUIR A FOTO DO STORAGE
         A exclusão do depoimento NÃO falha caso a foto
         não possa ser removida.
      -------------------------------------------------------- */

      if (item.foto_url) {
        const caminhoFoto =
          obterCaminhoFotoStorage(item.foto_url);

        if (caminhoFoto) {
          const { error: storageError } =
            await supabase.storage
              .from("treinamentos-depoimentos")
              .remove([caminhoFoto]);

          if (storageError) {
            console.warn(
              "O depoimento foi excluído, mas não foi possível remover a foto do Storage:",
              storageError.message,
            );
          }
        }
      }

      setSucesso(
        `Depoimento de ${item.nome} excluído com sucesso.`,
      );
    } catch (error: any) {
      console.error(
        "Erro ao excluir depoimento:",
        error,
      );

      setErro(
        error?.message
          ? `Não foi possível excluir o depoimento: ${error.message}`
          : "Não foi possível excluir o depoimento.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* ============================================================
     INICIAIS
  ============================================================ */

  function iniciais(nome: string) {
    const partes = nome
      .trim()
      .split(" ")
      .filter(Boolean);

    if (!partes.length) {
      return "?";
    }

    if (partes.length === 1) {
      return partes[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      partes[0][0] +
      partes[partes.length - 1][0]
    ).toUpperCase();
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      {/* =====================================================
          CABEÇALHO
      ====================================================== */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-500 text-white shadow-sm">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Depoimentos
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Gerencie os depoimentos exibidos nos treinamentos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MENSAGENS
      ====================================================== */}

      {erro && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {sucesso}
        </div>
      )}

      {/* =====================================================
          FORMULÁRIO
      ====================================================== */}

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId
                ? "Editar depoimento"
                : "Novo depoimento"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {editingId
                ? "Atualize as informações deste depoimento."
                : "Cadastre um novo depoimento para exibir no site."}
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={limparForm}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <X className="h-4 w-4" />

              Cancelar
            </button>
          )}
        </div>

        <form
          onSubmit={salvarDepoimento}
          className="space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label
                htmlFor="nome"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Nome da pessoa
              </label>

              <input
                id="nome"
                name="nome"
                type="text"
                value={form.nome}
                onChange={alterarCampo}
                placeholder="Ex.: Mariana Costa"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label
                htmlFor="cargo"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Cargo da pessoa
              </label>

              <input
                id="cargo"
                name="cargo"
                type="text"
                value={form.cargo}
                onChange={alterarCampo}
                placeholder="Ex.: Coordenadora de Suprimentos"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="depoimento"
                className="block text-sm font-medium text-slate-700"
              >
                Depoimento
              </label>

              <span className="text-xs text-slate-400">
                {form.depoimento.length} caracteres
              </span>
            </div>

            <textarea
              id="depoimento"
              name="depoimento"
              value={form.depoimento}
              onChange={alterarCampo}
              rows={5}
              placeholder="Digite o depoimento da pessoa..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Avaliação
            </label>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(
                (estrela) => (
                  <button
                    key={estrela}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        estrelas: estrela,
                      }))
                    }
                    className="group rounded-lg p-1 transition hover:scale-110"
                    aria-label={`${estrela} estrela${
                      estrela > 1 ? "s" : ""
                    }`}
                  >
                    <Star
                      className={`h-7 w-7 transition ${
                        estrela <= form.estrelas
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 group-hover:text-amber-300"
                      }`}
                    />
                  </button>
                ),
              )}

              <span className="ml-2 text-sm font-medium text-slate-600">
                {form.estrelas}/5
              </span>
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Foto
            </label>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {fotoPreview ? (
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fotoPreview}
                    alt="Prévia da foto"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-500 text-xl font-bold text-white shadow-md">
                  {form.nome
                    ? iniciais(form.nome)
                    : "?"}
                </div>
              )}

              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
                  <Upload className="h-4 w-4" />

                  {fotoPreview
                    ? "Trocar foto"
                    : "Selecionar foto"}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={selecionarFoto}
                    className="hidden"
                  />
                </label>

                <p className="mt-2 text-xs text-slate-400">
                  JPG, PNG ou WEBP. Máximo de 5 MB.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  Salvando...
                </>
              ) : editingId ? (
                <>
                  <Pencil className="h-4 w-4" />

                  Salvar alterações
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />

                  Adicionar depoimento
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* =====================================================
          LISTAGEM
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Depoimentos cadastrados
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {depoimentos.length}{" "}
            {depoimentos.length === 1
              ? "depoimento cadastrado"
              : "depoimentos cadastrados"}
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="h-7 w-7 animate-spin text-sky-500" />

              <span className="text-sm">
                Carregando depoimentos...
              </span>
            </div>
          </div>
        ) : depoimentos.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Users className="h-6 w-6 text-slate-400" />
            </div>

            <h3 className="font-semibold text-slate-800">
              Nenhum depoimento cadastrado
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Cadastre o primeiro depoimento utilizando o formulário acima.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 p-6 xl:grid-cols-2">
            {depoimentos.map((item) => (
              <div
                key={item.id}
                className="relative rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
              >
                <div className="mb-4 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(
                    (estrela) => (
                      <Star
                        key={estrela}
                        className={`h-4 w-4 ${
                          estrela <= item.estrelas
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    ),
                  )}
                </div>

                <p className="mb-6 text-sm leading-7 text-slate-600">
                  “{item.depoimento}”
                </p>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    {item.foto_url ? (
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.foto_url}
                          alt={item.nome}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-500 text-xs font-bold text-white">
                        {iniciais(item.nome)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.nome}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {item.cargo}
                      </p>
                    </div>
                  </div>

                  {/* =================================================
                      AÇÕES
                  ================================================== */}

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        editarDepoimento(item)
                      }
                      disabled={
                        deletingId === item.id
                      }
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />

                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        excluirDepoimento(item)
                      }
                      disabled={
                        deletingId !== null
                      }
                      className="inline-flex h-9 min-w-[92px] items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId ===
                      item.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />

                          Excluindo
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5" />

                          Excluir
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}