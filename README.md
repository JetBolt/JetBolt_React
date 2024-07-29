# JetBolt React Library
## The Easiest Way To Use Skale Network

Welcome to the JetBolt React Library, the simplest and most efficient way to integrate your React applications with the Skale Network. Our library offers a comprehensive suite of hooks and components designed to streamline the process of implementing blockchain functionalities, such as wallet management, transaction signing, and smart contract interactions. Whether you're building complex dApps or simply exploring blockchain capabilities, JetPaw provides you with the tools necessary to connect, interact, and execute securely on the Skale Network. Get started easily with our installation guide below, and enhance your applications with powerful Web3 features today.

### 1. Instalation

If you are using npm you can easily install our library using the following command:

```sh
npm i jetbolt_react
```

If you are using yarn you can also simply run:

```sh
yarn add jetbolt_react
```

Alternatively you can use download the files in `src` and reference them in your project or build the the `dist` yourself with the following command:

```sh
npm run build
```

### 2. Usage

Once the library is installed, you simple need to wrap your react components with `JetPaw` and our hooks and functions will automatically become available within the wrapped components. For example:

```js
import { JetBolt, useJetBolt } from "JetBolt";

function My_Component() {

    let { is_authorized } = useJetPaw();
    
    return (
        <>
            {
                is_authorized ?
                    <p>User has authorized this dApp</p> :
                    <p>User has not yet authorized this dApp</p>
            }
        </>
    );
}

function Exporable_Component() {
    return (
        <JetBolt>
            <My_Component/>
        </JetBolt>
    );
}
```

### 3. Contract Call

Now that you have setup your basic environment, we can get started with an example on how you can use JetBolt to sign and send real transactions. First, let's have a quick look at what's included inside of the `useJetPaw` hook.

```js
let {

    is_authorized,
    wallet_address,
    session_address,
    username,

    configure_skale_chain,
    configure_custom_skale_chain,

    register_callback,

    request_authorization,
    call_contract,
    call_contract_with_session,
    sign_message,
    sign_message_with_session
    
} = useJetBolt();
```

Now that we have some idea of the functions and hooks available within the `useJetBolt` hook, we can go ahead and get started in configuring our Skale Chain. By default, the library initializes to the `Calypso Testnet`, but you can really easily configure it to be used with any Skale Chain.

We've created easy presets within the `configure_skale_chain` if you want to use one of the 4 main chains and their testnets including. We recommend you specify your configuration when your component loads. For example:

```js
useEffect(()=>{
    configure_skale_chain("europa");
},[]);
```

If you are not sure about the naming convention it's all in snake_case for example `europa` and `europa_testnet` you can find more information in `src/skale_chains.js`.

If you are using a custom Skale Chain or App Chain, you can configure the chain manually. You will need to specify the `rpc_url`, `chain_id`, `sfuel_contract` address, and `function_signature` for the sfuel PoW function to request gas. Below is an example:

```js
useEffect(()=>{
    configure_custom_skale_chain(
      "https://testnet.skalenodes.com/v1/juicy-low-small-testnet",
      1444673419,
      "0x366727B410fE55774C8b0B5b5A6E2d74199a088A",
      "0x0c11dedd"
    );
},[]);
```

Now that you have configured your chain, we can go ahead and request permission from the user to access his wallet and make a transaction. Below is an example:

```js
import React, { useEffect } from "react";
import { JetBolt, useJetBolt } from "JetPaw";
import sample_contract_json from "./assets/sample_contract.json"

function My_Component() {

    let {

        is_authorized,
        wallet_address,
        session_address,
        username,
    
        request_authorization,
        call_contract
        
    } = JetBolt();
    
    function login() {
        request_authorization();
    }
    
    function call_skale_contract() {
        let abi = sample_contract_json.abi;
        let response = call_contract("Description of the transaction for the user","contract address", abi, "function name", [your parameters here]);
    }
    
    useEffect(()=>{
        configure_skale_chain("europa");
        
        register_callback("auth", (status) => {
          console.log('Authorization callback',{status})
        });
        
        register_callback("call", (status, function_name, hash) => {
          console.log('Call callback',{status, function_name, hash})
        });

    },[]);
    
    return (
        <>
            {
                is_authorized ?
                    <>
                        <p>Username: {username}</p>
                        <br/>
                        <p>Wallet Address: {wallet_address}</p>
                        <br/>
                        <p>Session Address: {session_address}</p>
                        <br/><br/>
                        <button onClick={call_skale_contract}>Call Contract</button>
                    </> :
                    <button onClick={login}>Login</button>
            }
        </>
    );
}

function Exporable_Component() {
    return (
        <JetBolt>
            <My_Component/>
        </JetBolt>
    );
}
```

### 4. Sessions

> NEVER USE SESSION WALLET FOR TRANSACTIONS INVOLVING ASSETS

JetBolt provides a session wallet for transactions that do not require high security. This has use cases in Web3 gaming and Social Fi. Transactions on the sessions wallet do not require the user to manually sign and approve them. Our session wallets have a similar level of security to a Web2 JWT.

You can verify session wallets on chain on `Calypso` and `Calypso Testnet` using our `Sessions` smart contract. Below is an example:

```js
interface ISessions {
    function get_valid_session(
        address wallet_address
        )
        external view
        returns (address);
}

contract Your_Contract {

    ISessions public Sessions = ISessions(0x...);
    
    function your_function(
        address wallet_address
        )
        public
        validate_session(wallet_address)
    {
        // Your code here
    }

    modifier validate_session(address wallet_address) {
        require(
            msg.sender == wallet_address ||
            Sessions.get_valid_session(msg.sender) == wallet_address,
            "Unauthorized access"
        );
        _;
    }
}
```

Below are the contract addresses for on chain verification.

| Chain | Address |
| ------ | ------ |
| Calypso | 0x... |
| Calypso Testnet | 0x... |

Calling session function from the client side:

```js
call_contract_with_session("tx description...","contract address", abi, "function name", [your parameters here]);
```

### 5. Signing Messages

In addition to sending transactions, you can also sign messages using the JetPaw wallet. Below is a simple example:

```js
async function sign() {
    await sign_message("Description of what is being signed for the user", "string being signed");
}
 
useEffect(()=>{
    register_callback("signature", (status, signature) => {
      console.log('Signature callback',{status, signature})
    });
},[]); 
```

### 6. Light Theme

You can easily specify light theme on the JetBolt wrapper. Example:

```js
<JetBolt theme="light">
```