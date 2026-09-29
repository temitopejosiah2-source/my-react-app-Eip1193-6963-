import { useEffect, useState } from "react";
import "./App.css";
import Eip6963 from "./Eip6963";

const SUPPORTED_CHAINS = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia",
  10143: "Monad Testnet",
};

function App() {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState("");

  // Runs whenever a wallet is connected. Attaches the EIP-1193 event
  // listeners onto that specific provider, not the global window.ethereum.
  useEffect(() => {
    if (!selectedProvider) return;

    function handleAccountsChanged(accounts) {
      if (accounts.length === 0) {
        // User disconnected from inside the wallet itself
        setAccount("");
        setSelectedProvider(null);
      } else {
        setAccount(accounts[0]);
      }
    }

    function handleChainChanged(hexChainId) {
      setChainId(parseInt(hexChainId, 16));
    }

    selectedProvider.on("accountsChanged", handleAccountsChanged);
    selectedProvider.on("chainChanged", handleChainChanged);

    return () => {
      selectedProvider.removeListener("accountsChanged", handleAccountsChanged);
      selectedProvider.removeListener("chainChanged", handleChainChanged);
    };
  }, [selectedProvider]);

  // Assignment 2b: check the current chain against the supported list
  // every time chainId changes.
  useEffect(() => {
    if (chainId === null) {
      setError("");
      return;
    }
    setError(SUPPORTED_CHAINS[chainId] ? "" : `Unsupported chain (id ${chainId}).`);
  }, [chainId]);

  const handleSelectProvider = async (providerDetail) => {
    try {
      const provider = providerDetail.provider;
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const hexChainId = await provider.request({ method: "eth_chainId" });

      setSelectedProvider(provider);
      setAccount(accounts[0]);
      setChainId(parseInt(hexChainId, 16));
    } catch (err) {
      setError(err.code === 4001 ? "Connection request rejected." : err.message);
    }
  };

  // Assignment 2a: disconnect button
  const handleDisconnect = () => {
    setSelectedProvider(null);
    setAccount("");
    setChainId(null);
    setError("");
  };

  // Assignment 2b: prompt the user to switch to a supported chain
  const handleSwitchChain = async (targetChainId) => {
    if (!selectedProvider) return;
    try {
      await selectedProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + targetChainId.toString(16) }],
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ margin: "20px" }}>EIP-1193 / EIP-6963</h1>

      {!account && <Eip6963 onSelectProvider={handleSelectProvider} />}

      {account && (
        <div>
          <h2>Connected</h2>
          <p>Account: {account}</p>
          <p>
            Chain ID: {chainId} {SUPPORTED_CHAINS[chainId] ? `(${SUPPORTED_CHAINS[chainId]})` : ""}
          </p>
          <button onClick={handleDisconnect}>Disconnect</button>
        </div>
      )}

      {error && (
        <div style={{ color: "red", marginTop: 10 }}>
          <p>{error}</p>
          {account && chainId && !SUPPORTED_CHAINS[chainId] && (
            <div>
              <p>Switch to a supported chain:</p>
              {Object.entries(SUPPORTED_CHAINS).map(([id, name]) => (
                <button key={id} onClick={() => handleSwitchChain(Number(id))} style={{ marginRight: 8 }}>
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;