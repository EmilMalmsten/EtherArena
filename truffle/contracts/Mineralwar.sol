// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Mineralwar is ERC1155, Ownable {

    uint256 public constant Concentrator = 0;
    uint256 public constant Minerals = 1;

    mapping (uint256 => string) public tokenURI;
    mapping (address => bool) public hasAddressMinted;

    constructor(string memory uriBase) ERC1155(uriBase) {
      tokenURI[Concentrator] = uriBase;
    }

    /**
     * Returns the custom URI for each token id. Overrides the default ERC-1155 single URI.
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
      // If no URI exists for the specific id requested, fallback to the default ERC-1155 URI.
      if (bytes(tokenURI[tokenId]).length == 0) {
          return super.uri(tokenId);
      }
      return tokenURI[tokenId];
    }
    
    /**
     * Set the URI for a specific token id
     */
    function setURI(string memory new_uri, uint256 token_id) public onlyOwner {
      tokenURI[token_id] = new_uri; 
    }

    /**
     * Mint a concentrator to join the game
     */
    function mintConcentrator() public {
      require(hasAddressMinted[msg.sender] == false, "Your address has already minted a concentrator.");
      _mint(msg.sender, Concentrator, 1, "");
    }

    /**
     * Players with a concentrator can claim 100 minerals per 24h
     */
    function claimMinerals(string memory currentDate) public {
      require(balanceOf(msg.sender, Concentrator) == 1, "A Concentrator is required to claim minerals");
      _mint(msg.sender, Minerals, 100, "");
    }
}

