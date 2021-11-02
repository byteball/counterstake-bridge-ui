import { Button, Modal } from "antd"
import { descOfManagers } from "pages/Assistants/descOfManagers";
import { useState } from "react"
import { getExplorerLink } from "utils/getExplorerLink";

export const AssistantManagerModal = ({ children, network, manager }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleOpen = (e) => {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
    setIsVisible(true);
  }

  const handleClose = (e) => {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
    setIsVisible(false);
  }

  const explorerLink = getExplorerLink(network, manager, "address")

  const { name, desc } = (descOfManagers[manager] || {});

  return <div onClick={(e) => {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
  }}>
    <Button type="link" onClick={handleOpen} className="evmHashOrAddress" style={{ padding: 0 }}>
      {children}
    </Button>
    <Modal visible={isVisible} onCancel={handleClose} footer={null}>
      {name && <div><b>{name}</b></div>}
      
      <div>
        Address: <a href={explorerLink} target="_blank" className="evmHashOrAddress">{manager}</a>
      </div>

      <div>{desc || <span style={{ opacity: .5 }}>No description</span>}</div>
    </Modal>
  </div>
}