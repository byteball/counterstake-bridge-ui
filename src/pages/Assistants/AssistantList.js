import { Spin, Typography } from "antd";
import { useSelector } from "react-redux";

import { selectAssistants } from "store/assistantsSlice"
import { selectDirections } from "store/directionsSlice";
import { selectSortType } from "store/settingsSlice";
import { AssistantFiltersAndSort } from "./AssistantFiltersAndSort";
import { AssistantItem } from "./AssistantItem";
import { useAssistantsFilterAndSort } from "./hook/useAssistantsFilterAndSort";
import { getAssistantLabel } from "./helpers/getAssistantLabel";
import { useMoveToAssistant } from "./hook/useMoveToAssistant";

const { Title } = Typography;

export const AssistantList = () => {
  const assistants = useSelector(selectAssistants);
  const directions = useSelector(selectDirections);
  const sortingType = useSelector(selectSortType);
  const filteredAssistants = useAssistantsFilterAndSort(assistants);

  useMoveToAssistant(assistants);

  if (assistants.length === 0) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: 50, flexDirection: "column" }}>
    <Spin size="large" style={{ transform: "scale(1.5)" }} />
    <div style={{ padding: 10, fontSize: 16 }}>Loading...</div>
  </div>

  return <div style={{ marginTop: 40 }}>
    <AssistantFiltersAndSort />

    {filteredAssistants.map(({ bridge_aa, ...info }, index) => {
      const direction = directions[directions[bridge_aa]?.dst_bridge_aa];
      const lastAssistant = filteredAssistants[index - 1];
      return <div key={info.assistant_aa}>
        {(sortingType !== "bridge" || !lastAssistant || lastAssistant.bridge_aa !== bridge_aa) && <Title level={4}>{getAssistantLabel(direction)}</Title>}
        <AssistantItem {...info} />
      </div>
    })}
  </div>
}
