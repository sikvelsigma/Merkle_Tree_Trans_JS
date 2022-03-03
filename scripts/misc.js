"use strict";
const fs = require('fs');

/*
Read json with data and parse it into an array
*/
function readJsonData(name) {
    let rawdata = fs.readFileSync(`./data/${name}.json`);
    let parsedData = JSON.parse(rawdata);
    let res = [];

    let key = "distribution";
    let index, account, amount
    for (let i = 0; i < parsedData[key].length; i++) {
        index = parsedData[key][i]["index"];
        account = parsedData[key][i]["address"];
        amount = parseInt(parsedData[key][i]["amount"]["hex"]);
        res.push([index, account, amount]);
    }

    return res
}

module.exports = {
    readJsonData
};

// data = readJsonData("rewardDistribution2")
// console.log(data);