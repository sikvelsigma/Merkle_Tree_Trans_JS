"use strict";
const { readJsonData } = require("./misc");
const Web3 = require('web3');

/*
Class is used to store each leaf on a merkle tree
*/
class _Node {
    constructor(value, id = null, left = null, right = null, parent = null) {
        this.left = left;
        this.right = right;
        this.value = value;
        this.parent = parent;
        this.id = id;
    }
}

/*
Merkle tree class, takes data as an array of arrays with elements to hash
    singleNodeMode defines how an odd node is handled:
        0: promote to next layer
        1: pair with itself
        2: push at the start of the next layer
*/
class MerkleTree {
    constructor(data, singleNodeMode = 0) {
        // ease of access to hash function
        let web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
        this.keccak = web3.utils.soliditySha3

        // initial values hashing
        let hashData = this.listToKeccak(data)
        this.initialNodes = {}
        let nodes = []

        // make initial nodes
        let hash, key
        for (let i = 0; i < data.length; i++) {
            hash = hashData[i];
            key = data[i];
            this.initialNodes[key] = new _Node(hash, i);
            nodes.push(this.initialNodes[key]);
        }

        // store initial nodes by their initial data for ease of access
        this.nodesByLayers = [];
        this.nodesByLayers.push(nodes);

        // tree creation
        let currentId = nodes.length - 1;
        let parents, node1, node2, left, right
        while (nodes.length > 1) {
            parents = [];
            for (let i = 0; i < nodes.length; i += 2) {
                node1 = nodes[i];

                // odd node handling
                if (i + 1 < nodes.length) {
                    node2 = nodes[i + 1];
                } else {
                    switch (singleNodeMode) {
                        case 0:
                            node2 = null
                            break;
                        case 1:
                            node2 = nodes[i];
                            break;
                        case 2:
                            parents.unshift(node1);
                            nodes.pop();
                            continue;
                    }
                }
                // node with the smallest hash value is on the left
                if (node2) {
                    if (node1.value > node2.value) {
                        left = node2;
                        right = node1;
                    } else {
                        left = node1;
                        right = node2;
                    }
                    hash = this.keccak(left.value, right.value);
                } else {
                    left = node1;
                    right = null;
                    hash = node1.value;
                }
                currentId++;
                
                // push a new node into next layer and assign it as a parent
                // to left and right
                parents.push(new _Node(hash, currentId, left, right));
                node1.parent = parents[parents.length - 1];
                if (node2) {
                    node2.parent = parents[parents.length - 1];
                }
            }
            // store each layer in an array separetly for ease of access
            if (parents) {
                this.nodesByLayers.push(parents);
            }
            nodes = parents;
        }
        // get root as a last node created
        this._rootNode = nodes[0];
    }

    _getProof(node) {
        // gets proof as an array of _Node objects
        let res = [];
        let parent, neighbor
        let currentNode = node
        while (currentNode.parent) {
            parent = currentNode.parent;
            if (currentNode === parent.left) {
                neighbor = parent.right;
            } else {
                neighbor = parent.left;
            }
            if (neighbor) {
                res.push(neighbor);
            }
            currentNode = parent;
        }
        return res
    }

    getProof(node) {
        // gets proof as an array of hash values
        let proof = this._getProof(node);
        let res = []
        for (let i = 0; i < proof.length; i++) {
            res.push(proof[i].value)
        }
        return res
    }

    verify(proof, root, leaf) {
        // verify that leaf is in a tree
        let resultHash = leaf;
        let hash
        for (let i = 0; i < proof.length; i++) {
            hash = proof[i];
            if (resultHash <= hash) {
                resultHash = this.keccak(resultHash, hash);
            } else {
                resultHash = this.keccak(hash, resultHash);
            }
        }
        return resultHash === root
    }

    printIdsByLayers() {
        // output node ids by layer with their children in brakets
        let st, n, c1, c2
        for (let i = 0; i < this.nodesByLayers.length; i++) {
            st = "";
            for (let j = 0; j < this.nodesByLayers[i].length; j++) {
                n = this.nodesByLayers[i][j];
                c1 = (n.left) ? n.left.id : "";
                c2 = (n.right) ? n.right.id : "";
                st = st + `    ${n.id}(${c1},${c2})`;
            }
            console.log(`layer ${i}: ${st}`)
        }
    }

    listToKeccak(inp) {
        // consverts an array of arrays with elements into an array of hashes
        let res = []
        for (let i = 0; i < inp.length; i++) {
            res.push(this.keccak(...inp[i]))
        }
        return res
    }

    get rootNode() {
        return this._rootNode
    }
    get merkleRoot() {
        return this._rootNode.value
    }

}

let data = readJsonData("rewardDistribution2")
let tree = new MerkleTree(data, 2)

console.log(tree.merkleRoot)

// tree.printIdsByLayers()

let tNum = 0
let targetNode = tree.initialNodes[data[tNum]]
let proof = tree.getProof(targetNode)
console.log(proof)

let cNum = 0
let check = tree.initialNodes[data[cNum]].value
let isInTree = tree.verify(proof, tree.merkleRoot, check)
console.log(isInTree)

// let web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
// console.log(web3.utils.soliditySha3(...data[0]));