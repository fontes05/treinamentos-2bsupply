"use client";

import {
  ArrowUpRight,
  BookOpen,
  CircleDollarSign,
  Clock,
  GraduationCap,
  MoreHorizontal,
  Users,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const chartData = [
  { mes: "Mar", inscricoes: 72 },
  { mes: "Abr", inscricoes: 91 },
  { mes: "Mai", inscricoes: 86 },
  { mes: "Jun", inscricoes: 120 },
  { mes: "Jul", inscricoes: 146 },
  { mes: "Ago", inscricoes: 187 },
];

const cursos = [
  {
    nome: "Strategic Sourcing",
    categoria: "Compras",
    alunos: 48,
    status: "Ativo",
  },
  {
    nome: "Negociação Estratégica",
    categoria: "Negociação",
    alunos: 37,
    status: "Ativo",
  },
  {
    nome: "Gestão de Contratos",
    categoria: "Contratos",
    alunos: 31,
    status: "Ativo",
  },
  {
    nome: "IA aplicada a Compras",
    categoria: "Inteligência Artificial",
    alunos: 29,
    status: "Ativo",
  },
];

const inscricoes = [
  {
    aluno: "João Silva",
    curso: "Strategic Sourcing",
    data: "24/08/2026",
    status: "Confirmada",
  },
  {
    aluno: "Ana Costa",
    curso: "KPIs para Compras",
    data: "24/08/2026",
    status: "Confirmada",
  },
  {
    aluno: "Carlos Lima",
    curso: "Gestão de Contratos",
    data: "23/08/2026",
    status: "Pendente",
  },
  {
    aluno: "Mariana Souza",
    curso: "IA aplicada a Compras",
    data: "23/08/2026",
    status: "Confirmada",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-7">
      {/* Cabeçalho */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-600">
            Visão geral
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 lg:text-3xl">
            Dashboard
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Acompanhe o desempenho dos treinamentos e as últimas
            movimentações.
          </p>
        </div>

        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <BookOpen size={17} />
          Novo curso
        </Button>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Cursos ativos"
          value="24"
          description="+3 este mês"
          icon={<BookOpen size={20} />}
        />

        <MetricCard
          title="Inscrições"
          value="187"
          description="+18,2% este mês"
          icon={<GraduationCap size={20} />}
        />

        <MetricCard
          title="Alunos"
          value="142"
          description="+21 novos alunos"
          icon={<Users size={20} />}
        />

        <MetricCard
          title="Receita"
          value="R$ 18.420"
          description="+12,4% este mês"
          icon={<CircleDollarSign size={20} />}
        />
      </div>

      {/* Gráfico + resumo */}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-base">
                Inscrições nos treinamentos
              </CardTitle>

              <CardDescription>
                Evolução das inscrições nos últimos 6 meses.
              </CardDescription>
            </div>

            <Badge
              variant="secondary"
              className="bg-emerald-50 text-emerald-700"
            >
              +18,2%
            </Badge>
          </CardHeader>

          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="inscricoesGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#059669"
                        stopOpacity={0.25}
                      />

                      <stop
                        offset="95%"
                        stopColor="#059669"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e4e4e7"
                  />

                  <XAxis
                    dataKey="mes"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />

                  <Tooltip
                    cursor={{
                      stroke: "#059669",
                      strokeDasharray: "4 4",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="inscricoes"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fill="url(#inscricoesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              Resumo rápido
            </CardTitle>

            <CardDescription>
              Indicadores dos treinamentos.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <SummaryItem
              label="Cursos publicados"
              value="24"
              detail="de 28 cadastrados"
            />

            <SummaryItem
              label="Cursos em rascunho"
              value="4"
              detail="aguardando publicação"
            />

            <SummaryItem
              label="Inscrições pendentes"
              value="9"
              detail="aguardando confirmação"
            />

            <SummaryItem
              label="Próximo treinamento"
              value="28 Ago"
              detail="Strategic Sourcing"
            />
          </CardContent>
        </Card>
      </div>

      {/* Cursos + últimas inscrições */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Cursos */}
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Cursos mais procurados
              </CardTitle>

              <CardDescription>
                Treinamentos com maior número de inscrições.
              </CardDescription>
            </div>

            <Button variant="ghost" size="sm">
              Ver todos
              <ArrowUpRight size={15} />
            </Button>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {cursos.map((curso) => (
                  <TableRow key={curso.nome}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-zinc-900">
                          {curso.nome}
                        </p>

                        <p className="text-xs text-zinc-500">
                          {curso.categoria}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>{curso.alunos}</TableCell>

                    <TableCell>
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                        {curso.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Inscrições */}
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Últimas inscrições
              </CardTitle>

              <CardDescription>
                Inscrições mais recentes na plataforma.
              </CardDescription>
            </div>

            <Button variant="ghost" size="sm">
              Ver todas
              <ArrowUpRight size={15} />
            </Button>
          </CardHeader>

          <CardContent>
            <div className="space-y-1">
              {inscricoes.map((inscricao) => (
                <div
                  key={`${inscricao.aluno}-${inscricao.curso}`}
                  className="flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition hover:bg-zinc-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 font-semibold text-zinc-600">
                      {inscricao.aluno
                        .split(" ")
                        .map((name) => name[0])
                        .slice(0, 2)
                        .join("")}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {inscricao.aluno}
                      </p>

                      <p className="truncate text-xs text-zinc-500">
                        {inscricao.curso}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <Badge
                      variant="secondary"
                      className={
                        inscricao.status === "Confirmada"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }
                    >
                      {inscricao.status}
                    </Badge>

                    <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-zinc-400">
                      <Clock size={11} />
                      {inscricao.data}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              {title}
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
              {value}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            {icon}
          </div>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          <span className="font-medium text-emerald-600">
            {description}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-zinc-800">
          {label}
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          {detail}
        </p>
      </div>

      <p className="text-lg font-bold text-zinc-950">
        {value}
      </p>
    </div>
  );
}