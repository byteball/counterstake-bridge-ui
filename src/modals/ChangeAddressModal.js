import { Modal, Input, Button, Form, message, Space } from "antd";
import { useDispatch } from "react-redux";
import { useState, useRef, useEffect } from "react";
import obyte from "obyte";
import { ethers } from "ethers";

import { chainIds } from "chainIds";
import { ReactComponent as MetamaskLogo } from "pages/Main/metamask-fox.svg";
import { setDestAddress } from "store/destAddressSlice";
import config from "appConfig";

const environment = config.ENVIRONMENT;

export const ChangeAddressModal = ({ network, children, action = "Add", currentAddress }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [address, setAddress] = useState({});
  const dispatch = useDispatch();
  const refBtn = useRef();

  const provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);
  const signer = window.ethereum && provider.getSigner();

  useEffect(() => {
    setAddress(currentAddress ? { value: currentAddress, valid: true } : {})
  }, [isModalVisible]);

  const loginEthereum = async () => {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  };

  const handleAddressChange = (value) => {
    const valid = isValidAddress(value);
    setAddress({ value, valid });
  };

  const isValidAddress = value => {
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

  const insertAddress = async () => {
    if (!window.ethereum)
      return setAddress({})
    const accounts = await provider.listAccounts();

    if (accounts.length === 0)
      return console.log('no accounts yet');

    const value = await signer.getAddress();

    setAddress({ value, valid: isValidAddress(value) });
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
          <Button type="primary" ref={refBtn} disabled={!address.valid || currentAddress === address.value} onClick={() => {
            dispatch(setDestAddress({ address: address.value, network }));
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
              address.valid !== undefined
                ? address.valid
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
              value={address.value}
              autoFocus={true}
              placeholder={`Your ${network} wallet address`}
              onKeyPress={(ev) => {
                if (ev.key === "Enter" && address.valid) {
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
                    await insertAddress();
                  }}
                />}
              onChange={(ev) => handleAddressChange(ev.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}