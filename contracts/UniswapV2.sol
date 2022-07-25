// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";

error UniswapV2__InvalidAddress();
error UniswapV2__InsufficientTokenA();
error UniswapV2__InsufficientTokenB();

contract UniswapV2 {
    IERC20 public tokenA;
    IERC20 public tokenB;
    address public immutable tokenAAddress;
    address public immutable tokenBAddress;
    address private constant FACTORY = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    address private constant ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    event LiquidityAdded(uint256 indexed tokenA, uint256 indexed tokenB, uint256 liquidity);
    event LiquidityRemoved(uint256 amountA, uint256 amountB);

    constructor(address _tokenA, address _tokenB) {
        if (_tokenA == address(0) || _tokenB == address(0)) {
            revert UniswapV2__InvalidAddress();
        }
        tokenAAddress = _tokenA;
        tokenBAddress = _tokenB;
    }

    function addLiquidity(uint256 _amountA, uint256 _amountB) external {
        if (IERC20(tokenAAddress).balanceOf(msg.sender) < _amountA) {
            revert UniswapV2__InsufficientTokenA();
        }

        if (IERC20(tokenBAddress).balanceOf(msg.sender) < _amountB) {
            revert UniswapV2__InsufficientTokenB();
        }

        IERC20(tokenAAddress).transferFrom(msg.sender, address(this), _amountA);
        IERC20(tokenBAddress).transferFrom(msg.sender, address(this), _amountB);

        IERC20(tokenAAddress).approve(ROUTER, _amountA);
        IERC20(tokenBAddress).approve(ROUTER, _amountB);

        (uint256 amountA, uint256 amountB, uint256 liquidity) = IUniswapV2Router02(ROUTER)
            .addLiquidity(
                tokenAAddress,
                tokenBAddress,
                _amountA,
                _amountB,
                1,
                1,
                address(this),
                block.timestamp + 15
            );

        emit LiquidityAdded(amountA, amountB, liquidity);
    }

    function removeLiquidity() external {
        address pair = IUniswapV2Factory(FACTORY).getPair(tokenAAddress, tokenBAddress);

        uint256 liquidity = IERC20(pair).balanceOf(address(this));
        IERC20(pair).approve(ROUTER, liquidity);

        (uint256 amountA, uint256 amountB) = IUniswapV2Router02(ROUTER).removeLiquidity(
            tokenAAddress,
            tokenBAddress,
            liquidity,
            1,
            1,
            address(this),
            block.timestamp
        );

        emit LiquidityRemoved(amountA, amountB);
    }
}
