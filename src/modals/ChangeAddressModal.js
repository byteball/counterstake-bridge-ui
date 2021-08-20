import { Modal, Input, Button, Form, message, Space } from "antd";
import { useDispatch } from "react-redux";
import { useState, useRef, useEffect } from "react";
import obyte from "obyte";
import { ethers } from "ethers";

import { chainIds } from "chainIds";
import { ReactComponent as MetamaskLogo } from "pages/Main/metamask-fox.svg";
import { setDestAddress } from "store/destAddressSlice";

const environment = process.env.REACT_APP_ENVIRONMENT;

export const ChangeAddressModal = ({ network, children, action = "Add", currentAddress }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [recipient, setRecipient] = useState({});
  const dispatch = useDispatch();
  const refBtn = useRef();

  const provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);
  const signer = window.ethereum && provider.getSigner();

  useEffect(() => {
    setRecipient(currentAddress ? { value: currentAddress, valid: true } : {})
  }, [isModalVisible]);

  const loginEthereum = async () => {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  };

  const handleRecipientChange = (value) => {
    const valid = isValidRecipient(value);
    setRecipient({ value, valid });
  };

  const isValidRecipient = value => {
    if (!network || !value)
      return undefined;

    if (network === "Obyte") {
      return obyte.utils.isValidAddress(value);
    } else if (Object.keys(chainIds[environment]).includes(network)) {
      try {
        return ethers.utils.getAddress(value) === value;
      }
      catch (e) {
        return false;
      }
    } else {
      return false
    }
  };

  const insertRecipientAddress = async () => {
    if (!window.ethereum)
      return setRecipient({})
    const accounts = await provider.listAccounts();

    if (accounts.length === 0)
      return console.log('no accounts yet');

    const value = await signer.getAddress();

    setRecipient({ value, valid: isValidRecipient(value) });
  };

  return (
    <>
      <Button type="link" style={{ padding: 0, height: "auto" }} onClick={() => setIsModalVisible(true)}>
        {children}
      </Button>
      <Modal
        visible={isModalVisible}
        title={`${network} address`}
        destroyOnClose={true}
        footer={<Space>
          <Button type="primary" ref={refBtn} disabled={!recipient.valid || currentAddress === recipient.value} onClick={() => {
            dispatch(setDestAddress({ address: recipient.value, network }));
            setIsModalVisible(false);
          }}>
            {action}
          </Button>
          <Button type="primary" onClick={() => setIsModalVisible(false)}>Close</Button>
        </Space>}
        onCancel={() => setIsModalVisible(false)}>
        <Form>
          <Form.Item
            hasFeedback
            style={{ width: "100%", marginTop: 20 }}
            extra={network && network === 'Obyte' &&
              <span>
                <a
                  href="https://obyte.org/#download"
                  target="_blank"
                  rel="noopener"
                >
                  Install Obyte wallet
                </a> {" "}
                if you don't have one yet, and copy/paste your address here.
              </span>
            }
            validateStatus={
              recipient.valid !== undefined
                ? recipient.valid
                  ? "success"
                  : "error"
                : undefined
            }
          >
            <Input
              size="middle"
              className="evmHashOrAddress"
              style={{ height: 45, paddingRight: 30 }}
              spellCheck="false"
              value={recipient.value}
              autoFocus={true}
              placeholder={`Your ${network} wallet address`}
              onKeyPress={(ev) => {
                if (ev.key === "Enter" && recipient.valid) {
                  refBtn.current.click();
                }
              }}
              prefix={network && network !== 'Obyte' &&
                <MetamaskLogo
                  style={{ cursor: "pointer", marginRight: 5 }}
                  onClick={async () => {
                    if (!window.ethereum)
                      return message.error("MetaMask not found")
                    await loginEthereum();
                    await insertRecipientAddress();
                  }}
                />}
              onChange={(ev) => handleRecipientChange(ev.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}