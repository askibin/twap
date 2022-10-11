import type { TransactionInstruction } from "@solana/web3.js";
import type { FC, ReactNode } from "react";
import type { AnchorProvider } from "@project-serum/anchor";
import { Transaction } from "@solana/web3.js";
import { createContext, useMemo, useCallback, useState } from "react";

import { forit } from "../utils/forit";

export type TransactionRunnerContext = {
  readonly active: boolean;
  readonly commit: (ti: TransactionInstruction[]) => Promise<string>;
  readonly error?: Error;
  readonly provider?: AnchorProvider;
  readonly setProvider: (p: AnchorProvider) => void;
  readonly signature?: string;
  readonly viewExplorer: (sig: string) => string;
};

export const RunnerContext = createContext<
  TransactionRunnerContext | undefined
>(undefined);

export const Provider: FC<{ children: ReactNode }> = ({ children }) => {
  const [active, setActive] = useState<boolean>(false);
  const [provider, setProvider] = useState<AnchorProvider>();
  const [signature, setSignature] = useState<string>();
  const [error, setError] = useState<Error>();

  const commit = useCallback(
    async (ti: TransactionInstruction[]) => {
      if (!provider) {
        throw new Error("Can not run the transaction. Absent provider");
      }
      setSignature(undefined);

      if (!active) setActive(true);

      console.log(123123, active);

      const [a, b] = await forit(
        new Promise((res, rej) => {
          setTimeout(() => {
            //res("123123");
            rej(new Error("TransactionError"));
          }, 3000);
        })
      );

      console.log([a, b]);

      if (a) setError(a); //setSignature("234234");

      return undefined;

      const tx = new Transaction().add(...ti);

      const [err, signatures] = await forit(provider.sendAll([{ tx }]));

      if (signatures) {
        setActive(false);
        setSignature(signatures[0]);

        return signatures[0];
      }

      if (err) {
        setError(err);
      }

      return undefined;
    },
    [active, provider, setActive]
  );

  const viewExplorer = useCallback(
    (sig: string) => `https://solscan.io/tx/${sig}`,
    []
  );

  const contextValue = useMemo(
    () => ({
      active,
      commit,
      error,
      provider,
      setProvider,
      signature,
      viewExplorer,
    }),
    [active, commit, error, provider, setProvider, signature, viewExplorer]
  );

  return (
    <RunnerContext.Provider value={contextValue}>
      {children}
    </RunnerContext.Provider>
  );
};
