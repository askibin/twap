import { populateStats } from "../../domain/token-pair-details";

export const populate = (
  pair: Pick<TokenPairProgramData, "statsA" | "statsB" | "configA" | "configB">
): PerfPair => {
  const { a, b, fee, orderVolume, settleVolume, tradeVolume } =
    populateStats(pair);

  return {
    aMint: a,
    bMint: b,
    fee,
    id: `${a}-${b}`,
    orderVolume,
    settleVolume,
    tradeVolume,
  };
};
