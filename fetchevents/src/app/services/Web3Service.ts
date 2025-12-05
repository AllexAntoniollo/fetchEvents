import { ethers } from "ethers";

const RPC = "https://arb1.arbitrum.io/rpc";
const POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

const abi = [
  "event DecreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
];

const RPCBNB = "https://bsc.blockrazor.xyz";

// PancakeSwap V3 Position Manager
const POSITION_MANAGERBNB = "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364";

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

const Q96 = 2n ** 96n;
const Q128 = 2n ** 128n;

function mulDiv(a: bigint, b: bigint, denominator: bigint): bigint {
  return (a * b) / denominator;
}

function getSqrtRatioAtTick(tick: number): bigint {
  const absTick = Math.abs(tick);
  if (absTick > 887272) throw new Error("TICK_BOUND");

  let ratio =
    (absTick & 1) !== 0
      ? 0xfffcb933bd6fad37aa2d162d1a594001n
      : 0x100000000000000000000000000000000n;

  if ((absTick & 2) !== 0)
    ratio = mulDiv(ratio, 0xfff97272373d413259a46990580e213an, Q128);
  if ((absTick & 4) !== 0)
    ratio = mulDiv(ratio, 0xfff2e50f5f656932ef12357cf3c7fdccn, Q128);
  if ((absTick & 8) !== 0)
    ratio = mulDiv(ratio, 0xffe5caca7e10e4e61c3624eaa0941cd0n, Q128);
  if ((absTick & 16) !== 0)
    ratio = mulDiv(ratio, 0xffcb9843d60f6159c9db58835c926644n, Q128);
  if ((absTick & 32) !== 0)
    ratio = mulDiv(ratio, 0xff973b41fa98c081472e6896dfb254c0n, Q128);
  if ((absTick & 64) !== 0)
    ratio = mulDiv(ratio, 0xff2ea16466c96a3843ec78b326b52861n, Q128);
  if ((absTick & 128) !== 0)
    ratio = mulDiv(ratio, 0xfe5dee046a99a2a811c461f1969c3053n, Q128);
  if ((absTick & 256) !== 0)
    ratio = mulDiv(ratio, 0xfcbe86c7900a88aedcffc83b479aa3a4n, Q128);
  if ((absTick & 512) !== 0)
    ratio = mulDiv(ratio, 0xf987a7253ac4d919c72bc39f7e5f0e2en, Q128);
  if ((absTick & 1024) !== 0)
    ratio = mulDiv(ratio, 0xf3392b0822b70005940c7a398e4b70f3n, Q128);
  if ((absTick & 2048) !== 0)
    ratio = mulDiv(ratio, 0xe7159475a2c29b7443b29c7fa6e889d9n, Q128);
  if ((absTick & 4096) !== 0)
    ratio = mulDiv(ratio, 0xd097f3bdfd2022b8845ad8f792aa5825n, Q128);
  if ((absTick & 8192) !== 0)
    ratio = mulDiv(ratio, 0xa9f746462d870fdf8a65dc1f90e061e5n, Q128);
  if ((absTick & 16384) !== 0)
    ratio = mulDiv(ratio, 0x70d869a156d2a1b890bb3df62baf32f7n, Q128);
  if ((absTick & 32768) !== 0)
    ratio = mulDiv(ratio, 0x31be135f97d08fd981231505542fcfa6n, Q128);
  if ((absTick & 65536) !== 0)
    ratio = mulDiv(ratio, 0x9aa508b5b7a84e1c677de54f3e99bc9n, Q128);
  if ((absTick & 131072) !== 0)
    ratio = mulDiv(ratio, 0x5d6af8dedb81196699c329225ee604n, Q128);
  if ((absTick & 262144) !== 0)
    ratio = mulDiv(ratio, 0x2216e584f5fa1ea926041bedfe98n, Q128);
  if ((absTick & 524288) !== 0)
    ratio = mulDiv(ratio, 0x48a170391f7dc42444e8fa2n, Q128);

  if (tick > 0) {
    ratio = mulDiv(
      BigInt(
        "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
      ),
      ratio,
      Q128
    );
  }

  return ratio >> 32n;
}

function getAmount1(liquidity: bigint, sqrtLower: bigint, sqrtUpper: bigint) {
  return mulDiv(liquidity, sqrtUpper - sqrtLower, Q96);
}

export async function getLiquidity() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const contract = new ethers.Contract(POSITION_MANAGER, abi, provider);

  const pos = await contract.positions(4906534);

  const tickLower = Number(pos[5]);
  const tickUpper = Number(pos[6]);
  const liquidity = BigInt(pos[7]);

  const sqrtLower = getSqrtRatioAtTick(tickLower);
  const sqrtUpper = getSqrtRatioAtTick(tickUpper);

  const amount1 = getAmount1(liquidity, sqrtLower, sqrtUpper);

  const usdcValue = Number(amount1) / 1e6;

  return {
    usdcValue,
  };
}

export async function valueReceivedBNB(fromBlock: number, toBlock: number) {
  const provider = new ethers.JsonRpcProvider(RPCBNB);
  const contract = new ethers.Contract(POSITION_MANAGERBNB, abi, provider);

  const eventFilter = contract.filters.IncreaseLiquidity(654147);

  const logs = await contract.queryFilter(eventFilter, fromBlock, toBlock);

  let totalAmount0 = 0n;

  for (const log of logs) {
    if (log instanceof ethers.EventLog) {
      totalAmount0 += log.args.amount0;
    }
  }

  return {
    qtd: logs.length,
    valueReceived: totalAmount0 / BigInt(1e18),
  };
}

// PancakeSwap V3 Position Manager

export async function valuePaidBNB(fromBlock: number, toBlock: number) {
  const provider = new ethers.JsonRpcProvider(RPCBNB);
  const contract = new ethers.Contract(POSITION_MANAGERBNB, abi, provider);

  // tokenId do NFT de liquidez
  const eventFilter = contract.filters.DecreaseLiquidity(654147);

  const logs = await contract.queryFilter(eventFilter, fromBlock, toBlock);

  let totalAmount0 = 0n;

  for (const log of logs) {
    if (log instanceof ethers.EventLog) {
      totalAmount0 += log.args.amount0;
    }
  }

  return {
    qtd: logs.length,
    valuePaid: totalAmount0 / BigInt(1e18), // assume USDC/USDT 6 decimals
  };
}
