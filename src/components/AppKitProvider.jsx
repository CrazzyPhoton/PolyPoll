import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { polygon } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

// 0. Setup queryClient
const queryClient = new QueryClient()

// 1. Get projectId from https://cloud.reown.com
const projectId = import.meta.env.VITE_REOWN_POLYPOLL_PROJECT_ID;

// 2. Create a metadata object - optional
const metadata = {}

// 3. Set the networks
const networks = [polygon]

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
});

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  enableWalletGuide: false,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    connectMethodsOrder: ["wallet"]
  },
  themeVariables: {
    "--w3m-accent": "#9e42f5",
    "--w3m-z-index": 9999
  }
})

export function AppKitProvider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
