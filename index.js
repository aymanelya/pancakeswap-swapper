const config = require('./config');

const abis = require('./abis');

const { ethers } = require('ethers');

// connect to the network
let provider = new ethers.providers.JsonRpcProvider(config[config.network].RPC);
// connect the proper wallet
const wallet = new ethers.Wallet(config.userWallet.privateKey, provider);

async function main() {
  // Fetch current gas price from the network
  const gasPrice = await provider.getGasPrice();
  console.log(`Current gas price: ${gasPrice.toString()}`);

  if (config.quickSwapVersion == 2) {
    console.log('USING QUICKSWAP V2 !');
    const quickswapV2RouterContract = new ethers.Contract(
      config[config.network].addresses.quickswapV2Router,
      abis.quickswapV2RouterAbi,
      wallet
    );

    const amountIn = ethers.utils.parseUnits(
      config.swapParams.amountIn,
      config.swapParams.tokenInDecimals
    );
    const amountOutMin = ethers.utils.parseUnits(
      config.swapParams.amountOutMin,
      config.swapParams.tokenOutDecimals
    );

    const path = [
      config.swapParams.tokenInAddress,
      config.swapParams.tokenOutAddress,
    ];

    const deadline = Date.now() + 1000 * 60 * 10;

    let swapResult;

    if (config.swapParams.swapMethod == 'maticToToken') {
      console.log('SWAPPING MATIC TO TOKEN...');
      swapResult =
        await quickswapV2RouterContract.swapExactETHForTokensSupportingFeeOnTransferTokens(
          amountOutMin,
          path, //path
          config.userWallet.address, //to address
          deadline, //deadline
          {
            value: amountIn,
            gasPrice,
          }
        );
      console.log('sent TX');
    } else if (config.swapParams.swapMethod == 'tokenToMatic') {
      console.log('APPROVING TOKENIN...');

      const tokenInContract = new ethers.Contract(
        config.swapParams.tokenInAddress,
        abis.ERC20,
        wallet
      );
      // Approve token
      const approveTx = await tokenInContract.approve(
        config[config.network].addresses.quickswapV2Router,
        amountIn,
        {
          gasPrice,
        }
      );
      await approveTx.wait();

      console.log('SWAPPING TOKEN TO MATIC...');

      swapResult =
        await quickswapV2RouterContract.swapExactTokensForETHSupportingFeeOnTransferTokens(
          amountIn,
          amountOutMin,
          path, //path
          config.userWallet.address, //to address
          deadline, //deadline
          { gasPrice }
        );
      console.log('sent TX');
    } else if (config.swapParams.swapMethod == 'tokenToToken') {
      console.log('APPROVING TOKENIN...');

      const tokenInContract = new ethers.Contract(
        config.swapParams.tokenInAddress,
        abis.ERC20,
        wallet
      );
      // Approve token
      const approveTx = await tokenInContract.approve(
        config[config.network].addresses.quickswapV2Router,
        amountIn,
        { gasPrice }
      );
      await approveTx.wait();
      console.log('SWAPPING TOKEN TO TOKEN...');

      swapResult =
        await quickswapV2RouterContract.swapExactTokensForTokensSupportingFeeOnTransferTokens(
          amountIn,
          amountOutMin,
          path, //path
          config.userWallet.address, //to address
          deadline, //deadline
          {
            gasPrice,
          }
        );
      console.log('sent TX');
    }

    await swapResult.wait();

    console.log(swapResult);
  } else if (config.quickSwapVersion == 3) {
  } else {
    console.log('Wrong quiswapVersion number');
  }
}

main();
