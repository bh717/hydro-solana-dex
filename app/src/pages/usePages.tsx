import { useState, useEffect } from 'react';

import { Asset } from '../interfaces';
import HYSD from '../assets/images/symbols/hysd.png';
import SOL from '../assets/images/symbols/sol.png';
import USDD from '../assets/images/symbols/usdd.png';

const usePages = () => {
    const [assets, setAssets] = useState<Asset[]>([]);

    useEffect(() => {
        const tempAssets = [
            {
                icon: HYSD,
                symbol: 'HYSD',
                balance: 0
            },
            {
                icon: SOL,
                symbol: 'SOL',
                balance: 0
            },
            {
                icon: USDD,
                symbol: 'USDD',
                balance: 0
            }
        ];

        setAssets(tempAssets);
    }, [setAssets]);

    return {
        assets
    }
}

export default usePages;