import React, { useReducer, useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import EthContext from "./EthContext";
import { reducer, actions, initialState } from "./state";

function EthProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [connectionStatus, setConnectionStatus] = useState(false);

    const init = useCallback(
        async artifact => {
            if (artifact) {
                const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
                const accounts = await web3.eth.requestAccounts();
                const networkID = await web3.eth.net.getId();
                const { abi } = artifact;
                let address, contract;
                try {
                    address = artifact.networks[networkID].address;
                    contract = new web3.eth.Contract(abi, address);
                    setConnectionStatus(true);
                } catch (err) {
                    console.error(err);
                }
                dispatch({
                    type: actions.init,
                    data: { artifact, web3, accounts, networkID, contract }
                });
            }
        }, []);

    const onClickConnect = () => {
        const tryInit = async () => {
            try {
                const artifact = require("../../contracts/EtherArena.json");
                init(artifact);
            } catch (err) {
                console.error(err);
            }
        };
        tryInit();
    };

    useEffect(() => {
        const tryInit = async () => {
            try {
                const artifact = require("../../contracts/EtherArena.json");
                init(artifact);
            } catch (err) {
                console.error(err);
            }
        };
        // if metamask already connected --> init
        window.ethereum.request({ method: 'eth_accounts' }).then((acc) => {
            setConnectionStatus(acc.length > 0 ? true : false);
            if (connectionStatus === true) {
                tryInit();
            }
        }).catch(console.error);
    }, [init, connectionStatus]);

    useEffect(() => {
        const events = ["chainChanged", "accountsChanged"];
        const handleChange = () => {
            init(state.artifact);
        };

        events.forEach(e => window.ethereum.on(e, handleChange));
        return () => {
            events.forEach(e => window.ethereum.removeListener(e, handleChange));
        };
    }, [init, state.artifact]);

    return (
        <EthContext.Provider value={{
            state,
            dispatch
        }}>
            {children}
            <button 
                onClick={onClickConnect} 
                style={{display: connectionStatus === false ? 'block' : 'none' }} 
                className="connectBtn">
                Connect
            </button>
        </EthContext.Provider>
    );
}

export default EthProvider;
