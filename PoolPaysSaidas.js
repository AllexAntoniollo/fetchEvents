import { ethers } from "ethers";
import { Pool } from "pg";

const RPC_URL = "https://arb-mainnet.g.alchemy.com/v2/JNpGpIG9YcsrFLCXlPMEd";

const POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

const abi = [
  "event DecreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
];

// const FROM_BLOCK = 380897759;
const FROM_BLOCK = 416985910;

const TO_BLOCK = 424846630;
const STEP = 100000;

const provider = new ethers.JsonRpcProvider(RPC_URL);

const contract = new ethers.Contract(POSITION_MANAGER, abi, provider);
const POOLPAYS_ABI = [
  "function poolPays(uint256 usdcAmount, address recipient, uint256 batchId, bool isBatch) returns (uint256 actualUSDC)",
];

// ---- Postgres ----
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "Alana2009",
  port: 5432,
});

async function saveWithdraw(to, value, txHash, blockNumber, batchId) {
  await pool.query(
    `
    INSERT INTO token_withdraw(to_address, value, tx_hash, block_number,batch_id)
    VALUES($1, $2, $3, $4, $5)
    ON CONFLICT (tx_hash) DO NOTHING
    `,
    [to, value.toString(), txHash, blockNumber, batchId],
  );
}

const iface = new ethers.Interface(POOLPAYS_ABI);
const selector = iface.getFunction("poolPays").selector.toLowerCase();

async function main() {
  for (let start = FROM_BLOCK; start <= TO_BLOCK; start += STEP) {
    const end = Math.min(start + STEP - 1, TO_BLOCK);

    console.log(`Scanning ${start} -> ${end}`);

    const filter = contract.filters.DecreaseLiquidity(4906534);

    const logs = await contract.queryFilter(filter, start, end);

    for (const log of logs) {
      const tx = await provider.getTransaction(log.transactionHash);

      if (!tx.data.toLowerCase().startsWith(selector)) continue;

      const parsed = iface.parseTransaction({
        data: tx.data,
        value: tx.value,
      });
      const recipient = parsed.args.recipient;
      const batchId = parsed.args.batchId.toString();
      const usdcAmount = parsed.args.usdcAmount.toString();
      const hash = tx.hash;
      saveWithdraw(recipient, usdcAmount, hash, log.blockNumber, batchId);
    }
  }

  console.log("Finalizado.");
  await pool.end();
}

main();
