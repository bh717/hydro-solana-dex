import { useState, useEffect } from "react";

import { Asset } from "../../interfaces";
import USDC from "../../assets/images/symbols/usdc.png";
import BNB from "../../assets/images/symbols/bnb.png";
import HYSD from "../../assets/images/symbols/hysd.png";

const useSwap = () => {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const tempAssets = [
      {
        icon: USDC,
        symbol: "USDC",
        balance: 21567.2401,
      },
      {
        icon: BNB,
        symbol: "BNB",
        balance: 1567980.2401,
      },
      {
        icon: HYSD,
        symbol: "HYSD",
        balance: 2012115.2401,
      },
    ];

    setAssets(tempAssets);
  }, [setAssets]);

  return {
    assets,
  };
};

export default useSwap;
