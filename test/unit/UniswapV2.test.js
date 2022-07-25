const { assert, expect } = require("chai")
const { network, ethers, getNamedAccounts, deployments } = require("hardhat")

const { networkConfig } = require("../../helper-hardhat-config")
const { impersonateAccount } = require("../../utils/impersonate-account")
require("dotenv").config()

describe("UniswapV2", function () {
    let uniswapV2, accounts, tokenA, tokenB, deployer, daiSigner, wethSigner
    const DAI_WHALE = networkConfig[network.config.chainId].daiWhale
    const WETH_WHALE = networkConfig[network.config.chainId].wethWhale
    const DAI_TOKEN = networkConfig[network.config.chainId].daiToken
    const WETH_TOKEN = networkConfig[network.config.chainId].wethToken

    const TOKENA_AMOUNT = ethers.utils.parseEther("10")
    const TOKENB_AMOUNT = ethers.utils.parseEther("10")

    const LIQUIDITY = ethers.utils.parseEther("10")

    beforeEach(async () => {
        accounts = await ethers.getSigners()
        deployer = accounts[0].address
        await deployments.fixture(["uniswap"])

        await impersonateAccount(DAI_WHALE)
        await impersonateAccount(WETH_WHALE)

        daiSigner = await ethers.getSigner(DAI_WHALE)
        wethSigner = await ethers.getSigner(WETH_WHALE)

        tokenA = await ethers.getContractAt("IERC20", DAI_TOKEN, daiSigner)
        tokenB = await ethers.getContractAt("IERC20", WETH_TOKEN, wethSigner)

        uniswapV2 = await ethers.getContract("UniswapV2", deployer)

        let tx = {
            to: deployer,
            value: ethers.utils.parseEther("1"),
        }
        await daiSigner.sendTransaction(tx)
        await wethSigner.sendTransaction(tx)

        await tokenA.transfer(deployer, TOKENA_AMOUNT)
        await tokenB.transfer(deployer, TOKENB_AMOUNT)

        await tokenA.connect(accounts[0]).approve(uniswapV2.address, TOKENA_AMOUNT)
        await tokenB.connect(accounts[0]).approve(uniswapV2.address, TOKENB_AMOUNT)
    })

    describe("constructor", function () {
        it("initializes the uniswapv2 correctly", async function () {
            let tokenAAddress = await uniswapV2.tokenAAddress()
            let tokenBAddress = await uniswapV2.tokenBAddress()
            assert.equal(tokenAAddress.toString(), tokenA.address)
            assert.equal(tokenBAddress.toString(), tokenB.address)
        })
    })

    describe("addLiquidity", function () {
        it("should revert when token A amount exceeds available token A", async function () {
            let exceedTokenA = ethers.utils.parseEther("20")
            await expect(uniswapV2.addLiquidity(exceedTokenA, TOKENB_AMOUNT)).to.be.revertedWith(
                "UniswapV2__InsufficientTokenA"
            )
        })

        it("should revert when token B amount exceeds available token B", async function () {
            let exceedTokenB = ethers.utils.parseEther("20")
            await expect(uniswapV2.addLiquidity(TOKENA_AMOUNT, exceedTokenB)).to.be.revertedWith(
                "UniswapV2__InsufficientTokenB"
            )
        })

        it("should add and remove liquidity and emit an event", async function () {
            let addLiquidityTx = await uniswapV2.addLiquidity(TOKENA_AMOUNT, TOKENB_AMOUNT)
            let addLiquidityTxReceipt = await addLiquidityTx.wait(1)
            expect(addLiquidityTxReceipt)
                .to.emit("LiquidityAdded")
                .withArgs(TOKENA_AMOUNT, TOKENB_AMOUNT, LIQUIDITY)

            let removeLiquidityTx = await uniswapV2.connect(accounts[0]).removeLiquidity()
            let removeLiquidityTxReceipt = await removeLiquidityTx.wait(1)
            expect(removeLiquidityTxReceipt)
                .to.emit("LiquidityRemoved")
                .withArgs(TOKENA_AMOUNT, TOKENB_AMOUNT)
        })
    })
})
