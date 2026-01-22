// owner.js (ethers v5)
(() => {
  const C = window.APP_CONFIG;
  const $ = (id) => document.getElementById(id);

  const setStatus = (msg) => { const el = $("status"); if (el) el.textContent = msg; };
  const isAddr = (s) => /^0x[a-fA-F0-9]{40}$/.test(s || "");
  const toAddr = (s) => (isAddr(s) ? ethers.utils.getAddress(s) : null);

  const fmtUnits = (bn, decimals=18, maxFrac=6) => {
    try {
      const s = ethers.utils.formatUnits(bn || 0, decimals);
      const [i,f=""] = s.split(".");
      return f.length ? `${i}.${f.slice(0,maxFrac)}` : i;
    } catch { return "-"; }
  };

  let provider, signer, me;
  let core, vault, staking, usdt, df;

  function detectProvider(){
    if (window.ethereum) return window.ethereum;
    if (window.BinanceChain) return window.BinanceChain;
    return null;
  }

  async function ensureBSC(){
    const net = await provider.getNetwork();
    $("net").textContent = `${net.chainId}`;
    if (net.chainId !== C.CHAIN_ID_DEC) {
      const inj = detectProvider();
      if (!inj?.request) throw new Error("Wrong network. Please switch to BSC Mainnet.");
      try {
        await inj.request({ method:"wallet_switchEthereumChain", params:[{ chainId: C.CHAIN_ID_HEX }] });
      } catch {
        throw new Error("Please switch wallet network to BSC Mainnet then retry.");
      }
    }
    $("net").textContent = "BSC (56)";
  }

  async function connect(){
    try{
      const inj = detectProvider();
      if (!inj) return setStatus("No wallet detected. Open in MetaMask/Bitget DApp browser.");

      provider = new ethers.providers.Web3Provider(inj, "any");
      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      me = await signer.getAddress();

      await ensureBSC();

      // contracts
      core = new ethers.Contract(C.CORE, C.CORE_ABI, signer);
      vault = new ethers.Contract(C.VAULT, C.VAULT_ABI, signer);
      staking = new ethers.Contract(C.STAKING, C.STAKING_ABI, signer);
      usdt = new ethers.Contract(C.USDT, C.ERC20_ABI, signer);
      df   = new ethers.Contract(C.DF,   C.ERC20_ABI, signer);

      $("me").textContent = me;
      $("contracts").textContent = `CORE ${C.CORE} | VAULT ${C.VAULT} | STAKING ${C.STAKING}`;

      await ownerCheck();
      await refresh();

      // listeners
      if (inj.on){
        inj.on("accountsChanged", async (accs) => {
          if (!accs?.length) return;
          me = ethers.utils.getAddress(accs[0]);
          $("me").textContent = me;
          setStatus("Account changed. Refreshing...");
          await ownerCheck();
          await refresh();
        });
        inj.on("chainChanged", async () => {
          setStatus("Network changed. Refreshing...");
          await ownerCheck();
          await refresh();
        });
      }

      setStatus("Connected ✅");
    }catch(e){
      setStatus(`Connect failed: ${e?.message || e}`);
    }
  }

  async function ownerCheck(){
    try{
      const [oCore, oVault, oStk] = await Promise.all([
        core.owner(), vault.owner(), staking.owner()
      ]);
      const ok = [oCore,oVault,oStk].every(o => o.toLowerCase() === me.toLowerCase());
      $("ownerOk").textContent = ok ? "✅ You are owner (Core/Vault/Staking)" : `❌ Not owner. Core:${oCore}`;
      $("btnWUsdt").disabled = !ok;
      $("btnWDf").disabled = !ok;
      $("btnSetTreasury").disabled = !ok;
      $("btnRefresh").disabled = false;
    }catch(e){
      $("ownerOk").textContent = `Owner check error`;
      $("btnWUsdt").disabled = true;
      $("btnWDf").disabled = true;
      $("btnSetTreasury").disabled = true;
      $("btnRefresh").disabled = false;
    }
  }

  async function refresh(){
    try{
      if (!core) return;

      const [t, vUSDT, vDF, sDF, totU, totD, surU] = await Promise.all([
        core.treasury(),
        usdt.balanceOf(C.VAULT),
        df.balanceOf(C.VAULT),
        df.balanceOf(C.STAKING),
        vault.totalClaimableUSDT(),
        vault.totalClaimableDF(),
        vault.surplusUSDT()
      ]);

      $("treasury").textContent = t;

      $("balVaultUSDT").textContent = fmtUnits(vUSDT, 18, 6);
      $("balVaultDF").textContent = fmtUnits(vDF, 18, 6);
      $("balStakingDF").textContent = fmtUnits(sDF, 18, 6);

      $("totClaimUSDT").textContent = fmtUnits(totU, 18, 6);
      $("totClaimDF").textContent = fmtUnits(totD, 18, 6);
      $("surplusUSDT").textContent = fmtUnits(surU, 18, 6);

      setStatus("Refreshed ✅");
    }catch(e){
      setStatus(`Refresh error: ${e?.message || e}`);
    }
  }

  async function withdrawVaultUSDT(){
    try{
      const to = toAddr($("wUsdtTo").value.trim());
      if (!to) return setStatus("Invalid 'To' address.");
      const amtStr = $("wUsdtAmt").value.trim();
      if (!amtStr) return setStatus("Enter USDT amount.");

      // your USDT is 18 decimals on BSC (0x55d398... is 18)
      const amt = ethers.utils.parseUnits(amtStr, 18);

      setStatus("Withdrawing USDT from Vault...");
      const tx = await vault.withdrawSurplusUSDT(to, amt);
      await tx.wait();
      setStatus("Withdraw USDT success ✅");
      await refresh();
    }catch(e){
      setStatus(`Withdraw USDT failed: ${e?.error?.message || e?.data?.message || e?.message || e}`);
    }
  }

  async function withdrawStakingDF(){
    try{
      const to = toAddr($("wDfTo").value.trim());
      if (!to) return setStatus("Invalid 'To' address.");
      const amtStr = $("wDfAmt").value.trim();
      if (!amtStr) return setStatus("Enter DF amount.");

      const amt = ethers.utils.parseUnits(amtStr, 18);

      setStatus("Withdrawing DF from Staking...");
      const tx = await staking.ownerWithdrawDF(to, amt);
      await tx.wait();
      setStatus("Withdraw DF success ✅");
      await refresh();
    }catch(e){
      setStatus(`Withdraw DF failed: ${e?.error?.message || e?.data?.message || e?.message || e}`);
    }
  }

  async function setTreasury(){
    try{
      const t = toAddr($("newTreasury").value.trim());
      if (!t) return setStatus("Invalid treasury address.");

      setStatus("Setting Core treasury...");
      const tx = await core.setTreasury(t);
      await tx.wait();
      setStatus("Treasury updated ✅");
      await refresh();
    }catch(e){
      setStatus(`Set treasury failed: ${e?.error?.message || e?.data?.message || e?.message || e}`);
    }
  }

  // Bind
  window.addEventListener("DOMContentLoaded", () => {
    $("btnConnect").addEventListener("click", connect);
    $("btnRefresh").addEventListener("click", refresh);
    $("btnWUsdt").addEventListener("click", withdrawVaultUSDT);
    $("btnWDf").addEventListener("click", withdrawStakingDF);
    $("btnSetTreasury").addEventListener("click", setTreasury);

    // default disabled until connect
    $("btnRefresh").disabled = true;
    $("btnWUsdt").disabled = true;
    $("btnWDf").disabled = true;
    $("btnSetTreasury").disabled = true;
  });
})();
