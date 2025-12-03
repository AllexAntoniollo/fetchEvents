import { ethers } from "ethers";

const RPC = "https://arb1.arbitrum.io/rpc";
const POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
const CONTRACT_ADDRESS = "0x1D262425dc046b8bb26B4DB4f4Cd754804208049";
const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

import abiContract from "./contract.abi.json";

const abi = [
  "event DecreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
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

  const iface = new ethers.Interface(abiContract);

  const eventTopic = ethers.id("Transfer(address,address,uint256)");
  const toTopic = ethers.zeroPadValue(CONTRACT_ADDRESS, 32);

  const logs = await provider.getLogs({
    address: USDC,
    fromBlock: fromBlock,
    toBlock: toBlock,
    topics: [eventTopic, null, toTopic],
  });

  let total = BigInt(0);

  for (const log of logs) {
    const decoded = iface.decodeEventLog("Transfer", log.data, log.topics);
    total += decoded.value;
  }
  return { qtd: logs.length, valueReceived: total / BigInt(10 ** 6) };
}
