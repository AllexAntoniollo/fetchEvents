"use client";

import { useState, FormEvent } from "react";
import {
  getBlockTimestamp,
  getLiquidity,
  valuePaid,
  valueReceived,
} from "./services/Web3Service";

export default function Home() {
  // Estados para os blocos
  const [fromBlock, setFromBlock] = useState<string>("");
  const [toBlock, setToBlock] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [summary, setSummary] = useState({
    paymentCount: 0,
    receiptCount: 0,
    totalPaid: BigInt(0),
    totalReceived: BigInt(0),
    liquidity: 0,
    fromTimestamp: 0,
    toTimestamp: 0,
    timeDiff: 0,
  });

  // Formatadores
  function formatDate(ts: number) {
    if (!ts) return "---";
    const d = new Date(ts * 1000);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatDuration(secs: number) {
    if (!secs || secs < 0) return "---";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}h ${m}m ${s}s`;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!fromBlock || !toBlock) {
      alert("Por favor, preencha ambos os blocos");
      return;
    }

    setIsLoading(true);

    try {
      const tx = await valuePaid(Number(fromBlock), Number(toBlock));
      const events = await valueReceived(Number(fromBlock), Number(toBlock));
      const liquidity = await getLiquidity();

      // Buscar timestamps dos blocos
      const fromTs = await getBlockTimestamp(Number(fromBlock));
      const toTs = await getBlockTimestamp(Number(toBlock));

      setSummary({
        paymentCount: tx.qtd,
        receiptCount: events.qtd,
        totalPaid: tx.valuePaid,
        totalReceived: events.valueReceived,
        liquidity: liquidity.usdcValue,
        fromTimestamp: fromTs,
        toTimestamp: toTs,
        timeDiff: toTs - fromTs,
      });
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      alert("Erro ao processar os blocos. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Analisador de Transações
          </h1>
          <p className="text-gray-600">
            Consulte eventos de pagamentos e recebimentos por intervalo de
            blocos
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Consultar Blocos
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="fromBlock"
                    className="block text-sm text-black font-medium mb-2"
                  >
                    Bloco Inicial
                  </label>
                  <input
                    type="text"
                    id="fromBlock"
                    value={fromBlock}
                    onChange={(e) => setFromBlock(e.target.value)}
                    placeholder="Ex: 123456"
                    className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="toBlock"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    Bloco Final
                  </label>
                  <input
                    type="text"
                    id="toBlock"
                    value={toBlock}
                    onChange={(e) => setToBlock(e.target.value)}
                    placeholder="Ex: 123500"
                    className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition ${
                  isLoading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isLoading ? "Processando..." : "Consultar Transações"}
              </button>
            </form>
          </div>

          {/* Resultados */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Resultados
            </h2>

            {/* Liquidez */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Liquidez Total na Pool</p>
              <p className="text-2xl font-bold text-green-900">
                {summary.liquidity.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="space-y-6 mt-6">
              {/* Resumo Geral */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total de Pagamentos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.paymentCount}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total de Recebimentos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.receiptCount}
                  </p>
                </div>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <p className="text-sm text-red-600">Valor Total Pago</p>
                  <p className="text-2xl font-bold text-red-700">
                    US {Number(summary.totalPaid).toFixed(2)}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <p className="text-sm text-green-600">Valor Total Recebido</p>
                  <p className="text-2xl font-bold text-green-700">
                    US {Number(summary.totalReceived).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Saldo */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-600">Saldo Líquido</p>
                <p
                  className={`text-2xl font-bold ${
                    summary.totalReceived - summary.totalPaid >= 0
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  US{" "}
                  {Number(summary.totalReceived - summary.totalPaid).toFixed(2)}
                </p>
                <p className="text-sm text-blue-500 mt-1">
                  Recebimentos - Pagamentos
                </p>
              </div>

              {/* Intervalo Consultado */}
              <div className="border-t pt-4 text-black">
                <p className="text-sm text-gray-500 mb-2">
                  Intervalo Consultado:
                </p>

                <div className="flex items-center space-x-4">
                  {/* Bloco inicial */}
                  <div>
                    <p className="text-xs text-gray-400">De</p>
                    <p className="font-medium">{fromBlock || "---"}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(summary.fromTimestamp)}
                    </p>
                  </div>

                  <div className="text-gray-300">→</div>

                  {/* Bloco final */}
                  <div>
                    <p className="text-xs text-gray-400">Até</p>
                    <p className="font-medium">{toBlock || "---"}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(summary.toTimestamp)}
                    </p>
                  </div>

                  {/* Duração */}
                  <div>
                    <p className="text-xs text-gray-400">Duração</p>
                    <p className="font-medium">
                      {formatDuration(summary.timeDiff)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Dados processados em tempo real. Para produção conecte-se a um
            provedor blockchain.
          </p>
        </div>
      </div>
    </div>
  );
}
