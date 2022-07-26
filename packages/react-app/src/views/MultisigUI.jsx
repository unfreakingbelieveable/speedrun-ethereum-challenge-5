import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch } from "antd";
import React, { useState } from "react";
import { utils } from "ethers";
import { SyncOutlined } from "@ant-design/icons";
import { List } from "antd";

import { Address, AddressInput, Balance, Events } from "../components";

// const { ethers } = require("ethers");

export default function MultisigUI({
  signers,
  address,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
  proposals,
  minVotes
}) {
  const [newSigner, addNewSigner] = useState("loading...");
  // proposals != undefined ? console.log(proposals[0].voteYes.length) : console.log("")
  // minVotes != undefined ? console.log(Number(proposals[0].voteYes.length) < Number(minVotes.toString())) : console.log()
  return (
    <div>
      {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <h2>Multisig UI:</h2>
        <Divider />
        <h4>Current Members:</h4>
        <List
        bordered
        dataSource={signers}
        renderItem={item => {
          return (
            <List.Item key={item}>
              <Address address={item} ensProvider={mainnetProvider} />
            </List.Item>
          );
        }}
      />
      < Divider />
      <div style={{ margin: 8}}>
          <AddressInput
            placeholder="Please Enter an Address"
            onChange={e => {
              addNewSigner(e);
            }}
          />
      </div>
      <div style={{ margin: 8}}>
          <Button 
            onClick={() => {
              tx(writeContracts.Test_Multisig.submitProposal(
                writeContracts.Test_Multisig.address,
                0,
                "addSigner(address)",
                writeContracts.Test_Multisig.interface.encodeFunctionData("addSigner", [newSigner]),
                `Add ${newSigner} to multisig via scaffold eth web interface`
              ));
              addNewSigner("");
            }}
          >
            Add new member to multisig!
          </Button>
        </div>
        <Divider />
        Open Proposals:
        <List
          bordered
          dataSource={proposals}
          renderItem={(item, index) => {
            let retdata;
            item.expiration.toString() > Math.floor(Date.now()/1000) ?
            retdata = (
              <div>
                <List.Item key={item}>
                  {item.description}
                </List.Item>
                <Button
                  onClick={() => {
                    tx(writeContracts.Test_Multisig.voteOnProposal(index));
                  }}
                >
                  Vote Yes
                </Button>
              </div>
            ) : retdata = ("");
            return retdata;
          }}
        />
        <Divider />
        Passed Proposals:
        <List
          bordered
          dataSource={proposals}
          renderItem={(item, index) => {
            let retdata;
            ((minVotes != undefined) && (item.expiration.toString() < Math.floor(Date.now()/1000)) && (Number(item.voteYes.length.toString()) >= Number(minVotes.toString()))) ?
            retdata = (
              <div>
                <List.Item key={item}>
                  {item.description}
                </List.Item>
                <Button
                  onClick={() => {
                    tx(writeContracts.Test_Multisig.executeProposal(index));
                  }}
                >Execute</Button>
              </div>
            ) : retdata = ("");
            return retdata;
          }}
        />
        <Divider />
        Failed Proposals:
        <List
          bordered
          dataSource={proposals}
          renderItem={item => {
            let retdata;
            ((minVotes != undefined) && (item.expiration.toString() < Math.floor(Date.now()/1000)) && (Number(item.voteYes.length.toString()) < Number(minVotes.toString()))) ?
            retdata = (
              <List.Item key={item}>
                {item.description}
              </List.Item>
            ) : retdata = ("");
            return retdata;
          }}
        />
      </div>

      {/*
        📑 Maybe display a list of events?
          (uncomment the event and emit line in YourContract.sol! )
      */}
      <Events
        contracts={readContracts}
        contractName="Test_Multisig"
        eventName="SignerAdded"
        localProvider={localProvider}
        mainnetProvider={mainnetProvider}
        startBlock={1}
      />
    </div>
  );
}
