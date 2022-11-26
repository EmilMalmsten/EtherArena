const Mineralwar = artifacts.require("Mineralwar");

contract('Mineralwar', () => {
  it('should read newly written values', async() => {
    const MineralwarInstance = await Mineralwar.deployed();
    var value = (await MineralwarInstance.read.call()).toNumber();

    assert.equal(value, 0, "0 wasn't the initial value");

    await MineralwarInstance.write(1);
    value = (await MineralwarInstance.read.call()).toNumber();
    assert.equal(value, 1, "1 was not written");

    await MineralwarInstance.write(2);
    value = (await MineralwarInstance.read.call()).toNumber();
    assert.equal(value, 2, "2 was not written");
  });
});
