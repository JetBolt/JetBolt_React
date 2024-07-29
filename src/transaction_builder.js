import { skale_chains } from "./skale_chains";

class Transaction_Builder {

    constructor() {
        this.init_skale_chain("calypso_testnet");
    }

    init_skale_chain(skale_chain_name) {

        if (!skale_chains[skale_chain_name]) {
            throw "Invalid skale_chain_name";
        }

        this.skale_chain_name = skale_chain_name;
        this.rpc_url = skale_chains[skale_chain_name].rpc_url;
        this.chain_id = void 0;
        this.sfuel_contract = void 0;
        this.function_signature = void 0;
        this.is_skale_chain = true;
    }

    init_custom_skale_chain(rpc_url, chain_id, sfuel_contract, function_signature) {
        this.skale_chain_name = void 0;
        this.rpc_url = rpc_url;
        this.chain_id = chain_id;
        this.sfuel_contract = sfuel_contract;
        this.function_signature = function_signature;
        this.is_skale_chain = true;
    }

    init_custom_chain(rpc_url, chain_id) {
        this.skale_chain_name = void 0;
        this.rpc_url = rpc_url;
        this.chain_id = chain_id;
        this.sfuel_contract = void 0;
        this.function_signature = void 0;
        this.is_skale_chain = false;
    }

    make_call_params(address, abi, function_name, params, gas_limit, value, signature_mode="default") {

        if (this.is_skale_chain) {
            if (this.skale_chain_name) {
                return {
                    is_skale_chain: this.is_skale_chain,
                    skale_chain_name: this.skale_chain_name,
                    address,
                    abi,
                    function_name,
                    params,
                    value,
                    gas_limit,
                    signature_mode
                }
            }
            else {
                return {
                    is_skale_chain: this.is_skale_chain,
                    rpc_url: this.rpc_url,
                    chain_id: this.chain_id,
                    sfuel_contract: this.sfuel_contract,
                    function_signature: this.function_signature,
                    address,
                    abi,
                    function_name,
                    params,
                    value,
                    gas_limit,
                    signature_mode
                }
            }
        }
        else {
            return {
                is_skale_chain: this.is_skale_chain,
                rpc_url: this.rpc_url,
                chain_id: this.chain_id,
                address,
                abi,
                function_name,
                params,
                value,
                gas_limit,
                signature_mode
            }
        }

    }

}

export default Transaction_Builder;