"use client";
import '@rainbow-me/rainbowkit/styles.css';
import { NextUIProvider } from '@nextui-org/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { cookieStorage, createStorage, http} from 'wagmi'
import { useState, useEffect } from 'react'


export const config = getDefaultConfig({
  appName: 'Claim bitcoin ($btc) airdrop',
  projectId: 'c576d1ab363d7967b3f01bea1edebac5',
  chains: [ mainnet ],
  storage: createStorage({
    storage: cookieStorage
  }),
  transports: {
    [mainnet.id]: http(),
  },
});

const client = new QueryClient();

export function Providers({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider>
        <NextUIProvider>
        <main className="text-foreground bg-background">
        {mounted && children}
        </main>
        </NextUIProvider>
        </RainbowKitProvider>
        </QueryClientProvider>
    </WagmiProvider>
  );
}

