import { Client } from './_texto/main';
import { toWif } from './_texto/utils';
import { randomBytes } from 'crypto';
import client from "services/socket";
import { store } from 'index';
import { setInvite } from 'store/assistantsSlice';

const environment = process.env.REACT_APP_ENVIRONMENT;

const LOCALSTORAGE_KEY = `texto-${environment}`;

let clientConfig;
const testnet = environment === 'testnet';
const lSClientConfig = localStorage.getItem(`${LOCALSTORAGE_KEY}.texto`);

if (lSClientConfig) {
  clientConfig = JSON.parse(lSClientConfig);
} else {
  clientConfig = {
    testnet,
    wif: toWif(randomBytes(32), testnet),
    tempPrivKey: randomBytes(32).toString('base64'),
    prevTempPrivKey: randomBytes(32).toString('base64'),
    name: 'Counterstake.org'
  };
  localStorage.setItem(`${LOCALSTORAGE_KEY}.texto`, JSON.stringify(clientConfig));
}

clientConfig.client = client;

const texto = new Client(clientConfig);

texto.on('ready', () => {
  const devicePubKey = texto.devicePubKey;
  console.log(`Logged in as ${devicePubKey}!`);
  
  store.dispatch(setInvite(`obyte${environment === 'testnet' ? "-tn" : ""}:${devicePubKey}@obyte.org/bb${environment === 'testnet' ? "-test" : ""}`));
});

export default texto;