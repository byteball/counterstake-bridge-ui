import { Col, Row, Tag, Form, Select, message } from "antd"
import { isEqual } from "lodash";
import { useDispatch, useSelector } from "react-redux";

import { AssistantsFiltersModal } from "modals/AssistantsFiltersModal/AssistantsFiltersModal"
import { nativeSymbols } from "nativeSymbols";
import { selectHomeTokens } from "store/assistantsSlice";
import { selectSortType, setAssistantsSort, addFilter as addFilterInStore, removeFilter as removeFilterInStore, selectFilters } from "store/settingsSlice";
import { descOfAssistants } from "./descOfAssistants";


export const AssistantFiltersAndSort = () => {
  const sortType = useSelector(selectSortType);
  const homeTokens = useSelector(selectHomeTokens);
  const filters = useSelector(selectFilters);

  const dispatch = useDispatch();

  const addFilter = (filter) => {
    if (filter?.value) {
      if (!filters.find(f => isEqual(f, filter))) {
        dispatch(addFilterInStore(filter))
      } else {
        message.error("Such a filter already exists", 2)
      }
    }
  }

  const removeFilter = (filter) => {
    dispatch(removeFilterInStore(filter));
  };

  return <Row style={{ marginBottom: 35 }}>
    <Col lg={{ span: 18 }} sm={{ span: 16 }} xs={{ span: 24 }}>
      <AssistantsFiltersModal addFilter={addFilter} removeFilter={removeFilter} />
      <div style={{ paddingTop: 10, paddingBottom: 10 }}>
        {filters.length > 0 && <>
          {filters.map(({ value, type }) => <Tag key={type + value} style={{ marginBottom: 5 }} closable onClose={() => removeFilter({ value, type })}>{type.replace("_asset", " token")}: {type === "manager" ? (value in descOfAssistants ? descOfAssistants[value].name : value) : (type === "home_asset" ? nativeSymbols[value.split("_")[1]] || homeTokens[value.split("_")[0]] || value.split("_")[0] : value)}</Tag>)}
        </>}
      </div>
    </Col>
    <Col lg={{ span: 6 }} sm={{ span: 8 }} xs={{ span: 24 }}>
      <Form>
        <Form.Item label="Sort by">
          <Select style={{ width: "100%" }} value={sortType} onChange={(type) => { dispatch(setAssistantsSort(type)) }}>
            <Select.Option value="bridge">Bridge</Select.Option>
            <Select.Option value="apy">APY</Select.Option>
            <Select.Option value="balance">Dollar balance</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Col>
  </Row>
}