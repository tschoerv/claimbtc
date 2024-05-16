"use client";
import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Head from 'next/head';
import { Button, Input, Link } from "@nextui-org/react";
import '@rainbow-me/rainbowkit/styles.css';
import { reconnect } from '@wagmi/core'
import { injected } from '@wagmi/connectors'
import { config } from './providers'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWriteContract, useSwitchChain, useSimulateContract, useAccount, useReadContract } from "wagmi";

import round1_whitelist from "./ABI/ROUND1-WHITELIST.json";
import claim_contract_ABI from "./ABI/claim_contract_ABI.json";

export default function Home() {
  const [isEligible, setIsEligible] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [userData, setUserData] = useState(null);
  const [manualAddress, setManualAddress] = useState("");
  const [manualCheck, setManualCheck] = useState(false);

  useEffect(() => {
    reconnect(config, { connectors: [injected()] });
  }, []);

  const claim_contract_address = process.env.NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS;

  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const desiredNetworkId = 1;

  const handleSwitchChain = () => {
    switchChain({ chainId: desiredNetworkId });
  };

  useEffect(() => {
    if (isConnected && address) {
      const user = round1_whitelist.find(user => user.address.toLowerCase() === address.toLowerCase());
      if (user) {
        setIsEligible(true);
        setUserData(user);
      } else {
        setIsEligible(false);
        setUserData(null);
      }
    }
  }, [address, isConnected]);

  const handleManualCheck = () => {
    const user = round1_whitelist.find(user => user.address.toLowerCase() === manualAddress.toLowerCase());
    if (user) {
      setIsEligible(true);
      setUserData(user);
      setManualCheck(true);
    } else {
      setIsEligible(false);
      setUserData(null);
      setManualCheck(true);
    }
  };

  const { data: readHasClaimed, isSuccess: isSuccessReadHasClaimed } = useReadContract({
    address: claim_contract_address,
    abi: claim_contract_ABI,
    functionName: 'claimedByWallet',
    args: [address]
  });

  useEffect(() => {
    if (isSuccessReadHasClaimed && readHasClaimed !== undefined) {
      setHasClaimed(parseInt(readHasClaimed) > 0);
    }
  }, [readHasClaimed, isSuccessReadHasClaimed]);

  const formatProof = (proof) => {
    if (!Array.isArray(proof)) return [];
    return proof.map(p => `0x${p}`);
  };

  const { data: simulateClaimAirdrop, error: simulateError } = useSimulateContract({
    address: claim_contract_address,
    abi: claim_contract_ABI,
    functionName: 'claim',
    args: userData ? [address, userData.amount, formatProof(userData.proof.split(','))] : undefined,
    account: address,
    enabled: !!userData
  });

  const { write: claimAirdrop } = useWriteContract();

  const handleClaim = () => {
    if (isEligible && !hasClaimed && simulateClaimAirdrop) {
      claimAirdrop({
        args: [address, userData.amount, formatProof(userData.proof.split(','))],
        address: claim_contract_address,
        abi: claim_contract_ABI,
        functionName: 'claim'
      });
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Claim $btc</title>
      </Head>
      <Link href={`https://www.firsterc20memecoin.com/`} isExternal>
        <Image
          src="/bitcoin_logo.png"
          width={400}
          height={400}
          alt="bitcoin logo"
        />
      </Link>
      <h1 className='text-3xl mt-4'>Airdrop Round 1</h1>
      <div className="text-center mt-4">
        {chain?.id !== desiredNetworkId && isConnected ? (
          <Button variant="solid" color="danger" onClick={handleSwitchChain}>Switch to Mainnet</Button>
        ) : (
          <ConnectButton chainStatus="none" showBalance={false} />
        )}
      </div>
      <div className="text-center mt-4">
        {isConnected ? (
          hasClaimed ? (
            <p>You&apos;ve already claimed your airdrop!</p>
          ) : (
            isEligible ? (
              <p>Congrats! You&apos;re eligible to claim {userData.amount} $btc</p>
            ) : (
              <p>You&apos;re not eligible for an airdrop</p>
            )
          )
        ) : (
          <>
            <p>Please connect your wallet or manually check an address:</p>
            <div className="mt-1 flex flex-col items-center">
              <Input
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="Enter address"
                className="mb-4"
                variant={'bordered'}
              />
              <Button variant="solid" onClick={handleManualCheck}>Check Eligibility</Button>
            </div>
          </>
        )}
      </div>
      {manualCheck && !isConnected && (
        <div className="text-center mt-4">
          {isEligible ? (
            <p className="text-green-800">Congrats! The entered address is eligible to claim {userData.amount} $btc</p>
          ) : (
            <p className="text-red-800">The entered address is not eligible for an airdrop</p>
          )}
        </div>
      )}
      {isConnected && <Button
        variant="solid"
        isDisabled={!isEligible || hasClaimed}
        onClick={handleClaim}
        className="mt-4"
      >
        Claim
      </Button>}
    </main>
  );
}
