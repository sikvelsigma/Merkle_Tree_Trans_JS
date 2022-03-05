"use strict"
const { readJsonData } = require("./misc")
const Web3 = require('web3')

class _Node {
    /*
    Class is used to store each leaf on a merkle tree
    */
    constructor(value, id = null, left = null, right = null, parent = null) {
        this.left = left
        this.right = right
        this.value = value
        this.parent = parent
        this.id = id
    }
}

class MerkleTree {
    /*
    Merkle tree class, takes data as an array of arrays with elements to hash
        singleNodeMode defines how an odd node is handled:
            0: promote to next layer
            1: pair with itself
            2: push at the start of the next layer
        encodeType defines how initial data is encoded

    */
    constructor(data, singleNodeMode = 0, encodeType = 0, encodeArray = null) {
        // check parameters 
        if (encodeType && !encodeArray) {
            throw new Error('encodeType is 1 but no encodeArray was specified')
        }
        if (singleNodeMode > 2) {
            throw new Error('Incorrect singleNodeMode')
        }

        // ease of access to hash function
        let web3 = new Web3(Web3.givenProvider || "ws://localhost:8545")
        this.web3 = web3
        this.keccak = web3.utils.soliditySha3

        this.encodeType = encodeType
        this.encodeArray = encodeArray
        // initial values hashing
        let hashData = this.listToKeccak(data)

        // store initial nodes here with initial data as keys
        this.initialNodes = {}

        // make initial nodes
        let nodes = []
        let hash, key
        for (let i = 0; i < data.length; i++) {
            hash = hashData[i]
            key = data[i]
            this.initialNodes[key] = new _Node(hash, i)
            nodes.push(this.initialNodes[key])
        }

        // array for storing nodes by layer
        this.nodesByLayers = []
        this.nodesByLayers.push(nodes)

        // tree creation
        let currentId = nodes.length - 1
        let parents, node1, node2, left, right
        while (nodes.length > 1) {
            // store next layer nodes in this array
            parents = []
            for (let i = 0; i < nodes.length; i += 2) {
                // left node is always present
                node1 = nodes[i]

                // odd node handling
                if (i + 1 < nodes.length) {
                    node2 = nodes[i + 1]
                } else {
                    switch (singleNodeMode) {
                        case 0:
                            node2 = null
                            break
                        case 1:
                            node2 = nodes[i]
                            break
                        case 2:
                            parents.unshift(node1)
                            nodes.pop()
                            continue
                    }
                }
                // node with the smallest hash value is on the left
                if (node2) {
                    if (node1.value > node2.value) {
                        left = node2
                        right = node1
                    } else {
                        left = node1
                        right = node2
                    }
                    hash = this.keccak(left.value, right.value)
                } else {
                    // promote an odd node if singleNodeMode === 0
                    left = node1
                    right = null
                    hash = node1.value
                }
                currentId++

                // push a new node into next layer and assign it as a parent
                // to left and right nodes
                parents.push(new _Node(hash, currentId, left, right))
                node1.parent = parents[parents.length - 1]
                if (node2) {
                    node2.parent = parents[parents.length - 1]
                }
            }
            // save the next layer for ease of access
            if (parents) {
                this.nodesByLayers.push(parents)
            }

            // promote next layer as the new working layer
            nodes = parents
        }
        // get root as a last node created
        this._rootNode = nodes[0]
    }

    _getProof(node) {
        // gets proof as an array of _Node objects
        // proof is created by going up the tree and searching for neighbor nodes
        let res = []
        let parent, neighbor
        let currentNode = node
        while (currentNode.parent) {
            parent = currentNode.parent
            if (currentNode === parent.left) {
                neighbor = parent.right
            } else {
                neighbor = parent.left
            }
            if (neighbor) {
                res.push(neighbor)
            }
            currentNode = parent
        }
        return res
    }

    getProof(node) {
        // gets proof as an array of hash values
        let proof = this._getProof(node)
        let res = []
        for (let i = 0; i < proof.length; i++) {
            res.push(proof[i].value)
        }
        return res
    }

    verify(proof, root, leaf) {
        // verify that leaf is in a tree
        // this assumes each pair of nodes are sorted by hash value
        let resultHash = leaf
        let hash
        for (let i = 0; i < proof.length; i++) {
            hash = proof[i]
            if (resultHash <= hash) {
                resultHash = this.keccak(resultHash, hash)
            } else {
                resultHash = this.keccak(hash, resultHash)
            }
        }
        return resultHash === root
    }

    printIdsByLayers() {
        // output node ids by layer with their children in brakets
        let st, n, c1, c2
        for (let i = 0; i < this.nodesByLayers.length; i++) {
            st = ""
            for (let j = 0; j < this.nodesByLayers[i].length; j++) {
                n = this.nodesByLayers[i][j]
                c1 = (n.left) ? n.left.id : ""
                c2 = (n.right) ? n.right.id : ""
                st = st + `  ${n.id}(${c1},${c2})`
            }
            console.log(`layer ${i}: ${st}`)
        }
    }

    listToKeccak(inp) {
        // consverts an array of arrays with elements into an array of hashes
        let res = []
        let encoded
        for (let i = 0; i < inp.length; i++) {
            switch (this.encodeType) {
                case 0:
                    encoded = this.keccak(...inp[i])
                    break
                case 1:
                    encoded = this.web3.eth.abi.encodeParameters(this.encodeArray, inp[i])
                    encoded = this.keccak(encoded)
                    break
            }
            res.push(encoded)
        }
        return res
    }

    get rootNode() {
        // gets the root _Node object
        return this._rootNode
    }
    get merkleRoot() {
        // get the root hash value
        return this._rootNode.value
    }

}

let data = readJsonData("rewardDistribution2")
let tree = new MerkleTree(data, 0, 1, ["uint256", "address", "uint256"])

console.log(tree.merkleRoot)

// // tree.printIdsByLayers()

// let tNum = 0
// let targetNode = tree.initialNodes[data[tNum]]
// let proof = tree.getProof(targetNode)
// console.log(proof)

// let cNum = 0
// let check = tree.initialNodes[data[cNum]].value
// let isInTree = tree.verify(proof, tree.merkleRoot, check)
// console.log(isInTree)

module.exports = {
    MerkleTree
}