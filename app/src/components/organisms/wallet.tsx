import { useCallback, useMemo } from "react";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletProvider } from "@solana/wallet-adapter-react";
import type { FC } from "react";
import type { WalletError } from "@solana/wallet-adapter-base";

import { useSnackbar } from "./notification";

export const Wallet: FC = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new LedgerWalletAdapter()],
    []
  );

  const onError = useCallback(
    (error: WalletError) => {
      enqueueSnackbar(error.message || error.name, {
        variant: "error",
      });
    },
    [enqueueSnackbar]
  );

  return (
    <WalletProvider wallets={wallets} onError={onError} autoConnect>
      <WalletModalProvider>{children}</WalletModalProvider>
    </WalletProvider>
  );
};
