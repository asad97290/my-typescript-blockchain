import * as crypto from 'crypto';
import  keccak256 from 'keccak256';



class Transaction {
    constructor(
        public from: string,
        public to: string,
        public value: number,
        public signature = Buffer.from(""),
        public timestamp = Date.now(),
    ) {

    }


}

class Block {
    constructor(
        public transactions: Transaction[],
        public prevHash: string,
        public timestamp = Date.now(),
        public hash = "",
    ) {
        const str = JSON.stringify({transactions: transactions,prevHash: prevHash,timestamp: timestamp})
        const BlockHash = crypto.createHash('SHA256')
        this.hash = BlockHash.update(str).digest('hex');
    }
  

}

class Chain {
    public static instance = new Chain();

    chain: Block[]

    constructor() {
        const block = new Block([new Transaction("0x", "0x1", 30)],"0000000000000000000000000000000000000000000000000000000000000000")  // genesis block
        this.chain = [
            block
        ];

    }


    get lastBlock() {
        return this.chain[this.chain.length - 1]
    }


  

    // Add a new block to the chain if valid signature & proof of work is complete
    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
        const verify = crypto.createVerify('SHA256');
        verify.update(transaction.toString());

        const isValid = verify.verify(senderPublicKey, signature);

        if (isValid) {
            const newBlock = new Block([transaction],this.lastBlock.hash )
            this.chain.push(newBlock);
        }
    }


}

class Wallet {
    public publicKey: string;
    public privateKey: string;

    constructor() {
      
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
            namedCurve: 'secp256k1', // Curve used in Bitcoin, Ethereum, etc.
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        this.privateKey = privateKey;
        this.publicKey = publicKey;
    }

    sendMoney(amount: number, payeePublicKey: string) {
        const time = Date.now()
        const transaction = {from:this.publicKey, to:payeePublicKey, value:amount};

        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        const signature = sign.sign(this.privateKey);
        const tx = new Transaction(transaction.from,transaction.to,transaction.value,signature,time)
        Chain.instance.addBlock(tx, this.publicKey, signature);
    }
}





const alice = new Wallet();
const bob = new Wallet();

alice.sendMoney(1,bob.publicKey)


const privateKey = crypto.randomBytes(32);
console.log(privateKey.toString("hex"))
// Generate the public key using ECDH on secp256k1 curve
const ecdh = crypto.createECDH('secp256k1');
ecdh.setPrivateKey(privateKey);
const publicKey = ecdh.getPublicKey(null, 'uncompressed').slice(1); // Remove 0x04 prefix
const address = keccak256(publicKey); // Last 20 bytes

console.log(address.toString("hex").slice(-40));
