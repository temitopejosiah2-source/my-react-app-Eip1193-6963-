import { useEffect, useState } from "react";
import "./App.css";
import Eip6963 from "./Eip6963";

const SUPPORTED_CHAINS = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia",
  10143: "Monad Testnet",
};

// Converts the hex wei string eth_getBalance returns into a readable ETH string.
function weiHexToEth(weiHex) {
  const wei = BigInt(weiHex);
  const eth = Number(wei) / 1e18;
  return eth.toFixed(4);
}

function App() {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedProvider) return;

    function handleAccountsChanged(accounts) {
      if (accounts.length === 0) {
        setAccount("");
        setSelectedProvider(null);
        setBalance(null);
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

  useEffect(() => {
    if (chainId === null) {
      setError("");
      return;
    }
    setError(SUPPORTED_CHAINS[chainId] ? "" : `Unsupported chain (id ${chainId}).`);
  }, [chainId]);

  // Refetch balance any time the account or chain changes, so it doesn't
  // silently go stale after a switch.
  useEffect(() => {
    if (selectedProvider && account) {
      fetchBalance(selectedProvider, account);
    }
  }, [selectedProvider, account, chainId]);

  async function fetchBalance(provider, address) {
    try {
      const weiHex = await provider.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });
      setBalance(weiHexToEth(weiHex));
    } catch (err) {
      setError(err.message);
    }
  }

  const handleRefreshBalance = async () => {
    if (!selectedProvider || !account) return;
    setRefreshing(true);
    await fetchBalance(selectedProvider, account);
    setRefreshing(false);
  };

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

  const handleDisconnect = () => {
    setSelectedProvider(null);
    setAccount("");
    setChainId(null);
    setBalance(null);
    setError("");
  };

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
          <p>
            Balance: {balance !== null ? `${balance} ETH` : "—"}{" "}
            <button onClick={handleRefreshBalance} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh Balance"}
            </button>
          </p>
          <button onClick={handleDisconnect}>Disconnect</button>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <p>Supported chains:</p>
        <ul>
          {Object.entries(SUPPORTED_CHAINS).map(([id, name]) => (
            <li key={id}>
              {name} (id {id})
            </li>
          ))}
        </ul>
      </div>

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