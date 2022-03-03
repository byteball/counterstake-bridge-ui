import { CheckCircleOutlined } from "@ant-design/icons";
import { Button, Result } from "antd"
import { useDispatch } from "react-redux"

import { removeCreationOrder } from "store/settingsSlice";

export const SuccessfulStep = () => {
  const dispatch = useDispatch();
  return <Result
    title="Bridge created successfully"
    icon={<CheckCircleOutlined style={{ color: "#fff" }} />}
    extra={<Button type="primary" onClick={() => dispatch(removeCreationOrder({ orderType: "bridge" }))}>Back to creation form</Button>}
  />
}
