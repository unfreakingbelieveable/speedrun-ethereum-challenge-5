import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch } from "antd";
import React, { useState } from "react";
import { utils } from "ethers";
import { SyncOutlined } from "@ant-design/icons";
import { List } from "antd";

import { Address, AddressInput, Balance, Events } from "../components";

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
}) {
  const [newSigner, addNewSigner] = useState("loading...");
  // let proposals = writeContracts.Test_Multisig.test_getProposals(); 

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
        <Divider />
        Passed Proposals:
        <Divider />
        Failed Proposals:
      </div>

      {/*
        📑 Maybe display a list of events?
          (uncomment the event and emit line in YourContract.sol! )
      */}
      <Events
        contracts={readContracts}
        contractName="YourContract"
        eventName="SetPurpose"
        localProvider={localProvider}
        mainnetProvider={mainnetProvider}
        startBlock={1}
      />
    </div>
  );
}
