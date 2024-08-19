export const getDirectionsByBridgesInfo = (bridges = []) => {
    const directions = {};

    for (const { bridge_id, home_network, home_asset, stake_asset, home_asset_decimals, home_symbol, export_aa, foreign_network, foreign_asset, foreign_asset_decimals, foreign_symbol, import_aa } of bridges) {
        const home_token = { network: home_network, asset: home_asset, decimals: home_asset_decimals, symbol: home_symbol, home_network };
        const foreign_token = { network: foreign_network, asset: foreign_asset, decimals: foreign_asset_decimals, symbol: foreign_symbol, home_network };

        if (!foreign_symbol) continue;

        directions[export_aa] = {
            bridge_id,
            type: 'expatriation',
            src_bridge_aa: export_aa,
            dst_bridge_aa: import_aa,
            src_token: home_token,
            dst_token: foreign_token,
            stake_asset,
            home_asset,
            home_network,
            home_symbol
        };

        directions[import_aa] = {
            bridge_id,
            type: 'repatriation',
            src_bridge_aa: import_aa,
            dst_bridge_aa: export_aa,
            src_token: foreign_token,
            dst_token: home_token,
            stake_asset,
            home_asset,
            home_network,
            home_symbol
        };
    }

    return directions;
}
