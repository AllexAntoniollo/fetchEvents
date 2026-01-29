import { ethers } from "ethers";
import { Pool } from "pg";

const RPC_URL = "https://arb-mainnet.g.alchemy.com/v2/JNpGpIG9YcsrFLCXlPMEd";

const TOKEN_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const TARGET_TO = "0x1D262425dc046b8bb26B4DB4f4Cd754804208049".toLowerCase();

// const FROM_BLOCK = 380897759;
const FROM_BLOCK = 383252759;

const TO_BLOCK = 424846630;
const STEP = 100000;

const provider = new ethers.JsonRpcProvider(RPC_URL);

const abi = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

const contract = new ethers.Contract(TOKEN_ADDRESS, abi, provider);

// ---- Postgres ----
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "DATABASE NAME",
  password: "DATABASE PASSWORD",
  port: 5432,
});

async function saveDeposit(from, value, txHash, blockNumber) {
  await pool.query(
    `
    INSERT INTO token_deposits(from_address, value, tx_hash, block_number)
    VALUES($1, $2, $3, $4)
    ON CONFLICT (tx_hash) DO NOTHING
    `,
    [from, value.toString(), txHash, blockNumber],
  );
}

async function main() {
  for (let start = FROM_BLOCK; start <= TO_BLOCK; start += STEP) {
    const end = Math.min(start + STEP - 1, TO_BLOCK);
    console.log(`Scanning blocks ${start} -> ${end}`);
    const filter = contract.filters.Transfer(null, TARGET_TO);

    const logs = await contract.queryFilter(filter, start, end);

    for (const log of logs) {
      const { from, to, value } = log.args;

      await saveDeposit(
        from.toLowerCase(),
        value,
        log.transactionHash,
        log.blockNumber,
      );
    }
  }

  console.log("Finalizado. Depósitos salvos no Postgres.");
  await pool.end();
}

main();
