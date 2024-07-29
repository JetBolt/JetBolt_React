import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

import Transaction_Builder from "./transaction_builder";

import "./styles.css";

const ModalContext = createContext();

export function useJetBolt() {
    return useContext(ModalContext);
}

const transaction_builder = new Transaction_Builder();

let site_url = "https://jetbolt.io";
// let site_url = "http://localhost:3000";

export function JetBolt({ children, theme }) {

    let [iframe_url, set_iframe_url] = useState(`${site_url}/iframe?theme=${theme}&t=${Date.now()}`);
    let [has_wallet, set_has_wallet] = useState(null);
    let [wallet_address, set_wallet_address] = useState(null);
    let [session_address, set_session_address] = useState(null);
    let [username, set_username] = useState(null);
    let [is_authorized, set_is_authorized] = useState(null);
    let [is_calling, set_is_calling] = useState(false);

    let iframe_ref = useRef(null);

    useEffect(() => {

        if (iframe_ref.current) {
            iframe_ref.current.setAttribute('allowTransparency', 'true');
        }

        const handle_message = (event) => {
            if (event.origin == site_url) {
                if (event.data) {
                    if (event.data.authorized || event.data.authorized === false) {
                        set_is_authorized(event.data.authorized);
                    }
                    if (event.data.has_wallet || event.data.has_wallet === false) {
                        set_has_wallet(event.data.has_wallet);
                    }
                    if (event.data.wallet_address || event.data.wallet_address === "") {
                        set_wallet_address(event.data.wallet_address);
                    }
                    if (event.data.session_address || event.data.session_address === "") {
                        set_session_address(event.data.session_address);
                    }
                    if (event.data.username || event.data.username === "") {
                        set_username(event.data.username);
                    }
                    if (event.data.public_key) {
                        let new_url = append_query_params(
                            `${site_url}/iframe?theme=${theme}&t=${Date.now()}`,
                            {
                                request_auth: true,
                                public_key: event.data.public_key,
                                callback_url: window.location.href
                            }
                        );
                        window.location = new_url;
                    }
                    if (event.data.session_progress) {
                        console.log("JetBolt Debug",event.data.session_progress);
                    }
                    if (event.data.error) {
                        console.log(`JetBolt Debug: ${event.data.error}`);
                    }
                }
            }
        }

        window.addEventListener("message", handle_message);

        return () => {
            window.removeEventListener("message", handle_message);
        };

    },[]);

    const clean_url = () => {
        remove_param_without_reloading("encrypted_shared_key");
        remove_param_without_reloading("encrypted_token");
        remove_param_without_reloading("callback_type");
        remove_param_without_reloading("function_name");
        remove_param_without_reloading("hash");
        remove_param_without_reloading("status");
        remove_param_without_reloading("loop");
        remove_param_without_reloading("t");
    }

    useEffect(()=>{
        register_callback();
    },[]);


    function register_callback(cb_type,callback_run) {

        let url = new URL(window.location.href);
        let url_params = url.searchParams;
        
        let callback_type = url_params.get("callback_type");
        let function_name = url_params.get("function_name");
        let hash = url_params.get("hash");
        let status = url_params.get("status");
        let loop = url_params.get("loop");

        if (callback_type && status) {
            if (callback_type == "call") {
                if (callback_run && typeof callback_run == "function") {
                    if (cb_type == "call") {
                        callback_run(status, function_name, hash);
                        setTimeout(()=>{
                            clean_url();
                        },1000);
                    }
                }
            }
            else if (callback_type == "signature") {
                if (callback_run && typeof callback_run == "function") {
                    if (cb_type == "signature") {
                        callback_run(status, hash);
                        setTimeout(()=>{
                            clean_url();
                        },1000);
                    }
                }
            }
            else if (callback_type == "auth") {
                if (callback_run && typeof callback_run == "function") {
                    if (cb_type == "auth") {
                        callback_run(status);
                    }
                }

                if (!loop) {
                    append_utm_without_reloading(`loop=true&t=${Date.now()}`);
                    setTimeout(()=>{
                        window.location.reload();
                    },1000);
                }
                else {
                    setTimeout(()=>{
                        clean_url();
                    },1000);
                }
            }

           
        }
        
    }

    async function wait_for_message_response(timeout) {

        return new Promise((resolve, reject) => {

            const handle_message = (event) => {
                if (event.origin == site_url) {
                    if (event.data) {
                        if (event.data.response) {
                            
                            cleanup();

                            if (event.data.response.status == "success") {
                                return resolve(event.data.response);
                            }
                            else if (event.data.response.status == "fail") {
                                reject(event.data.response);
                            }
                            
                        }
                    }
                }
            }

            let timeout_ref;

            const cleanup = () => {
                window.removeEventListener("message", handle_message);
                clearTimeout(timeout_ref);
            }

            if (timeout > 0) {
                timeout_ref = setTimeout(()=>{
                    cleanup();
                    reject({status:"fail",status_code:408,error_message:"Request timed out"});
                },timeout);
            }

            window.addEventListener("message", handle_message);

        });

    }

    function configure_skale_chain(skale_chain_name) {
        transaction_builder.init_skale_chain(skale_chain_name);
    }

    function configure_custom_skale_chain(rpc_url, chain_id, sfuel_contract, function_signature) {
        transaction_builder.init_custom_skale_chain(rpc_url, chain_id, sfuel_contract, function_signature);
    }

    function configure_custom_chain(rpc_url, chain_id) {
        transaction_builder.init_custom_chain(rpc_url, chain_id);
    }

    function iframe_loaded() {
        if (iframe_ref.current) {
            let url = new URL(window.location.href);
            let url_params = url.searchParams;

            let encrypted_shared_key = url_params.get("encrypted_shared_key");
            let encrypted_token = url_params.get("encrypted_token");

            if (encrypted_shared_key && encrypted_token) {
                iframe_ref.current.contentWindow.postMessage({ type:"load_token", encrypted_shared_key, encrypted_token }, site_url);
            }

        }
    }

    async function request_authorization() {
        iframe_ref.current.contentWindow.postMessage({ type:"request_auth" }, site_url);
    }

    async function call_contract(transaction_description, address, abi, function_name, parameters, gas_limit=0, value=0) {

        let relevant_abi_function = [abi.find(item => item.name === function_name)].filter(Boolean);
        let call_params = transaction_builder.make_call_params(address, relevant_abi_function, function_name, parameters, gas_limit, value);
        call_params.transaction_description = transaction_description;
        call_params = encodeURIComponent(JSON.stringify(call_params));

        let response = wait_for_message_response(0);
        iframe_ref.current.contentWindow.postMessage({ type: "request_call_auth", call_params }, site_url);
        let { signature } = await response;
        
        let url = append_query_params(`${site_url}/iframe?theme=${theme}&t=${Date.now()}`, {signature, call_params, callback_url: window.location.href});
        window.location = url;

    }

    async function call_contract_with_session(address, abi, function_name, parameters, gas_limit=0, value=0) {
        try {
            if (is_calling) { throw Error("You can only make one call at a time."); }
            set_is_calling(true);
            let response = wait_for_message_response(0);
            let relevant_abi_function = [abi.find(item => item.name === function_name)].filter(Boolean);
            let call_params = transaction_builder.make_call_params(address, relevant_abi_function, function_name, parameters, gas_limit, value, "session");
            iframe_ref.current.contentWindow.postMessage({ type: "session_call", call_params }, site_url);
            let result = await response;
            set_is_calling(false);
            return result;
        } catch (error) {
            set_is_calling(false);
            throw error;
        }
    }

    async function sign_message(message_description, message) {
        
        let call_params = { message, signature_mode: "signature" }
        call_params.transaction_description = message_description;
        call_params = encodeURIComponent(JSON.stringify(call_params));

        let response = wait_for_message_response(0);
        iframe_ref.current.contentWindow.postMessage({ type: "request_call_auth", call_params }, site_url);
        let { signature } = await response;
        
        let url = append_query_params(`${site_url}/iframe?theme=${theme}&t=${Date.now()}`, {signature, call_params, callback_url: window.location.href});
        window.location = url;

    }

    async function sign_message_with_session(message) {
        if (is_calling) { throw Error("You can only make one call at a time."); }
        set_is_calling(true);
        let response = wait_for_message_response(0);
        iframe_ref.current.contentWindow.postMessage({ type: "session_sign", message }, site_url);
        let result = await response;
        set_is_calling(false);
        return result;
    }
    
    let context_value = {

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

    }

    return (
        <ModalContext.Provider value={context_value}>
            { children }
            <iframe
                ref={iframe_ref}
                frameBorder="none"
                src={iframe_url}
                className="jetbolt_iframe_hidden"
                onLoad={iframe_loaded}
            />
        </ModalContext.Provider>
    );
}

function append_query_params(url_string, new_params) {
    const url = new URL(url_string);
    const params = new URLSearchParams(url.search);
    Object.entries(new_params).forEach(([key, value]) => {
      params.set(key, value);
    });
    url.search = params.toString();
    return url.toString();
}

function remove_param_without_reloading(param_to_remove) {
    const current_url = new URL(window.location.href);
    const search_params = new URLSearchParams(current_url.search);
    search_params.delete(param_to_remove);
    const new_url = `${current_url.origin}${current_url.pathname}?${search_params.toString()}${current_url.hash}`;
    window.history.pushState({ path: new_url }, '', new_url);
}

function append_utm_without_reloading(utm_params) {
    const currentUrl = new URL(window.location.href);
    const searchParams = new URLSearchParams(currentUrl.search);

    utm_params.split('&').forEach(param => {
        const [key, value] = param.split('=');
        searchParams.set(key, value);
    });

    const newUrl = `${currentUrl.origin}${currentUrl.pathname}?${searchParams.toString()}${currentUrl.hash}`;

    window.history.pushState({ path: newUrl }, '', newUrl);
}