import React, { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Col, Row, Button, Select, Form, Input, Typography } from "antd";

import { ethers } from "ethers";

import styles from "./MainPage.module.css";

const { Title, Paragraph, Text } = Typography;

const erc20Abi = [
  "function allowance(address owner, address spender) public view virtual override returns (uint256)",
  "function approve(address spender, uint256 amount) public virtual override returns (bool)",
  "function balanceOf(address account) public view virtual override returns (uint256)",
];


const MAX_UINT256 = ethers.BigNumber.from(2).pow(256).sub(1);


export const MainPage = () => {


  const provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);
  const signer = window.ethereum && provider.getSigner();


  

  return (
    <div className={styles.container}>
      <Helmet title="Counterstake Bridge" />
      <Title level={1}>Counterstake Bridge :alpha:</Title>
      <Paragraph>This is new, untested, unaudited software, use with care.</Paragraph>

      

      <Button
        type="primary"
        size="large"
        onClick={async () => {
          const assistantAbi = [
            "function buyShares(uint stake_asset_amount) payable external",
            "function redeemShares(uint shares_amount) external",
          ];
          const assistantAddress = '0x841Bea53B01A8159B0e62796865374beAae62a5b'; // DAI
          const tokenAddress = '0xB554fCeDb8E4E0DFDebbE7e58Ee566437A19bfB2'; // DAI
          const assistantContract = new ethers.Contract(assistantAddress, assistantAbi, signer);
          //const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
          //const approval_res = await tokenContract.approve(assistantAddress, MAX_UINT256);
          const amount = ethers.utils.parseEther('30');
          const res = await assistantContract.buyShares(amount, { value: 0 });
        }}
      >
        Buy DAI EA shares
      </Button>

      <Button
        type="primary"
        size="large"
        onClick={async () => {
          const assistantAbi = [
            "function buyShares(uint stake_asset_amount, uint image_asset_amount) payable external",
            "function redeemShares(uint shares_amount) external",
          ];
          const assistantAddress = '0x87FFb72168d01E2465D1AF99682c145868aDE5d2';
          const tokenAddress = '0x05e3a36b4Fd66a212df1D9F5a2a9258Cbb6D1Aab';
          const assistantContract = new ethers.Contract(assistantAddress, assistantAbi, signer);
          const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
          const approval_res = await tokenContract.approve(assistantAddress, MAX_UINT256);
          const stake_amount = ethers.utils.parseEther('1');
          const image_amount = ethers.utils.parseEther('50');
          const res = await assistantContract.buyShares(stake_amount, image_amount, { value: stake_amount });
        }}
      >
        Buy GBYTE IA shares
      </Button>

    </div>
  );
};
