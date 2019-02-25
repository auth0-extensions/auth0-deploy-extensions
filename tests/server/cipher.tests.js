import expect from 'expect';

import Cipher from '../../server/lib/cipher';

const password = 'testpwd';
const cipher = new Cipher(password);
let encoded;

describe('cipher', () => {
  it('should encode string', (done) => {
    cipher.encrypt('test-text')
      .then((res) => {
        encoded = res;
        expect(res).toMatch(/\[!cipher][0-9a-fA-F]+-[0-9a-fA-F]+\[rehpic!]/);
        done();
      });
  });

  it('should decode string', (done) => {
    cipher.decrypt(encoded)
      .then((res) => {
        expect(res.original).toEqual(encoded);
        expect(res.plain).toEqual('test-text');
        done();
      });
  });

  it('should not decode with wrong password', (done) => {
    const badCipher = new Cipher('password');

    badCipher.decrypt(encoded)
      .catch((err) => {
        expect(err.message).toEqual('Libsodium error: Error: wrong secret key for the given ciphertext');
        done();
      });
  });
});
