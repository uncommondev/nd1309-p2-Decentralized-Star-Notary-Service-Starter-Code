const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
    const res = await instance.tokenIdToStarInfo.call(tokenId)
    assert.equal(res.name, 'Awesome Star!')
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    // Credit to Raul for the fix: https://github.com/udacity/nd1309-p2-Decentralized-Star-Notary-Service-Starter-Code/pull/16/files
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    // Raul's fix
    const balanceOfUser2BeforeTransaction = web3.utils.toBN(await web3.eth.getBalance(user2))
    const txInfo = await instance.buyStar(starId, {from: user2, value: balance})
    const balanceAfterUser2BuysStar = web3.utils.toBN(await web3.eth.getBalance(user2))
    // Calculating the gas fee
    const tx = await web3.eth.getTransaction(txInfo.tx);
    const gasPrice = web3.utils.toBN(tx.gasPrice);
    const gasUsed = web3.utils.toBN(txInfo.receipt.gasUsed);
    const txGasCost = gasPrice.mul(gasUsed)
    // Calculating the final balance
    const starPriceBN = web3.utils.toBN(starPrice);
    const expectedFinalBalance = balanceOfUser2BeforeTransaction.sub(starPriceBN).sub(txGasCost);
    assert.equal(expectedFinalBalance.toString(), balanceAfterUser2BuysStar.toString());
});

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async() => {
    let instance = await StarNotary.deployed();

    // 1. create a Star with different tokenId
    let tokenId = 6;
    await instance.createStar('Super Star!', tokenId, {from: accounts[0]})
    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    assert.equal(await instance.name(), "StarNotary")
    assert.equal(await instance.symbol(), "STR")
});

it('lets 2 users exchange stars', async() => {
    let instance = await StarNotary.deployed();
    // 1. create 2 Stars with different tokenId
    let tokenId1 = 7;
    let tokenId2 = 8;
    await instance.createStar('Giant Star One!', tokenId1, {from: accounts[0]})
    await instance.createStar('Giant Star Two!', tokenId2, {from: accounts[1]})
    // 2. Call the exchangeStars functions implemented in the Smart Contract
    await instance.exchangeStars(tokenId1, tokenId2)
    // 3. Verify that the owners changed
    assert.equal(await instance.ownerOf(tokenId1), accounts[1]) // Token 1 belongs to Account 2
    assert.equal(await instance.ownerOf(tokenId2), accounts[0]) // Token 2 belongs to Account 1
});

it('lets a user transfer a star', async() => {
    let instance = await StarNotary.deployed();
    // 1. create a Star with different tokenId
    let tokenId = 9;
    await instance.createStar('Mega Star!', tokenId, {from: accounts[0]})
    // 2. use the transferStar function implemented in the Smart Contract
    await instance.transferStar(accounts[1], tokenId)
    // 3. Verify the star owner changed.
    assert.equal(await instance.ownerOf(tokenId), accounts[1]) // Account 2 should be the owner of the token created by account 1
});

it('lookUptokenIdToStarInfo test', async() => {
    let instance = await StarNotary.deployed();
    // 1. create a Star with different tokenId
    let tokenId = 10;
    await instance.createStar('Supernova Star!', tokenId, {from: accounts[0]})
    // 2. Call your method lookUptokenIdToStarInfo
    const starResult = await instance.lookUptokenIdToStarInfo(tokenId)
    // 3. Verify if you Star name is the same
    assert.equal(starResult, "Supernova Star!")
});