"use client";

import { useState, FormEvent } from "react";
import {
  getLiquidity,
  valueReceivedBNB,
  valuePaidBNB,
} from "../services/Web3Service";

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
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!fromBlock || !toBlock) {
      alert("Por favor, preencha ambos os blocos");
      return;
    }

    setIsLoading(true);

    try {
      const tx = await valuePaidBNB(Number(fromBlock), Number(toBlock));
      const events = await valueReceivedBNB(Number(fromBlock), Number(toBlock));
      const liquidity = await getLiquidity();
      setSummary({
        paymentCount: tx.qtd,
        receiptCount: events.qtd,
        totalPaid: tx.valuePaid,
        totalReceived: events.valueReceived,
        liquidity: liquidity.usdcValue,
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
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processando...
                  </span>
                ) : (
                  "Consultar Transações"
                )}
              </button>
            </form>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Como usar:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Insira o número do bloco inicial</li>
                <li>• Insira o número do bloco final</li>
                <li>• Clique em "Consultar Transações"</li>
                <li>• Os resultados aparecerão ao lado</li>
              </ul>
            </div>
          </div>

          {/* Resultados */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Resultados
            </h2>

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

              {/* Intervalo de Blocos Atual */}
              <div className="border-t pt-4 text-black!">
                <p className="text-sm text-gray-500 mb-2">
                  Intervalo Consultado:
                </p>
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-xs text-gray-400">De</p>
                    <p className="font-medium">{fromBlock || "---"}</p>
                  </div>
                  <div className="text-gray-300">→</div>
                  <div>
                    <p className="text-xs text-gray-400">Até</p>
                    <p className="font-medium">{toBlock || "---"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Dados processados em tempo real. Para uma implementação real,
            conecte-se a um provedor blockchain como Ethereum, Polygon, ou outra
            rede compatível.
          </p>
        </div>
      </div>
    </div>
  );
}
