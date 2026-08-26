import os
import time
from web3 import Web3
from web3.exceptions import TimeExhausted, ContractLogicError
from flask import current_app

class BlockchainService:
    def __init__(self):
        self.w3 = None
        self.contract = None
        self.account = None

    def initialize(self):
        """Initialize connection to the blockchain and contract."""
        rpc_url = current_app.config.get('BLOCKCHAIN_RPC_URL')
        contract_address = current_app.config.get('BLOCKCHAIN_CONTRACT_ADDRESS')
        private_key = current_app.config.get('BLOCKCHAIN_PRIVATE_KEY')

        if not rpc_url or not contract_address or not private_key:
            current_app.logger.warning("Blockchain config missing.")
            return False

        try:
            self.w3 = Web3(Web3.HTTPProvider(rpc_url))
            if not self.w3.is_connected():
                current_app.logger.error("Failed to connect to blockchain at %s", rpc_url)
                return False

            self.account = self.w3.eth.account.from_key(private_key)
            
            # Basic ABI for our DEIMSEvidence contract
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
                    "name": "getEvidence",
                    "outputs": [
                        {"internalType": "string", "name": "id", "type": "string"},
                        {"internalType": "string", "name": "caseId", "type": "string"},
                        {"internalType": "string", "name": "fileHash", "type": "string"},
                        {"internalType": "string", "name": "submitterId", "type": "string"},
                        {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                        {"internalType": "bool", "name": "exists", "type": "bool"}
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [
                        {"internalType": "string", "name": "_id", "type": "string"},
                        {"internalType": "string", "name": "_fileHash", "type": "string"}
                    ],
                    "name": "verifyEvidence",
                    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
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
                    "inputs": [
                        {"internalType": "string", "name": "_evidenceId", "type": "string"},
                        {"internalType": "string", "name": "_caseId", "type": "string"},
                        {"internalType": "string", "name": "_action", "type": "string"}
                    ],
                    "name": "recordCustodyEvent",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ]
            self.contract = self.w3.eth.contract(address=contract_address, abi=abi)
            return True
        except Exception as e:
            current_app.logger.error(f"Blockchain initialization error: {str(e)}")
            return False

    def is_connected(self):
        if not self.w3:
            self.initialize()
        return self.w3.is_connected() if self.w3 else False

    def register_evidence(self, evidence_id, case_id, file_hash, submitter_id):
        if not self.is_connected():
            return {"status": "FAILED", "error": "Blockchain offline"}

        try:
            # Check if exists
            if self.contract.functions.evidenceExists(evidence_id).call():
                return {"status": "FAILED", "error": "Evidence already exists on blockchain"}

            nonce = self.w3.eth.get_transaction_count(self.account.address)
            
            tx = self.contract.functions.registerEvidence(
                evidence_id, case_id, file_hash, submitter_id
            ).build_transaction({
                'chainId': self.w3.eth.chain_id,
                'gas': 2000000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': nonce,
            })

            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
            if receipt.status == 1:
                return {"status": "REGISTERED", "tx_hash": self.w3.to_hex(tx_hash)}
            else:
                return {"status": "FAILED", "error": "Transaction reverted"}
                
        except Exception as e:
            current_app.logger.error(f"Blockchain register_evidence error: {str(e)}")
            return {"status": "FAILED", "error": str(e)}

    def get_evidence(self, evidence_id):
        if not self.is_connected():
            return None
            
        try:
            if not self.contract.functions.evidenceExists(evidence_id).call():
                return None
                
            data = self.contract.functions.getEvidence(evidence_id).call()
            return {
                "id": data[0],
                "caseId": data[1],
                "fileHash": data[2],
                "submitterId": data[3],
                "timestamp": data[4],
                "exists": data[5]
            }
        except Exception as e:
            current_app.logger.error(f"Blockchain get_evidence error: {str(e)}")
            return None

    def record_custody_event(self, evidence_id, case_id, action):
        if not self.is_connected():
            return {"status": "FAILED", "error": "Blockchain offline"}

        try:
            # Fallback to defaults if missing (e.g., case events have no evidence_id)
            safe_evidence_id = str(evidence_id) if evidence_id else "N/A"
            safe_case_id = str(case_id) if case_id else "N/A"
            
            # Additional safety for length as contract requires > 0
            if not safe_evidence_id: safe_evidence_id = "N/A"
            if not safe_case_id: safe_case_id = "N/A"

            nonce = self.w3.eth.get_transaction_count(self.account.address)
            
            # The ABI for recordCustodyEvent must be present in the init
            tx = self.contract.functions.recordCustodyEvent(
                safe_evidence_id, safe_case_id, action
            ).build_transaction({
                'chainId': self.w3.eth.chain_id,
                'gas': 2000000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': nonce,
            })

            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
            if receipt.status == 1:
                return {"status": "RECORDED", "tx_hash": self.w3.to_hex(tx_hash)}
            else:
                return {"status": "FAILED", "error": "Transaction reverted"}
                
        except Exception as e:
            current_app.logger.error(f"Blockchain record_custody_event error: {str(e)}")
            return {"status": "FAILED", "error": str(e)}

blockchain_service = BlockchainService()
