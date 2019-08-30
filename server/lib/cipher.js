const magic = require('auth0-magic');

export default class Cipher {
  constructor(password) {
    this.password = password;
  }

  decrypt(data) {
    const [ ciphertext, nonce ] = data.split('-');
    return magic.pwdDecrypt.aead(this.password, ciphertext, nonce)
      .then(plaintext => plaintext.toString('utf8'));
  }

  encrypt(text) {
    return magic.pwdEncrypt.aead(text, this.password)
      .then(output => `${output.ciphertext.toString('hex')}-${output.nonce.toString('hex')}`);
  }
}
