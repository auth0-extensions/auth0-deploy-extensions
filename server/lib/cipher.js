const magic = require('auth0-magic');

export default class Cipher {
  constructor(password) {
    this.password = password;
  }

  decrypt(data) {
    const [ ciphertext, nonce ] = data.replace('[!cipher]', '').replace('[rehpic!]', '').split('-');
    return magic.pwdDecrypt.aead(this.password, ciphertext, nonce)
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

  prepareData(data, promises = []) {
    if (data) {
      Object.keys(data).forEach((key) => {
        if (typeof data[key] === 'string') {
          promises.push(this.decryptString(data[key]).then((decrypted) => {
            data[key] = decrypted;
          }));
        } else if (typeof data[key] === 'object') {
          this.prepareData(data[key], promises);
        }
      });
    }

    return promises;
  }

  processData(data) {
    return Promise.all(this.prepareData(data));
  }

  encrypt(text) {
    return magic.pwdEncrypt.aead(text, this.password)
      .then(output => `[!cipher]${output.ciphertext.toString('hex')}-${output.nonce.toString('hex')}[rehpic!]`);
  }
}
