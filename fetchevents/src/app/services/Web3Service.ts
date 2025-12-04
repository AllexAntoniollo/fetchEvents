import { ethers } from "ethers";

const RPC = "https://arb1.arbitrum.io/rpc";
const POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

const abi = [
  "event DecreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
];

export async function valuePaid(fromBlock: number, toBlock: number) {
  const provider = new ethers.JsonRpcProvider(RPC);
  const contract = new ethers.Contract(POSITION_MANAGER, abi, provider);

  const eventFilter = contract.filters.DecreaseLiquidity(4906534);

  const logs = await contract.queryFilter(eventFilter, fromBlock, toBlock);

  let totalAmount1 = BigInt(0);

  for (const log of logs) {
    if (log instanceof ethers.EventLog) {
      totalAmount1 += log.args.amount1;
    }
  }
  return { qtd: logs.length, valuePaid: totalAmount1 / BigInt(10 ** 6) };
}

export async function valueReceived(fromBlock: number, toBlock: number) {
  const provider = new ethers.JsonRpcProvider(RPC);
  const contract = new ethers.Contract(POSITION_MANAGER, abi, provider);

  const eventFilter = contract.filters.IncreaseLiquidity(4906534);

  const logs = await contract.queryFilter(eventFilter, fromBlock, toBlock);

  let totalAmount1 = BigInt(0);

  for (const log of logs) {
    if (log instanceof ethers.EventLog) {
      totalAmount1 += log.args.amount1;
    }
  }

  return {
    qtd: logs.length,
    valueReceived: totalAmount1 / BigInt(10 ** 6),
  };
}
