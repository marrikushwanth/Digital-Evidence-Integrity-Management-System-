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
        from dotenv import load_dotenv
        import os
        
        # Hot-reload environment variables to capture Hardhat restarts cleanly
        dotenv_path = os.path.join(current_app.root_path, '.env')
        load_dotenv(dotenv_path, override=True)
        
        rpc_url = os.environ.get('BLOCKCHAIN_RPC_URL')
        contract_address = os.environ.get('BLOCKCHAIN_CONTRACT_ADDRESS')
        private_key = os.environ.get('BLOCKCHAIN_PRIVATE_KEY')

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
                },
                {
                    "inputs": [
                        {"internalType": "bytes32", "name": "_batchId", "type": "bytes32"},
                        {"internalType": "bytes32", "name": "_merkleRoot", "type": "bytes32"},
                        {"internalType": "uint256", "name": "_leafCount", "type": "uint256"}
                    ],
                    "name": "registerMerkleRoot",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "inputs": [{"internalType": "bytes32", "name": "_batchId", "type": "bytes32"}],
                    "name": "getMerkleBatch",
                    "outputs": [
                        {"internalType": "bytes32", "name": "merkleRoot", "type": "bytes32"},
                        {"internalType": "uint256", "name": "leafCount", "type": "uint256"},
                        {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                        {"internalType": "bool", "name": "exists", "type": "bool"}
                    ],
                    "stateMutability": "view",
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
        if not self.w3:
            return False
        try:
            # Test connection cleanly with timeout to prevent hanging health checks
            return self.w3.is_connected()
        except Exception:
            return False

    def get_health_status(self):
        """Returns detailed health info for the frontend"""
        # Force reload to ensure we have the latest config
        self.initialize()
        
        status = {
            "connected": False,
            "rpc_url": os.environ.get('BLOCKCHAIN_RPC_URL'),
            "chain_id": None,
            "contract_address": os.environ.get('BLOCKCHAIN_CONTRACT_ADDRESS'),
            "contract_deployed": False,
            "contract_bytecode_found": False
        }
        
        if self.is_connected():
            status["connected"] = True
            try:
                status["chain_id"] = self.w3.eth.chain_id
                
                if status["contract_address"]:
                    code = self.w3.eth.get_code(status["contract_address"])
                    if len(code) > 2:
                        status["contract_bytecode_found"] = True
                        # To truly check if deployed, we might test if we can call it
                        try:
                            # Test calling getMerkleBatch with a dummy id just to ensure it doesn't revert with a contract missing error
                            dummy_bytes = self.w3.keccak(text='dummy')
                            self.contract.functions.getMerkleBatch(dummy_bytes).call()
                            status["contract_deployed"] = True
                        except Exception as inner_e:
                            current_app.logger.warning(f"Contract deployed but method call failed: {inner_e}")
                            # If it reverts naturally because dummy doesn't exist it's fine, but if it reverts because of missing method, it's bad.
                            # getMerkleBatch doesn't revert on missing, just returns empty struct.
            except Exception as e:
                current_app.logger.error(f"Health check error: {str(e)}")
                
        return status

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

    def register_merkle_root(self, batch_id, merkle_root, leaf_count):
        status_info = self.get_health_status()
        if not status_info["connected"]:
            return {"status": "FAILED", "error": "Blockchain offline. RPC not reachable."}
            
        if not status_info["contract_bytecode_found"]:
            return {
                "status": "FAILED", 
                "error": "Merkle smart contract is not deployed on the current Hardhat network.",
                "rpc_url": status_info["rpc_url"],
                "contract_address": status_info["contract_address"],
                "chain_id": status_info["chain_id"]
            }

        try:
            # We hash the batch_id to get a bytes32
            batch_id_bytes = self.w3.keccak(text=batch_id)
            root_bytes = self.w3.to_bytes(hexstr=merkle_root if merkle_root.startswith('0x') else '0x' + merkle_root)

            # Check if exists
            batch = self.contract.functions.getMerkleBatch(batch_id_bytes).call()
            if batch[3]: # exists
                return {"status": "FAILED", "error": "Batch already registered on blockchain"}

            nonce = self.w3.eth.get_transaction_count(self.account.address)
            
            tx = self.contract.functions.registerMerkleRoot(
                batch_id_bytes, root_bytes, leaf_count
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
                # Part 5: Verify the on-chain root
                on_chain_batch = self.contract.functions.getMerkleBatch(batch_id_bytes).call()
                on_chain_root = on_chain_batch[0]
                on_chain_leaf_count = on_chain_batch[1]
                
                if on_chain_root != root_bytes or on_chain_leaf_count != leaf_count:
                    return {"status": "FAILED", "error": "On-chain Merkle root does not match database root."}
                
                return {"status": "REGISTERED", "tx_hash": self.w3.to_hex(tx_hash)}
            else:
                return {"status": "FAILED", "error": "Transaction reverted by the smart contract"}
                
        except Exception as e:
            err_msg = str(e)
            current_app.logger.error(f"Blockchain register_merkle_root Web3 exception: {err_msg}")
            
            safe_msg = "Blockchain transaction failed."
            if "Could not transact with/call contract function" in err_msg:
                safe_msg = "Merkle smart contract is not deployed on the current Hardhat network."
            elif "insufficient funds" in err_msg.lower():
                safe_msg = "Blockchain account has insufficient funds for gas."
            elif "already registered" in err_msg.lower():
                safe_msg = "Batch is already registered on the blockchain."
                
            return {"status": "FAILED", "error": safe_msg}

    def get_merkle_batch_root(self, batch_id):
        if not self.is_connected():
            return None
        try:
            batch_id_bytes = self.w3.keccak(text=batch_id)
            batch = self.contract.functions.getMerkleBatch(batch_id_bytes).call()
            if not batch[3]: # exists
                return None
            return self.w3.to_hex(batch[0])[2:] # remove 0x and return string
        except Exception as e:
            current_app.logger.error(f"Blockchain get_merkle_batch_root error: {str(e)}")
            return None

blockchain_service = BlockchainService()

def verify_blockchain_connection():
    return blockchain_service.is_connected()
