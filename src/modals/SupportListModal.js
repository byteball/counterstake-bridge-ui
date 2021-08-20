import { Modal, List, Button } from "antd";
import { useState } from "react";

import { getExplorerLink } from "utils/getExplorerLink";

export const SupportListModal = ({ decimals, symbol, supportList, sum, bridge_network }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  if (!supportList || bridge_network !== "Obyte") return <div>{sum} {symbol}</div>
  
  return (
    <>
      <Button type="link" style={{ padding: 0, height: "auto" }} onClick={() => setIsModalVisible(true)}>
        {sum} {symbol}
      </Button>
      <Modal
        visible={isModalVisible}
        title="Supporters"
        footer={<Button type="primary" onClick={() => setIsModalVisible(false)}>Close</Button>}
        onCancel={() => setIsModalVisible(false)}>
        <List
          dataSource={supportList.slice().sort((a, b) => b.support - a.support)}
          renderItem={(item) => (<List.Item.Meta
            style={{ marginBottom: 10 }}
            title={<a target="_blank" rel="noopener" href={getExplorerLink(bridge_network, item.address, "address")}>{item.address}</a>}
            description={<>{item.support / 10 ** decimals} {symbol}</>} />)}
        />
      </Modal>
    </>
  )
}