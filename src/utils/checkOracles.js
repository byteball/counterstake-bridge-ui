import { message } from "antd";

import socket from "services/socket";

export const checkOracles = async (
  {
    oracle1,
    feed_name1,
    op1,
    oracle2,
    feed_name2,
    op2,
    oracle3,
    feed_name3,
    op3 }
) => {
  let price = 1;
  if (oracle1 && feed_name1 && op1) {
    try {
      const data_feed = await socket.api.getDataFeed({
        oracles: [oracle1],
        feed_name: feed_name1,
        ifnone: "none",
      });
      if (data_feed !== "none") {
        price = price * (op1 === "/" ? 1 / data_feed : data_feed);
      } else {
        message.error("Oracle 1 is not found!");
        return false;
      }
    } catch {
      message.error("Oracle 1 is not found!");
      return false;
    }
  } else if (oracle1 || feed_name1) {
    message.error("Not all data for oracle 1 is specified!");
    return false;
  }

  if (oracle2 && feed_name2 && op2) {
    try {
      const data_feed = await socket.api.getDataFeed({
        oracles: [oracle2],
        feed_name: feed_name2,
        ifnone: "none",
      });
      if (data_feed !== "none") {
        price = price * (op2 === "/" ? 1 / data_feed : data_feed);
      } else {
        message.error("Oracle 2 is not found!");
        return false;
      }
    } catch (e) {
      message.error("Oracle 2 is not found!");
      return false;
    }
  } else if (oracle2 || feed_name2) {
    message.error("Not all data for oracle 2 is specified!");
    return false;
  }

  if (oracle3 && feed_name3 && op3) {
    try {
      const data_feed = await socket.api.getDataFeed({
        oracles: [oracle3],
        feed_name: feed_name3,
        ifnone: "none",
      });
      if (data_feed !== "none") {
        price = price * (op3 === "/" ? 1 / data_feed : data_feed);
      } else {
        message.error("Oracle 3 is not found!");
        return false;
      }
    } catch (e) {
      message.error("Oracle 3 is not found!");
      return false;
    }
  } else if (oracle3 || feed_name3) {
    message.error("Not all data for oracle 3 is specified!");
    return false;
  }

  message.success(`Price: ${price}`);
  return true;
}