// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract EtherArena is ERC721, ERC721URIStorage, Pausable, Ownable, ERC721Burnable, ERC721Enumerable, VRFConsumerBaseV2 {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    /**
     * Chainlink VRF setup
     */

    event RequestSent(uint256 requestId, uint32 numWords);
    event RequestFulfilled(uint256 requestId, uint256[] randomWords);

    struct RequestStatus {
        bool fulfilled; // whether the request has been successfully fulfilled
        bool exists; // whether a requestId exists
        uint256[] randomWords;
    }

    mapping (uint256 => RequestStatus) public requests; /* requestId --> requestStatus */
    VRFCoordinatorV2Interface COORDINATOR;

    // past requests Id.
    uint256[] public requestIds;
    uint256 public lastRequestId;

    uint64 subscriptionId;
    bytes32 keyHash;
    uint32 callbackGasLimit;
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;

    /**
     * Game variables
     */
    
    uint256 public currentRound;

    struct Fighter {
      uint256 powerLevel;
      bool locked;
      uint256 nextUpgrade;
      uint256 round;
    }

    mapping (uint256 => Fighter) public fighters;
    mapping (uint256 => uint256) public requestIdToTokenId; // Keep track of which token id should be upgraded with the randomness request

    /**
     * Events
     */

    event FighterMinted (address minter, uint256 tokenId);
    event FighterUpgraded (uint256 tokenId, uint256 upgradeAmount, uint256 powerLevel);
    event FighterJoinedRound (uint256 tokenId, uint256 currentRound);
    event FightWon (uint256 tokenId, uint256 nextRound);

    /**
     * Init
     */

    constructor(
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit

    )
        ERC721("EtherArena", "ETAR") 
        VRFConsumerBaseV2(0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D)
    {
        COORDINATOR = VRFCoordinatorV2Interface(0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        currentRound = 1;
    }

    /**
     * URI
     */

    function _baseURI() internal pure override returns (string memory) {
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * Admin
     */
    
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * Game mechanics
     */

    function safeMint() public {
        string memory uri = 'https://ether-arena.infura-ipfs.io/ipfs/QmTcb5ZRi5NVdu8PuYWgPBv6Nevs32W19aoFTv9R81obvB';
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        fighters[tokenId].powerLevel = 1;
        fighters[tokenId].locked = true;
        fighters[tokenId].round = currentRound;
        emit FighterMinted(msg.sender, tokenId);
    }

    function joinRound(uint256 _tokenId) public {
        require(fighters[_tokenId].round < currentRound, "joinRound: round of tokenid needs to be lower than the current game round");
        fighters[_tokenId].round = currentRound;
        fighters[_tokenId].powerLevel = 1;
        fighters[_tokenId].locked = true;
        emit FighterJoinedRound(_tokenId, currentRound);
    }

    function endFight(uint256 winnerTokenId) public {
        fighters[winnerTokenId].locked = false;
        currentRound ++;
        emit FightWon(winnerTokenId, currentRound);
    }

    function upgradeFighter(uint256 _tokenId) public {
        require(fighters[_tokenId].round == currentRound, "upgradeFighter: fighter needs to join current game round");

        uint256 upgradeAmount = 3333;
        fighters[_tokenId].powerLevel += upgradeAmount;     

        emit FighterUpgraded(_tokenId, upgradeAmount, fighters[_tokenId].powerLevel);

        if (fighters[_tokenId].powerLevel > 9000) {
            endFight(_tokenId);
        }
    }

    function requestRandomWords(uint256 _tokenId)
        external
        onlyOwner
        returns (uint256 requestId)
    {
        
        /*
        // Implement below requires once testing is finished
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: caller is not token owner or approved"); // Test if this works on goerli
        require(fighters[tokenId].nextUpgrade < block.timestamp, "Fighters can only be upgraded every 24 hours");
        */
      
        // Will revert if subscription is not set and funded.
        requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        requests[requestId] = RequestStatus({
            randomWords: new uint256[](0),
            exists: true,
            fulfilled: false
        });
        requestIds.push(requestId);
        lastRequestId = requestId;

        // Map the request id to the token id
        requestIdToTokenId[requestId] = _tokenId;

        emit RequestSent(requestId, numWords);
        return requestId;
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        require(requests[_requestId].exists, "request not found");
        requests[_requestId].fulfilled = true;
        requests[_requestId].randomWords = _randomWords;

        // Update the powerlevel of the NFT
        uint256 tokenIdToUpgrade = requestIdToTokenId[_requestId];
        uint256 upgradeAmount = (_randomWords[0] % 1000) + 1; // Random value in the range of 1 to 1000
        fighters[tokenIdToUpgrade].powerLevel += upgradeAmount;

        emit RequestFulfilled(_requestId, _randomWords);
    }
    
    function getRequestStatus(
        uint256 _requestId
    ) external view returns (bool fulfilled, uint256[] memory randomWords) {
        require(requests[_requestId].exists, "request not found");
        RequestStatus memory request = requests[_requestId];
        return (request.fulfilled, request.randomWords);
    }

    /**
     * 721 functions
     */

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

     // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        require(!fighters[tokenId].locked, 'This fighter is locked and can not be transferred.');
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
