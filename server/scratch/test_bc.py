import os
import sys
from web3 import Web3

rpc_url = 'http://127.0.0.1:8545'
contract_address = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
private_key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

w3 = Web3(Web3.HTTPProvider(rpc_url))
if not w3.is_connected():
    print("Failed to connect to blockchain at", rpc_url)
    sys.exit(1)

print("Connected to blockchain.")

account = w3.eth.account.from_key(private_key)
print("Account:", account.address)

abi = [
    {
        "inputs": [
            {"internalType": "string", "name": "_id", "type": "string"},
            {"internalType": "string", "name": "_caseId", "type": "string"},
            {"internalType": "string", "name": "_fileHash", "type": "string"},
            {"internalType": "string", "name": "_submitterId", "type": "string"}
        ],
        "name": "registerEvidence",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "_id", "type": "string"}],
        "name": "evidenceExists",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }
]

contract = w3.eth.contract(address=contract_address, abi=abi)

try:
    owner = contract.functions.owner().call()
    print("Contract owner:", owner)
except Exception as e:
    print("Error calling owner():", e)

evidence_id = "test_ev_1"
case_id = "1"
file_hash = "344a6386356a8ae1c3c18b23ecf64704527d7c4a1b2c3933deb41592e4bdfed"
submitter_id = "1"

try:
    exists = contract.functions.evidenceExists(evidence_id).call()
    print("Evidence exists:", exists)
except Exception as e:
    print("Error calling evidenceExists():", e)

nonce = w3.eth.get_transaction_count(account.address)
print("Nonce:", nonce)

try:
    tx = contract.functions.registerEvidence(
        evidence_id, case_id, file_hash, submitter_id
    ).build_transaction({
        'chainId': w3.eth.chain_id,
        'gas': 2000000,
        'gasPrice': w3.eth.gas_price,
        'nonce': nonce,
    })
    
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=account.key)
    print("Sending transaction...")
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    
    print("Waiting for receipt...")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
    print("Receipt status:", receipt.status)
    if receipt.status != 1:
        print("Transaction reverted.")
except Exception as e:
    print("Error during transaction:", e)
