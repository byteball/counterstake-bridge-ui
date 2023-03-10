import { Button, Modal, Select } from "antd"
import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { ethers } from "ethers";
import { FilterOutlined } from "@ant-design/icons";

import { chainIds } from "chainIds";
import { selectHomeTokens, selectManagers } from "store/assistantsSlice";
import { descOfManagers } from "pages/Assistants/descOfManagers";
import { selectFilters } from "store/settingsSlice";
import config from "appConfig";

const environment = config.ENVIRONMENT;

export const AssistantFiltersModal = ({ removeFilter, addFilter = () => { } }) => {
  const [isVisible, setIsVisible] = useState(false);
  const refs = useRef([]);
  
  const managers = useSelector(selectManagers);
  const homeTokens = useSelector(selectHomeTokens);
  const filters = useSelector(selectFilters);

  const handleOpen = () => {
    setIsVisible(true);
  }

  const handleClose = () => {
    setIsVisible(false);
  }

  return <>
    <Button onClick={handleOpen} icon={<FilterOutlined />}>
      Edit filters
    </Button>
    <Modal visible={isVisible} onCancel={handleClose} footer={null} title="Filters">
      <div><b>Side:</b></div>
      <Select mode="multiple" ref={el => refs.current[0] = el} value={filters.filter((f) => f.type === "side").map(({ value }) => value)} style={{ width: "100%" }} placeholder="Select a side" onChange={(all) => { filters.filter((f) => f.type === "side").length < all.length ? addFilter({ type: "side", value: all[all.length - 1] }) : removeFilter(filters.filter((f) => f.type === "side" && !all.includes(f.value))?.[0]); refs.current[0]?.blur(); }}>
        <Select.Option value="export">Export</Select.Option>
        <Select.Option value="import">Import</Select.Option>
      </Select>

      <div style={{ marginTop: 20 }}><b>Network:</b></div>
      <Select mode="multiple" ref={el => refs.current[1] = el} value={filters.filter((f) => f.type === "network").map(({ value }) => value)} style={{ width: "100%" }} placeholder="Select a network" onChange={(all) => { filters.filter((f) => f.type === "network").length < all.length ? addFilter({ type: "network", value: all[all.length - 1] }) : removeFilter(filters.filter((f) => f.type === "network" && !all.includes(f.value))?.[0]); refs.current[1]?.blur(); }}>
        <Select.Option key="network-Obyte" value="Obyte">Obyte</Select.Option>
        {Object.keys(chainIds[environment]).map((network, i) => <Select.Option key={"network-" + network} value={network}>{network}</Select.Option>)}
      </Select>

      <div style={{ marginTop: 20 }}><b>Manager:</b></div>
      <Select mode="multiple" ref={el => refs.current[2] = el} value={filters.filter((f) => f.type === "manager").map(({ value }) => value)} style={{ width: "100%" }} placeholder="Select a manager" onChange={(all) => { filters.filter((f) => f.type === "manager").length < all.length ? addFilter({ type: "manager", value: all[all.length - 1] }) : removeFilter(filters.filter((f) => f.type === "manager" && !all.includes(f.value))?.[0]); refs.current[2]?.blur(); }}>
        {managers.map((manager, i) => <Select.Option key={"manager" + manager} value={manager}>{manager in descOfManagers ? descOfManagers[manager].name : manager}</Select.Option>)}
      </Select>
 
      <div style={{ marginTop: 20 }}><b>Token:</b></div>
      <Select optionFilterProp="label" mode="multiple" ref={el => refs.current[3] = el} value={filters.filter((f) => f.type === "home_asset").map(({ value }) => value)} style={{ width: "100%" }} placeholder="Select a token" onChange={(all) => { filters.filter((f) => f.type === "home_asset").length < all.length ? addFilter({ type: "home_asset", value: all[all.length - 1] }) : removeFilter(filters.filter((f) => f.type === "home_asset" && !all.includes(f.value))?.[0]); refs.current[2]?.blur(); }}>
        <Select.Option key="MATIC-ADDRESS" value={ethers.constants.AddressZero + "_Polygon"}>MATIC</Select.Option>
        <Select.Option key="ETH-ADDRESS" value={ethers.constants.AddressZero + "_Ethereum"}>ETH</Select.Option>
        <Select.Option key="BNB-ADDRESS" value={ethers.constants.AddressZero + "_BSC"}>BNB</Select.Option>
        <Select.Option key="KAVA-ADDRESS" value={ethers.constants.AddressZero + "_KAVA"}>KAVA</Select.Option>
        {Object.keys(homeTokens).filter((a) => a !== ethers.constants.AddressZero).map((home_token_asset, i) => <Select.Option key={"token" + home_token_asset} value={home_token_asset} label={homeTokens[home_token_asset]}>{homeTokens[home_token_asset]}</Select.Option>)}
      </Select>
    </Modal>
  </>
}