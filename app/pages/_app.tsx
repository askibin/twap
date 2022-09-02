import type { AppProps } from "next/app";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { memo, StrictMode } from "react";
import "@solana/wallet-adapter-react-ui/styles.css";

import "../styles/globals.css";
import theme from "../src/theme";
import WalletProvider from "../src/contexts/wallet-context";
import { NotificationProvider } from "../src/contexts/notification-context";
import { SolanaConnectionProvider } from "../src/contexts/solana-connection-context";
import { CoingeckoApiProvider } from "../src/contexts/coingecko-api-context";

const BaselineMemo = memo(() => <CssBaseline enableColorScheme />);

const App = ({ Component, pageProps }: AppProps) =>
  console.log({ pageProps }) || (
    <ThemeProvider theme={theme}>
      <BaselineMemo />
      <StrictMode>
        <NotificationProvider>
          <CoingeckoApiProvider>
            <SolanaConnectionProvider>
              <WalletProvider>
                <Component {...pageProps} />
              </WalletProvider>
            </SolanaConnectionProvider>
          </CoingeckoApiProvider>
        </NotificationProvider>
      </StrictMode>
    </ThemeProvider>
  );

export default App;
