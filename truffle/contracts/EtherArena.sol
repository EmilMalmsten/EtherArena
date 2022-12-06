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

    VRFCoordinatorV2Interface COORDINATOR;

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
    mapping (uint256 => uint256) private requestIdToTokenId; // Keep track of which token id should be upgraded with the randomness request

    /**
     * Events
     */

    event FighterMinted (address sender, uint256 tokenId);
    event FighterUpgradeRequested (address sender, uint256 tokenId);
    event FighterUpgraded (address sender, uint256 tokenId, uint256 upgradeAmount, uint256 powerLevel, uint256 round);
    event FighterJoinedRound (address sender, uint256 tokenId, uint256 currentRound);
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

    function safeMint() external {
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

    function joinRound(uint256 _tokenId) external {
        require(_isApprovedOrOwner(_msgSender(), _tokenId), "ERC721: caller is not token owner or approved");
        require(fighters[_tokenId].round < currentRound, "joinRound: token round needs to be lower than the current game round");
        fighters[_tokenId].round = currentRound;
        fighters[_tokenId].powerLevel = 1;
        fighters[_tokenId].locked = true;
        emit FighterJoinedRound(msg.sender, _tokenId, currentRound);
    }

    function endFight(uint256 winnerTokenId) private {
        string memory winnerUri = "https://ether-arena.infura-ipfs.io/ipfs/QmX7YQExCou6JuAeVqqVTaRYf9qrySB7tipQGXY927mv95";
        fighters[winnerTokenId].locked = false;
        _setTokenURI(winnerTokenId, winnerUri);
        currentRound ++;
        emit FightWon(winnerTokenId, currentRound);
    }

    function upgradeFighter(uint256 _tokenId)
        external
        returns (uint256 requestId)
    {
        require(_isApprovedOrOwner(_msgSender(), _tokenId), "ERC721: caller is not token owner or approved");
        require(fighters[_tokenId].round == currentRound, "upgradeFighter: fighter needs to join current game round");
        require(fighters[_tokenId].nextUpgrade < block.timestamp, "Fighters can only be upgraded every 24 hours");
      
        // Will revert if subscription is not set and funded.
        requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        // Map the request id to the token id
        requestIdToTokenId[requestId] = _tokenId;
        fighters[_tokenId].nextUpgrade = block.timestamp + 1 days;

        emit FighterUpgradeRequested(msg.sender, _tokenId);
        return requestId;
    }

    // Gets called automatically from the chainlink VRF once randomness has been generated
    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {

        // Update the powerlevel of the NFT
        uint256 tokenIdToUpgrade = requestIdToTokenId[_requestId];
        uint256 upgradeAmount = (_randomWords[0] % 2500) + 1; // Random value in the range of 1 to 2500
        fighters[tokenIdToUpgrade].powerLevel += upgradeAmount;

        emit FighterUpgraded(msg.sender, tokenIdToUpgrade, upgradeAmount, fighters[tokenIdToUpgrade].powerLevel, fighters[tokenIdToUpgrade].round);
        if (fighters[tokenIdToUpgrade].powerLevel > 9000) {
            endFight(tokenIdToUpgrade);
        }
    }
    
    /**
     * 721 functions
     */

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

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
