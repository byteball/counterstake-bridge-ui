import obyte from "services/socket";

export const getOraclePrice = async (
  oracles,
  showOracles = false
) => {
  let oracleValue1, oracleValue2, oracleValue3;
  if (oracles[0]) {
    oracleValue1 = await obyte.api.getDataFeed({
      oracles: [oracles[0].oracle],
      feed_name: oracles[0].feed_name,
      ifnone: "none",
    });
  }
  if (oracles[1]) {
    oracleValue2 = await obyte.api.getDataFeed({
      oracles: [oracles[1].oracle],
      feed_name: oracles[1].feed_name,
      ifnone: "none",
    });
  }
  if (oracles[2]) {
    oracleValue3 = await obyte.api.getDataFeed({
      oracles: [oracles[2].oracle],
      feed_name: oracles[2].feed_name,
      ifnone: "none",
    });
  }

  const oraclesValues = [oracleValue1, oracleValue2, oracleValue3].filter(
    (v) => !!v
  );

  const price = oraclesValues.reduce((price, current, index) => {
    return oracles[index].op === "*"
      ? price * current
      : price / current;
  }, 1);

  if (showOracles) {
    return [price, oracleValue1, oracleValue2, oracleValue3];
  } else {
    return price;
  }
};