import { publicKeyCreate } from 'secp256k1';
import { getDeviceMessageHashToSign, getDeviceAddress } from '@obyte/ocore/object_hash';
import { fromWif, decryptPackage, createObjDeviceKey, createEncryptedPackage, sign } from './utils';

const environment = process.env.REACT_APP_ENVIRONMENT;

export default class Client {
  events = {
    ready: [],
    pairing: [],
    message: []
  };

  constructor(config) {
    this.address = config.address ? config.address : environment === 'devnet' ? 'ws://localhost:6611' : `wss://obyte.org/bb${environment === 'testnet' ? "-test" : ""}`;
    this.client = config.client;
    this.config = config;
    const { testnet, wif, tempPrivKey, name } = config;
    const devicePrivKey = fromWif(wif, testnet).privateKey;
    this.devicePubKey = publicKeyCreate(devicePrivKey, true).toString('base64');
    const deviceTempPrivKey = Buffer.from(tempPrivKey, 'base64');
    this.objMyPermDeviceKey = createObjDeviceKey(devicePrivKey);
    const objMyTempDeviceKey = createObjDeviceKey(deviceTempPrivKey);

    this.client.forward((err, result) => {
      const [command, { subject, body }] = result;
      switch (command) {
        case 'justsaying':
          switch (subject) {
            case 'hub/challenge': {
              const objLogin = {
                challenge: body,
                pubkey: this.objMyPermDeviceKey.pub_b64,
                signature: undefined
              };
              objLogin.signature = sign(
                getDeviceMessageHashToSign(objLogin),
                this.objMyPermDeviceKey.priv
              );
              this.client.justsaying('hub/login', objLogin);

              const objTempPubkey = {
                temp_pubkey: objMyTempDeviceKey.pub_b64,
                pubkey: this.objMyPermDeviceKey.pub_b64,
                signature: undefined
              };
              objTempPubkey.signature = sign(
                getDeviceMessageHashToSign(objTempPubkey),
                this.objMyPermDeviceKey.priv
              );
              this.client.client.request('hub/temp_pubkey', objTempPubkey);
              this.client.justsaying('hub/refresh', null);
              this.trigger('ready', null);
              break;
            }
            case 'hub/message': {
              try {
                const objEncryptedPackage = body.message.encrypted_package;
                const decryptedPackage = decryptPackage(objEncryptedPackage, objMyTempDeviceKey);
                switch (decryptedPackage.subject) {
                  case 'pairing': {
                    if (decryptedPackage.body.reverse_pairing_secret) {
                      const reply = {
                        pairing_secret: decryptedPackage.body.reverse_pairing_secret,
                        device_name: name
                      };
                      this.send(body.message.pubkey, 'pairing', reply).then(() => {
                        const msg = new Message(this, body.message.pubkey, decryptedPackage.body);
                        this.trigger('pairing', msg);
                      });
                    }
                    break;
                  }
                  case 'text': {
                    const msg = new Message(this, body.message.pubkey, decryptedPackage.body);
                    this.trigger('message', msg);
                    break;
                  }
                  default: {
                    break;
                  }
                }
              } catch (e) {
                console.log('Decrypt error', e);
                this.client.justsaying('hub/delete', body.message_hash);
              }
              this.client.justsaying('hub/delete', body.message_hash);
              break;
            }
            default: {
              break;
            }
          }
          break;

        default: {
          break;
        }
      }
    });
  }

  on(event, cb) {
    this.events[event].push(cb);
  }

  trigger(event, msg) {
    this.events[event].forEach(cb => cb(msg));
  }

  async send(recipientDevicePubkey, subject, body) {
    const myDeviceAddress = getDeviceAddress(this.devicePubKey);
    const myDeviceHub = this.address.replace('wss://', '').replace('ws://', '');
    const json = { from: myDeviceAddress, device_hub: myDeviceHub, subject, body };
    const objTempPubkey = await this.client.requestAsync(
      'hub/get_temp_pubkey',
      recipientDevicePubkey
    );
    const objEncryptedPackage = createEncryptedPackage(json, objTempPubkey.temp_pubkey);
    const recipientDeviceAddress = getDeviceAddress(recipientDevicePubkey);
    const objDeviceMessage = {
      encrypted_package: objEncryptedPackage,
      to: recipientDeviceAddress,
      pubkey: this.objMyPermDeviceKey.pub_b64,
      signature: undefined
    };
    objDeviceMessage.signature = sign(
      getDeviceMessageHashToSign(objDeviceMessage),
      this.objMyPermDeviceKey.priv
    );
    return this.client.requestAsync('hub/deliver', objDeviceMessage);
  }
}

class Message {
  constructor(client, sender, body) {
    this.client = client;
    this.sender = sender;
    this.body = body;
  }

  reply(body) {
    return this.client.send(this.sender, 'text', body);
  }
}