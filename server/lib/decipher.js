const magic = require('auth0-magic');

export class Decipher {
  constructor(sk) {
    this.sk = sk;
    this.promises = [];
  }

  decrypt(data) {
    const [ ciphertext, nonce ] = data.replace('[!cipher]', '').replace('[rehpic!]', '').split('-');
    return magic.decrypt.aead(this.sk, ciphertext, nonce)
      .then(plaintext => ({ original: data, plain: plaintext.toString('utf8') }));
  }

  decryptString(string) {
    const pattern = /\[!cipher][0-9a-fA-F]+-[0-9a-fA-F]+\[rehpic!]/g;
    const items = string.match(pattern) || [];
    const promises = [];

    items.forEach((item) => promises.push(this.decrypt(item)));

    return Promise.all(promises)
      .then((results) => {
        let newString = string;

        results.forEach((text) => {
          newString = newString.replace(text.original, text.plain);
        });

        return newString;
      });
  }

  prepareData(data) {
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === 'string') {
        this.promises.push(this.decryptString(data[key]).then((decrypted) => {
          data[key] = decrypted;
        }));
      } else if (typeof data[key] === 'object') {
        this.prepareData(data[key]);
      }
    });
  }

  processData() {
    return Promise.all(this.promises);
  }
}

export class Cipher {
  constructor(sk) {
    this.sk = sk;
  }

  encrypt(text) {
    return magic.encrypt.aead(text, this.sk)
      .then(output => `[!cipher]${output.ciphertext.toString('hex')}-${output.nonce.toString('hex')}[rehpic!]`);
  }
}
