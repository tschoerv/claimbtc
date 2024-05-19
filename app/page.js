"use client";
import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Head from 'next/head';
import { Button, Input, Link } from "@nextui-org/react";
import '@rainbow-me/rainbowkit/styles.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWriteContract, useSwitchChain, useSimulateContract, useAccount, useReadContract } from "wagmi";

import round2_whitelist from "./ABI/ROUND2-WHITELIST.json";
import claim_contract_ABI from "./ABI/claim_contract_ABI.json";

export default function Home() {
  const [isEligible, setIsEligible] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [userData, setUserData] = useState(null);
  const [manualAddress, setManualAddress] = useState("");
  const [manualCheck, setManualCheck] = useState(false);
  const [checkTriggered, setCheckTriggered] = useState(false);

  const claim_contract_address = process.env.NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS;

  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const desiredNetworkId = 1;

  const handleSwitchChain = () => {
    switchChain({ chainId: desiredNetworkId });
  };

  useEffect(() => {
    if (isConnected && address) {
      const user = round2_whitelist.find(user => user.address.toLowerCase() === address.toLowerCase());
      if (user) {
        setIsEligible(true);
        setUserData(user);
      } else {
        setIsEligible(false);
        setUserData(null);
      }
      setManualAddress(address);  // Preset the connected address in the input field
    }
  }, [address, isConnected]);

  const handleManualCheck = () => {
    const user = round2_whitelist.find(user => user.address.toLowerCase() === manualAddress.toLowerCase());
    if (user) {
      setIsEligible(true);
      setUserData(user);
    } else {
      setIsEligible(false);
      setUserData(null);
      setHasClaimed(false);  // Reset the claimed status
    }
    setManualCheck(true);
    setCheckTriggered(true);
  };

  const { data: readHasClaimed, isSuccess: isSuccessReadHasClaimed } = useReadContract({
    address: claim_contract_address,
    abi: claim_contract_ABI,
    functionName: 'claimedByWallet',
    args: [manualAddress],
  });

  useEffect(() => {
    if (checkTriggered && isConnected && isSuccessReadHasClaimed && readHasClaimed !== undefined) {
      setHasClaimed(parseInt(readHasClaimed) > 1);
      setCheckTriggered(false); // Reset the check trigger after the check is completed
    }
  }, [readHasClaimed, isSuccessReadHasClaimed, checkTriggered, isConnected]);

  const formatProof = (proof) => {
    if (!Array.isArray(proof)) return [];
    return proof.map(p => `${p}`);
  };

  const { data: simulateClaimAirdrop } = useSimulateContract({
    address: claim_contract_address,
    abi: claim_contract_ABI,
    functionName: 'claim',
    args: userData ? [manualAddress, userData.amount, formatProof(userData.proof.split(','))] : undefined,
    account: address,
  });

  const { writeContract: claimAirdrop } = useWriteContract();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Claim $btc</title>
      </Head>
      <Link href={`https://www.firsterc20memecoin.com/`} isExternal>
        <Image
          src="/bitcoin_logo.png"
          width={350}
          height={350}
          alt="bitcoin logo"
        />
      </Link>
      <h1 className='text-3xl mt-4'>Airdrop Round 2</h1>
      <div className="text-center mt-4">
        {chain?.id !== desiredNetworkId && isConnected ? (
          <Button variant="solid" color="danger" onClick={handleSwitchChain}>Switch to Mainnet</Button>
        ) : (
          <ConnectButton chainStatus="none" showBalance={false} />
        )}
      </div>
      <div className="text-center mt-4">
        {isConnected ? (
          <>
            <div className="mt-1 flex flex-col items-center">
              <Input
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="Enter address"
                className="mb-2 w-[22rem]"
                variant={'bordered'}
                label="Receiver Address:"
              />
              {manualCheck && (
                hasClaimed ? (
                  <p>You&apos;ve already claimed your airdrop!</p>
                ) : (
                  isEligible ? (
                    <p className="text-green-800">Congrats! You&apos;re eligible to claim {userData.amount} $btc</p>
                  ) : (
                    <p className="text-red-800">You&apos;re not eligible for an airdrop</p>
                  )
                )
              )}
              <Button className='mt-2' variant="solid" onClick={handleManualCheck}>Check Eligibility</Button>
            </div>
            <Button
              variant="solid"
              isDisabled={!isEligible || hasClaimed}
              onClick={() => claimAirdrop(simulateClaimAirdrop?.request)}
              className="mt-2 mb-4"
            >
              Claim
            </Button>
          </>
        ) : (
          <>
            <p>Please connect your wallet or manually check an address:</p>
            <div className="mt-1 flex flex-col items-center">
              <Input
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="Enter address"
                className="mb-2 w-[22rem]"
                variant={'bordered'}
              />
              {manualCheck && !isConnected && (
                <div className="text-center">
                  {isEligible ? (
                    <p className="text-green-800">Congrats! The entered address is eligible to claim {userData.amount} $btc</p>
                  ) : (
                    <p className="text-red-800">The entered address is not eligible for an airdrop</p>
                  )}
                </div>
              )}
              <Button className='mt-2 mb-4' variant="solid" onClick={handleManualCheck}>Check Eligibility</Button>
            </div>
          </>
        )}
      </div>
      <div className='flex flex-row bg-bitcoinorange gap-5 p-3 pl-7 pr-7 rounded-xl mt-4'>
        <Link href={`https://etherscan.io/address/0xbA51047a91d5bF6b86777A594D1714E8a337D120`} isExternal>
          <Image
            src="/etherscan.png"
            width={29}
            height={29}
            alt="etherscan"
          /></Link>
        <Link href={`https://github.com/tschoerv/claimbtc`} isExternal>
          <Image
            src="/github.png"
            width={30}
            height={30}
            alt="github"
          /></Link>
        <Link href={`https://discord.com/invite/7pbcDYqY3a`} isExternal>
          <Image
            src="/discord.png"
            width={30}
            height={30}
            alt="discord"
          /></Link>
        <Link href={`https://twitter.com/FirstERC20meme`} isExternal>
          <Image
            src="/twitter.png"
            width={30}
            height={30}
            alt="x"
          /></Link>
      </div>
      <div className='flex flex-row mt-1'>
        <p>made by&nbsp;</p> <Link href={`https://twitter.com/tschoerv`} isExternal>tschoerv.eth</Link> <p>&nbsp;- donations welcome!</p>
      </div>
    </main>
  );
}
