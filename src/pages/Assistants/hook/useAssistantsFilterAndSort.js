import { flattenDepth, groupBy } from "lodash";
import { useEffect, useState } from "react"
import { useSelector } from "react-redux";

import { selectFilters, selectSortType } from "store/settingsSlice";

export const useAssistantsFilterAndSort = (assistants) => {
  const filters = useSelector(selectFilters);
  const [filteredAndSortedAssistants, setFilteredAndSortedAssistants] = useState([]);
  const sortingType = useSelector(selectSortType);

  useEffect(() => {
    const filtersByType = groupBy(filters, "type");

    const filteredAssistants = assistants.map(([bridge, assistantsByBridge]) => {
      const filteredAssistantsByBridge = assistantsByBridge.filter((a) => {
        if (
          (filtersByType.manager ? filtersByType.manager.find((f) => f.value === a.manager) : true) &&
          (filtersByType.side ? filtersByType.side.find((f) => f.value === a.side) : true) &&
          (filtersByType.network ? filtersByType.network.find((f) => f.value === a.network) : true) &&
          (filtersByType.home_asset ? filtersByType.home_asset.find((f) => {
            const [address, network] = f.value.split("_");
            return (address === a.home_asset) && (!network || network === a.home_network)
          }) : true)
        ) {
          return true;
        } else {
          if (Object.keys(filtersByType).length === 0) {
            return true;
          }
          return false;
        }
      })
      return [bridge, filteredAssistantsByBridge]
    });

    let sortedAssistants = filteredAssistants;

    sortedAssistants = flattenDepth(filteredAssistants.map(([_, assistantsByBridge], i) => assistantsByBridge));
    sortedAssistants.sort(getSortFunc(sortingType));

    setFilteredAndSortedAssistants(sortedAssistants);
  }, [assistants, filters, setFilteredAndSortedAssistants, sortingType]);

  return filteredAndSortedAssistants;
}

const getSortFunc = (type = 'balance') => {
  switch (type) {
    case 'bridge':
      return (a, b) => b.bridge === a.bridge ? 0 : -1;
    case 'apy':
      return (a, b) => (b.APY || 0) - (a.APY || 0);
    case 'balance':
      return (a, b) => (b.totalBalanceInUSD || 0) - (a.totalBalanceInUSD || 0)
    default:
      return (a, b) => (b.totalBalanceInUSD || 0) - (a.totalBalanceInUSD || 0);
  }
}
