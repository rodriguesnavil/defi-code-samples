const { network } = require("hardhat")
const {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    if (chainId == 31337) {
        const tokenA = networkConfig[network.config.chainId].daiToken
        const tokenB = networkConfig[network.config.chainId].wethToken

        const uniswapV2 = await deploy("UniswapV2", {
            from: deployer,
            args: [tokenA, tokenB],
            log: true,
        })

        log(`UniswapV2 deployed at ${uniswapV2.address}`)
    }
}

module.exports.tags = ["all", "uniswap"]
