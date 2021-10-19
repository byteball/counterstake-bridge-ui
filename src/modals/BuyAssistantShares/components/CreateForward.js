import { LoadingOutlined } from "@ant-design/icons";
import { Result, Button } from "antd"
import { generateLink } from "utils";

export const CreateForward = ({ assistant_aa, forward_status }) => {

  let createLink;

  if (forward_status !== "stabilization"){
    createLink = generateLink({
      amount: 1e4,
      data: {
        create: 1,
        assistant: assistant_aa
      },
      aa: process.env.REACT_APP_IMPORT_FROWARD_FACTORY
    });
  }

  return forward_status === "stabilization" ?
    <Result
      title="Create a forwarding AA"
      icon={forward_status === "stabilization" && <LoadingOutlined />}
      subTitle="We have received a request to create and are waiting for its stabilization"
    /> :
    <Result
      title="Create a forwarding AA"
      subTitle="In order to buy shares, you need to first create a “forward AA”, anyone can do this"
      extra={
        <Button type="primary" key="createLink" href={createLink}>
          Create
        </Button>
      }
    />
}