const hre = require('hardhat');
const ethers = hre.ethers;
const BigNumber = ethers.BigNumber;

const Comptroller = "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B";

const cSUSHI = "0x4b0181102a0112a2ef11abee5563bb4a3176c9d7";
const cMKR = "0x95b4eF2869eBD94BEb4eEE400a99824BF5DC325b";
const cYFI = "0x80a2ae356fc9ef4305676f7a3e2ed04e12c33946";
const cAAVE = "0xe65cdb6479bac1e22340e4e755fae7e509ecd06c";
const cTUSD = "0x12392f67bdf24fae0af363c24ac620a2f67dad86";
const cSAI = "0xF5DCe57282A584D2746FaF1593d3121Fcac444dC";

const affectedCTokens = [ cSUSHI, cMKR, cYFI, cAAVE, cTUSD, cSAI ];

const abiCoder = new ethers.utils.AbiCoder();

const compInitialIndex = BigNumber.from("1000000000000000000000000000000000000");

const outputProposalSim = false;

var accounts = new Set();
var overAccruedAmounts = new Map();

function createFilter(event, cToken) {
    return {
        address: Comptroller,
        fromBlock: 13322798,
        toBlock: 'latest',
        topics: [
            event,
            ethers.utils.hexZeroPad(cToken, 32)
        ]
    };
}

async function processLog(log) {
    const decodedData = abiCoder.decode(["uint", "uint"], log['data']);

    const cToken = log['topics'][1];

    var account = ethers.utils.hexStripZeros(log['topics'][2]);
    while (account.length != 42)
        account = "0x0" + account.substring(2);

    const compDelta = decodedData[0];
    const compBorrowIndex = decodedData[1];

    if (compDelta.gt(0) && compBorrowIndex.eq(compInitialIndex)) {
        // This log is a record of the over accrued COMP (= compDelta)

        var overAccrued = BigNumber.from(0);

        if (accounts.has(account))
            overAccrued = overAccruedAmounts.get(account);
        else
            accounts.add(account);

        overAccrued = overAccrued.add(compDelta);

        overAccruedAmounts.set(account, overAccrued);

        console.log(log.transactionHash + "," + account + "," + ethers.utils.formatEther(compDelta, {commify: true}));
    }
}

async function main() {
    const comptroller = await hre.ethers.getContractAt("Comptroller", Comptroller);

    console.log("Processing logs...");

    for (const cToken of affectedCTokens) {
        const borrowerFilter = createFilter(ethers.utils.id('DistributedBorrowerComp(address,address,uint256,uint256)'), cToken);
        const supplierFilter = createFilter(ethers.utils.id('DistributedSupplierComp(address,address,uint256,uint256)'), cToken);

        const filters = [ borrowerFilter, supplierFilter ];

        for (const filter of filters) {
            await ethers.provider.getLogs(filter).then(async (logs) => {
                for (var j = 0; j < logs.length; ++j) {
                    await processLog(logs[j]);
                }
            });
        }
    }

    console.log("Printing over accrued...");

    const sorted = new Map([...overAccruedAmounts.entries()].sort((a, b) => b[1] - a[1]));

    var totalOverAccrued = BigNumber.from(0);
    var totalCurrentAccrued = BigNumber.from(0);

    for (const [account, amount] of sorted) {
        const currentAccrued = await comptroller.compAccrued(account);

        console.log(account + "," + ethers.utils.formatEther(amount, {commify: true}) + "," + ethers.utils.formatEther(currentAccrued, {commify: true}));

        totalOverAccrued = totalOverAccrued.add(amount);
        totalCurrentAccrued = totalCurrentAccrued.add(currentAccrued);
    }

    console.log("Total over accrued =", ethers.utils.formatEther(totalOverAccrued, {commify: true}));
    console.log("Total current accrued =", ethers.utils.formatEther(totalCurrentAccrued, {commify: true}));

    if (outputProposalSim) {
        var proposalAccounts = "";
        var proposalAmounts = "";

        for (const [account, amount] of sorted) {
            if (proposalAccounts.length > 0) {
                proposalAccounts += " ";
                proposalAmounts += " ";
            }

            proposalAccounts += account;
            proposalAmounts += amount;
        }

        proposalAccounts = "[" + proposalAccounts + "]";
        proposalAmounts = "[" + proposalAmounts + "]";

        console.log("Proposal simulation accounts =", proposalAccounts);
        console.log("Proposal simulation amounts =", proposalAmounts);
        console.log("Proposal sim = From CompHolder (GovernorBravo GovernorBravo Propose \"Upgrade Comptroller\" [(Address Unitroller) (Address NewComptroller) (Address Unitroller)] [0 0 0] [\"_setPendingImplementation(address)\" \"_become(address)\" \"fixBadAccruals(address[],uint256[])\"] [[(Address NewComptroller)] [(Address Unitroller)] [" + proposalAccounts + " " + proposalAmounts + "]])")
    }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
