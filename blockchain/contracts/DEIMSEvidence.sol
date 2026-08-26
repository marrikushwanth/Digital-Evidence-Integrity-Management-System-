// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DEIMSEvidence {
    address public owner;

    struct Evidence {
        string id;
        string caseId;
        string fileHash; // SHA-256
        string submitterId;
        uint256 timestamp;
        bool exists;
    }

    struct CustodyEvent {
        string evidenceId;
        string caseId;
        string action;
        uint256 timestamp;
    }

    mapping(string => Evidence) private evidences;
    CustodyEvent[] private custodyEvents;

    event EvidenceRegistered(string indexed id, string caseId, string fileHash, uint256 timestamp);
    event EvidenceVerified(string indexed id, bool matchStatus, uint256 timestamp);
    event CustodyEventRecorded(string indexed evidenceId, string caseId, string action, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerEvidence(
        string memory _id,
        string memory _caseId,
        string memory _fileHash,
        string memory _submitterId
    ) public onlyOwner {
        require(bytes(_id).length > 0, "Evidence ID cannot be empty");
        require(bytes(_fileHash).length > 0, "File hash cannot be empty");
        require(!evidences[_id].exists, "Evidence already registered");

        evidences[_id] = Evidence({
            id: _id,
            caseId: _caseId,
            fileHash: _fileHash,
            submitterId: _submitterId,
            timestamp: block.timestamp,
            exists: true
        });

        emit EvidenceRegistered(_id, _caseId, _fileHash, block.timestamp);
    }

    function getEvidence(string memory _id) public view returns (
        string memory id,
        string memory caseId,
        string memory fileHash,
        string memory submitterId,
        uint256 timestamp,
        bool exists
    ) {
        Evidence memory ev = evidences[_id];
        return (ev.id, ev.caseId, ev.fileHash, ev.submitterId, ev.timestamp, ev.exists);
    }

    function verifyEvidence(string memory _id, string memory _fileHash) public returns (bool) {
        require(evidences[_id].exists, "Evidence not found");
        
        // string comparison by comparing keccak256 hashes
        bool matchStatus = (keccak256(abi.encodePacked(evidences[_id].fileHash)) == keccak256(abi.encodePacked(_fileHash)));
        
        emit EvidenceVerified(_id, matchStatus, block.timestamp);
        return matchStatus;
    }

    function recordCustodyEvent(
        string memory _evidenceId,
        string memory _caseId,
        string memory _action
    ) public onlyOwner {
        require(bytes(_evidenceId).length > 0, "Evidence ID required");
        require(bytes(_action).length > 0, "Action required");

        custodyEvents.push(CustodyEvent({
            evidenceId: _evidenceId,
            caseId: _caseId,
            action: _action,
            timestamp: block.timestamp
        }));

        emit CustodyEventRecorded(_evidenceId, _caseId, _action, block.timestamp);
    }

    function evidenceExists(string memory _id) public view returns (bool) {
        return evidences[_id].exists;
    }
}
