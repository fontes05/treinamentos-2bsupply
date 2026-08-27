"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  BookOpen,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* =========================================================
   TIPOS
========================================================= */

type StatusTreinamento =
  | "rascunho"
  | "publicado"
  | "inativo";

type Treinamento = {
  id: string;
  titulo: string;
  slug: string;
  descricao: string | null;
  imagem_url: string | null;
  status: StatusTreinamento;
  destaque: boolean;
  created_at: string;
  updated_at: string;
};
/* =========================================================
   STATUS
========================================================= */

function StatusBadge({
  status,
}: {
  status: StatusTreinamento;
}) {
  if (status === "publicado") {
    return (
      <Badge className="!bg-emerald-50 !text-emerald-700 hover:!bg-emerald-50">
        Publicado
      </Badge>
    );
  }

  if (status === "inativo") {
    return (
      <Badge className="!bg-red-50 !text-red-700 hover:!bg-red-50">
        Inativo
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="!bg-amber-50 !text-amber-700"
    >
      Rascunho
    </Badge>
  );
}

/* =========================================================
   DATA
========================================================= */

function formatarData(value: string) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(value));
}

/* =========================================================
   PÁGINA
========================================================= */

export default function TreinamentosPage() {
  const [
    treinamentos,
    setTreinamentos,
  ] = useState<Treinamento[]>([]);

  const [busca, setBusca] =
    useState("");

  const [status, setStatus] =
    useState<
      "todos" | StatusTreinamento
    >("todos");

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  /* =======================================================
     CARREGAR TREINAMENTOS
  ======================================================= */

  async function carregarTreinamentos() {
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
          "treinamentos_cursos"
        )
.select(`
  id,
  titulo,
  slug,
  descricao,
  imagem_url,
  status,
  destaque,
  created_at,
  updated_at
`)
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {
        throw new Error(
          error.message
        );
      }

      setTreinamentos(
        (data ?? []) as Treinamento[]
      );
    } catch (error) {
      console.error(
        "Erro carregando treinamentos:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os treinamentos."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregarTreinamentos();
  }, []);

  /* =======================================================
     FILTROS
  ======================================================= */

  const filtrados = useMemo(() => {
    const termo =
      busca
        .trim()
        .toLowerCase();

    return treinamentos.filter(
      (treinamento) => {
        const correspondeBusca =
          !termo ||
          treinamento.titulo
            .toLowerCase()
            .includes(termo) ||
          treinamento.slug
            .toLowerCase()
            .includes(termo) ||
          treinamento.descricao
            ?.toLowerCase()
            .includes(termo);

        const correspondeStatus =
          status === "todos" ||
          treinamento.status ===
            status;

        return (
          correspondeBusca &&
          correspondeStatus
        );
      }
    );
  }, [
    treinamentos,
    busca,
    status,
  ]);

  /* =======================================================
     CONTADORES
  ======================================================= */

  const total =
    treinamentos.length;

  const publicados =
    treinamentos.filter(
      (item) =>
        item.status ===
        "publicado"
    ).length;

  const rascunhos =
    treinamentos.filter(
      (item) =>
        item.status ===
        "rascunho"
    ).length;

  const inativos =
    treinamentos.filter(
      (item) =>
        item.status ===
        "inativo"
    ).length;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="mx-auto max-w-[1600px] space-y-7">
      {/* =================================================
          CABEÇALHO
      ================================================= */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium !text-emerald-600">
            Administração
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight !text-zinc-950 lg:text-3xl">
            Treinamentos
          </h2>

          <p className="mt-2 text-sm !text-zinc-500">
            Visualize e gerencie os treinamentos
            cadastrados na plataforma.
          </p>
        </div>

        <Link
          href="/admin/treinamentos/novo"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-medium !text-white transition hover:bg-emerald-700"
        >
          <Plus size={17} />

          Criar treinamento
        </Link>
      </div>

      {/* =================================================
          CONTADORES
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm !text-zinc-500">
              Total
            </p>

            <p className="mt-2 text-2xl font-bold !text-zinc-950">
              {total}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm !text-zinc-500">
              Publicados
            </p>

            <p className="mt-2 text-2xl font-bold !text-emerald-600">
              {publicados}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm !text-zinc-500">
              Rascunhos
            </p>

            <p className="mt-2 text-2xl font-bold !text-amber-600">
              {rascunhos}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm !text-zinc-500">
              Inativos
            </p>

            <p className="mt-2 text-2xl font-bold !text-red-600">
              {inativos}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* =================================================
          LISTAGEM
      ================================================= */}

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <CardTitle>
                Todos os treinamentos
              </CardTitle>

              <CardDescription className="mt-1">
                {filtrados.length} treinamento
                {filtrados.length === 1
                  ? ""
                  : "s"}{" "}
                encontrado
                {filtrados.length === 1
                  ? ""
                  : "s"}
                .
              </CardDescription>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {/* BUSCA */}

              <div className="relative sm:w-[280px]">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <Input
                  value={busca}
                  onChange={(event) =>
                    setBusca(
                      event.target.value
                    )
                  }
                  placeholder="Buscar treinamento..."
                  className="pl-9"
                />
              </div>

              {/* STATUS */}

              <Select
                value={status}
                onValueChange={(value) => {
                  if (!value) {
                    return;
                  }

                  setStatus(
                    value as
                      | "todos"
                      | StatusTreinamento
                  );
                }}
              >
                <SelectTrigger className="sm:w-[170px]">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="todos">
                    Todos os status
                  </SelectItem>

                  <SelectItem value="publicado">
                    Publicados
                  </SelectItem>

                  <SelectItem value="rascunho">
                    Rascunhos
                  </SelectItem>

                  <SelectItem value="inativo">
                    Inativos
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  void carregarTreinamentos()
                }
                disabled={loading}
                title="Atualizar"
              >
                <RefreshCw
                  size={17}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* ERRO */}

          {erro && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <p className="text-sm !text-red-700">
                {erro}
              </p>
            </div>
          )}

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center">
              <LoaderCircle
                size={28}
                className="animate-spin text-emerald-600"
              />

              <p className="mt-3 text-sm !text-zinc-500">
                Carregando treinamentos...
              </p>
            </div>
          ) : filtrados.length === 0 ? (
            /* =============================================
               VAZIO
            ============================================= */

            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <BookOpen size={26} />
              </div>

              <h3 className="mt-4 font-semibold !text-zinc-900">
                Nenhum treinamento encontrado
              </h3>

              <p className="mt-1 max-w-md text-sm !text-zinc-500">
                Cadastre o primeiro treinamento
                ou altere os filtros utilizados.
              </p>

              {treinamentos.length === 0 && (
                <Link
                  href="/admin/treinamentos/novo"
                  className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-medium !text-white hover:bg-emerald-700"
                >
                  <Plus size={16} />

                  Criar treinamento
                </Link>
              )}
            </div>
          ) : (
            /* =============================================
               TABELA
            ============================================= */

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Treinamento
                    </TableHead>

                    <TableHead>
                      Status
                    </TableHead>

                    <TableHead>
                      Destaque
                    </TableHead>

                    <TableHead>
                      Criado em
                    </TableHead>

                    <TableHead>
                      Atualizado em
                    </TableHead>

                    {/* NOVA COLUNA */}
                    <TableHead className="w-[120px] text-right">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtrados.map(
                    (treinamento) => (
                      <TableRow
                        key={
                          treinamento.id
                        }
                      >
                        {/* TREINAMENTO */}

                     <TableCell>
  <div className="flex items-center gap-4">
    {/* IMAGEM */}
    <div className="h-[68px] w-[100px] shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
      {treinamento.imagem_url ? (
        <img
          src={treinamento.imagem_url}
          alt={treinamento.titulo}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-50">
          <BookOpen
            size={22}
            className="text-zinc-300"
          />
        </div>
      )}
    </div>

    {/* CONTEÚDO */}
    <div className="min-w-0 max-w-[520px]">
      <p className="truncate font-medium !text-zinc-900">
        {treinamento.titulo}
      </p>

      <p className="mt-1 truncate text-xs !text-zinc-400">
        /{treinamento.slug}
      </p>

      {treinamento.descricao && (
        <p className="mt-1 line-clamp-1 text-xs !text-zinc-500">
          {treinamento.descricao}
        </p>
      )}
    </div>
  </div>
</TableCell>
                        {/* STATUS */}

                        <TableCell>
                          <StatusBadge
                            status={
                              treinamento.status
                            }
                          />
                        </TableCell>

                        {/* DESTAQUE */}

                        <TableCell>
                          {treinamento.destaque ? (
                            <Badge className="!bg-violet-50 !text-violet-700 hover:!bg-violet-50">
                              Sim
                            </Badge>
                          ) : (
                            <span className="text-sm !text-zinc-400">
                              Não
                            </span>
                          )}
                        </TableCell>

                        {/* CRIADO */}

                        <TableCell className="whitespace-nowrap text-sm !text-zinc-500">
                          {formatarData(
                            treinamento.created_at
                          )}
                        </TableCell>

                        {/* ATUALIZADO */}

                        <TableCell className="whitespace-nowrap text-sm !text-zinc-500">
                          {formatarData(
                            treinamento.updated_at
                          )}
                        </TableCell>

                        {/* =================================
                            AÇÕES
                        ================================= */}

                        <TableCell className="text-right">
                          <Link
                            href={`/admin/treinamentos/${treinamento.id}/editar`}
                            className="
                              inline-flex h-9 items-center justify-center
                              gap-2 rounded-md border border-zinc-200
                              bg-white px-3 text-sm font-medium
                              !text-zinc-700 shadow-sm
                              transition-all
                              hover:border-emerald-200
                              hover:bg-emerald-50
                              hover:!text-emerald-700
                            "
                          >
                            <Pencil
                              size={15}
                            />

                            Editar
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}