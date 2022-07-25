import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch } from "antd";
import React, { useState } from "react";
import { utils } from "ethers";
import { SyncOutlined } from "@ant-design/icons";
import { List } from "antd";

import { Address, Balance, Events } from "../components";

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

  return (
    <div>
      {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <h2>Multisig UI:</h2>
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
          <Input
            onChange={e => {
              addNewSigner(e.target.value);
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

      <div style={{ width: 600, margin: "auto", marginTop: 32, paddingBottom: 256 }}>
        <Card>
          Check out all the{" "}
          <a
            href="https://github.com/austintgriffith/scaffold-eth/tree/master/packages/react-app/src/components"
            target="_blank"
            rel="noopener noreferrer"
          >
            📦 components
          </a>
        </Card>

        <Card style={{ marginTop: 32 }}>
          <div>
            There are tons of generic components included from{" "}
            <a href="https://ant.design/components/overview/" target="_blank" rel="noopener noreferrer">
              🐜 ant.design
            </a>{" "}
            too!
          </div>

          <div style={{ marginTop: 8 }}>
            <Button type="primary">Buttons</Button>
          </div>

          <div style={{ marginTop: 8 }}>
            <SyncOutlined spin /> Icons
          </div>

          <div style={{ marginTop: 8 }}>
            Date Pickers?
            <div style={{ marginTop: 2 }}>
              <DatePicker onChange={() => {}} />
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <Slider range defaultValue={[20, 50]} onChange={() => {}} />
          </div>

          <div style={{ marginTop: 32 }}>
            <Switch defaultChecked onChange={() => {}} />
          </div>

          <div style={{ marginTop: 32 }}>
            <Progress percent={50} status="active" />
          </div>

          <div style={{ marginTop: 32 }}>
            <Spin />
          </div>
        </Card>
      </div>
    </div>
  );
}
