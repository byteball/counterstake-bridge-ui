import { providers } from "services/evm";

export const isContract = async (address, network) => {
    const provider = providers[network];
    if (!provider) throw Error(`unknown network`, network);

    try {
        const code = await provider.getCode(address);
        return code !== '0x';
    } catch (e) {
        return false;
    }
}