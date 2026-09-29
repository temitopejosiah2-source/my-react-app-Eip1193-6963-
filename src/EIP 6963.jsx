import { useEffect, useState } from "react";

const Eip6963 = ({ onSelectProvider }) => {
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    function onAnnounce(event) {
      setProviders((prev) => {
        const alreadyHave = prev.some(
          (p) => p.info.uuid === event.detail.info.uuid
        );
        return alreadyHave ? prev : [...prev, event.detail];
      });
    }

    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
    };
  }, []);

  return (
    <div>
      <p>Available wallets:</p>
      {providers.length === 0 && <p>No wallets detected.</p>}
      {providers.map((provider) => (
        <div
          key={provider.info.uuid}
          style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: 8 }}
        >
          <img src={provider.info.icon} alt={provider.info.name} width={30} height={30} />
          <p style={{ margin: 0 }}>{provider.info.name}</p>
          <button onClick={() => onSelectProvider(provider)}>
            Connect {provider.info.name}
          </button>
        </div>
      ))}
    </div>
  );
};

export default Eip6963;