import * as crypto from 'crypto';



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
        const block = new Block([new Transaction("0x0", "0x1", 30_000)],"0x00")  // genesis block
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
            // const blockHash = this.hashBlock(newBlock)
            // newBlock.setHash(blockHash)
            this.chain.push(newBlock);
        }
    }


}

class Wallet {
    public publicKey: string;
    public privateKey: string;

    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }

    sendMoney(amount: number, payeePublicKey: string) {
        const time = Date.now()
        const transaction = {from:this.publicKey, to:payeePublicKey, value:amount,timestamp :time};

        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        const signature = sign.sign(this.privateKey);
        const tx = new Transaction(transaction.from,transaction.to,transaction.value,signature,time)
        Chain.instance.addBlock(tx, this.publicKey, signature);
    }
}





