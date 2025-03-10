// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title PortfolioTracker
 * @dev A smart contract for tracking investment positions in a portfolio
 */
contract PortfolioTracker {
    // Position struct to store position details
    struct Position {
        address token;         // Address of the token
        uint256 amount;        // Amount of tokens in the position
        uint256 entryPrice;    // Entry price in USD (scaled by 1e18)
        uint256 timestamp;     // Timestamp when position was created
        string protocol;       // Protocol name (e.g., "Uniswap", "Aave")
        bool active;           // Whether position is active
    }

    // Mapping from user address to their positions
    mapping(address => Position[]) private userPositions;
    
    // Total number of positions per user
    mapping(address => uint256) private positionCount;
    
    // Events
    event PositionAdded(address indexed user, uint256 positionId, address token, uint256 amount, uint256 entryPrice, string protocol);
    event PositionRemoved(address indexed user, uint256 positionId);
    event PositionUpdated(address indexed user, uint256 positionId, uint256 newAmount, uint256 newEntryPrice);

    // Modifiers
    modifier validPositionId(uint256 _positionId) {
        require(_positionId < userPositions[msg.sender].length, "Invalid position ID");
        require(userPositions[msg.sender][_positionId].active, "Position is not active");
        _;
    }

    /**
     * @dev Add a new position to the user's portfolio
     * @param _token Address of the token
     * @param _amount Amount of tokens in the position
     * @param _entryPrice Entry price in USD (scaled by 1e18)
     * @param _protocol Protocol name
     * @return positionId ID of the newly created position
     */
    function addPosition(
        address _token,
        uint256 _amount,
        uint256 _entryPrice,
        string memory _protocol
    ) external returns (uint256) {
        // Create new position
        Position memory newPosition = Position({
            token: _token,
            amount: _amount,
            entryPrice: _entryPrice,
            timestamp: block.timestamp,
            protocol: _protocol,
            active: true
        });
        
        // Add position to user's portfolio
        userPositions[msg.sender].push(newPosition);
        uint256 positionId = userPositions[msg.sender].length - 1;
        positionCount[msg.sender]++;
        
        // Emit event
        emit PositionAdded(msg.sender, positionId, _token, _amount, _entryPrice, _protocol);
        
        return positionId;
    }

    /**
     * @dev Remove a position from the user's portfolio
     * @param _positionId ID of the position to remove
     */
    function removePosition(uint256 _positionId) external validPositionId(_positionId) {
        // Mark position as inactive (soft delete)
        userPositions[msg.sender][_positionId].active = false;
        positionCount[msg.sender]--;
        
        // Emit event
        emit PositionRemoved(msg.sender, _positionId);
    }

    /**
     * @dev Update an existing position
     * @param _positionId ID of the position to update
     * @param _newAmount New amount of tokens
     * @param _newEntryPrice New entry price
     */
    function updatePosition(
        uint256 _positionId,
        uint256 _newAmount,
        uint256 _newEntryPrice
    ) external validPositionId(_positionId) {
        Position storage position = userPositions[msg.sender][_positionId];
        position.amount = _newAmount;
        position.entryPrice = _newEntryPrice;
        
        // Emit event
        emit PositionUpdated(msg.sender, _positionId, _newAmount, _newEntryPrice);
    }

    /**
     * @dev Get a specific position from the user's portfolio
     * @param _user Address of the user
     * @param _positionId ID of the position
     * @return Position data
     */
    function getPosition(address _user, uint256 _positionId) external view returns (Position memory) {
        require(_positionId < userPositions[_user].length, "Invalid position ID");
        return userPositions[_user][_positionId];
    }

    /**
     * @dev Get all active positions for a user
     * @param _user Address of the user
     * @return Array of all active positions
     */
    function getAllPositions(address _user) external view returns (Position[] memory) {
        uint256 activeCount = positionCount[_user];
        Position[] memory activePositions = new Position[](activeCount);
        
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < userPositions[_user].length; i++) {
            if (userPositions[_user][i].active) {
                activePositions[currentIndex] = userPositions[_user][i];
                currentIndex++;
            }
        }
        
        return activePositions;
    }

    /**
     * @dev Get the total number of active positions for a user
     * @param _user Address of the user
     * @return Number of active positions
     */
    function getPositionCount(address _user) external view returns (uint256) {
        return positionCount[_user];
    }
}

