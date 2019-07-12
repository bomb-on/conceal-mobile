import { useReducer, useRef } from 'react';
import mergeJSON from 'merge-json';
import { appSettings } from '../constants/appSettings';
import { AppColors } from '../constants/Colors';
import { logger } from '../helpers/Logger';
import Toast from 'react-native-root-toast';

const useAppState = () => {
  const initialState = {
    appSettings,
    intervals: [],
    layout: {
      appLoaded: false,
      editContactData: {},
      formSubmitted: false,
      lastUpdate: new Date(),
      message: {},
      qrCodeUrl: '',
      redirectToReferrer: false,
      sendTxResponse: null,
      userLoaded: false,
      walletsLoaded: false
    },
    markets: {
      stex: {
        apiURL: 'https://api.wallet.conceal.network/api/stex/status',
        ask: 0,
        bid: 0,
        volume: 0
      },
      tradeogre: {
        apiURL: 'https://tradeogre.com/api/v1/ticker/BTC-CCX',
        ask: 0,
        bid: 0,
        volume: 0
      },
    },
    network: {
      blockchainHeight: 0
    },
    prices: {
      usd: 0,
      btc: 0
    },
    user: {
      addressBook: [],
      loggedIn: false,
      userName: '',
      password: ''
    },
    userSettings: {
      minimumPasswordLength: 8,
      qrCodeURL: '',
      twoFACode: '',
      twoFAEnabled: false,
      updateWalletsInterval: 10,  // seconds
    },
    wallets: {},
    appData: {
      sendScreen: {
        addrListVisible: false,
        sendConfirmVisible: false,
        securePasswordEntry: true
      },
      scanCode: {
        hasCameraPermission: null,
        scanned: false
      },
      addressEntry: {
        label: null,
        address: null,
        paymentId: null,
        entryId: null,
        headerText: null
      },
      login: {
        userName: ''
      }
    }
  };
  const updatedState = useRef(initialState);

  const reducer = (state, action) => {
    let result = {};
    switch (action.type) {
      case 'USER_LOGGED_IN':
        if (!state.user.loggedIn) logger.log('LOGGING IN USER...');
        result = {
          ...state,
          user: {
            ...state.user,
            loggedIn: true
          },
        };
        break;
      case 'SET_TOKEN':
        result = {
          ...state,
          user: {
            ...state.user,
            token: action.token,
          },
        };
        break;
      case 'USER_LOADED':
        result = {
          ...state,
          layout: {
            ...state.layout,
            userLoaded: true,
          },
          user: {
            ...state.user,
            ...action.user,
          },
        };
        break;
      case '2FA_CHECK':
        result = {
          ...state,
          userSettings: {
            ...state.userSettings,
            twoFAEnabled: action.value,
          },
        };
        break;
      case 'UPDATE_QR_CODE':
        result = {
          ...state,
          layout: {
            ...state.layout,
            qrCodeUrl: action.qrCodeUrl,
          },
        };
        break;
      case 'WALLETS_LOADED':
        result = {
          ...state,
          layout: {
            ...state.layout,
            walletsLoaded: true,
          },
        };
        break;
      case 'SET_WALLET_KEYS':
        result = {
          ...state,
          wallets: {
            ...state.wallets,
            [action.address]: {
              ...state.wallets[action.address],
              keys: action.keys,
            }
          }
        };
        break;
      case 'CREATE_WALLET':
        if (!(action.address in state.wallets)) state.wallets[action.address] = {};
        result = {
          ...state,
          wallets: {
            ...state.wallets,
          },
        };
        break;
      case 'UPDATE_WALLETS':
        result = {
          ...state,
          wallets: {
            ...state.wallets,
            ...action.wallets,
          },
        };
        break;
      case 'DELETE_WALLET':
        const { address } = action;
        delete state.wallets[address];
        result = {
          ...state,
          wallets: {
            ...state.wallets,
          },
        };
        break;
      case 'DELETE_WALLETS':
        result = {
          ...state,
          wallets: {},
        };
        break;
      case 'SEND_TX':
        result = {
          ...state,
          layout: {
            ...state.layout,
            sendTxResponse: action.sendTxResponse,
          },
        };
        break;
      case 'UPDATE_BLOCKCHAIN_HEIGHT':
        result = {
          ...state,
          network: {
            ...state.network,
            blockchainHeight: action.blockchainHeight,
          },
        };
        break;
      case 'UPDATE_MARKET':
        const { market, marketData } = action;
        const data = marketData.result !== 'error'
          ? { ...state.markets[market], ...marketData }
          : { ...state.markets[market] };
        if (market === 'stex') marketData.volume = marketData.vol_market || 0;
        result = {
          ...state,
          markets: {
            ...state.markets,
            [market]: {
              ...data,
            },
          },
        };
        break;
      case 'UPDATE_PRICES':
        const { pricesData } = action;
        result = {
          ...state,
          prices: {
            ...state.prices,
            ...pricesData.conceal
          },
        };
        break;
      case 'UPDATE_MARKET_DATA':
        result = {
          ...state,
          marketData: {
            ...state.marketData,
            ...action.marketData,
          },
        };
        break;
      case 'FORM_SUBMITTED':
        result = {
          ...state,
          layout: {
            ...state.layout,
            formSubmitted: action.value,
          },
        };
        if (action.value) result.layout.message = {};
        break;
      case 'DISPLAY_MESSAGE':
        if (!action.message) action.message = {};
        if (action.message.join() !== '') {
          let toast = Toast.show(action.message.join(), {
            backgroundColor: AppColors.concealErrorColor,
            duration: Toast.durations.LONG,
            opacity: 1,
            position: 0,
            animation: true,
            hideOnPress: true,
            shadow: true,
            delay: 300
          });
        }
        result = {
          ...state,
          layout: {
            ...state.layout,
            message: action.id ? { [action.id]: action.message } : action.message,
          },
        };
        break;
      case 'REDIRECT_TO_REFERRER':
        result = {
          ...state,
          layout: {
            ...state.layout,
            redirectToReferrer: action.value,
          },
        };
        break;
      case 'PAYMENT_SENT':
        let toast = Toast.show('Payment was succesfully sent to the recipient', {
          backgroundColor: AppColors.concealInfoColor,
          duration: Toast.durations.LONG,
          opacity: 1,
          position: 0,
          animation: true,
          hideOnPress: true,
          shadow: true,
          delay: 300
        });
        result = {
          ...state
        };
        break;
      case 'APP_UPDATED':
        result = {
          ...state,
          layout: {
            ...state.layout,
            lastUpdate: new Date(),
          }
        };
        break;
      case 'SET_INTERVALS':
        const intervals = action.intervals.map(i => setInterval(i.fn, i.time * 1000));
        result = {
          ...state,
          intervals,
        };
        break;
      case 'SET_APP_DATA':
        result = {
          ...state,
          appData: mergeJSON.merge(state.appData, action.appData)
        };
        break;
      case 'BARCODE_SCANNED':
        result = {
          ...state
        }
        break
      case 'CLEAR_APP':
        logger.log('***** APP CLEANUP *****');
        state.intervals.forEach(interval => clearInterval(interval));
        result = {
          ...state,
          intervals: [],
          layout: {
            ...state.layout,
            appLoaded: false,
            userLoaded: false,
            walletsLoaded: false,
          },
          user: {
            ...state.user,
            loggedIn: false,
            token: null,
          },
          wallets: {},
        };
        break;
      default:
        throw new Error();
    }

    updatedState.current = result;
    return result;
  };

  return [...useReducer(reducer, initialState), updatedState];
};

export default useAppState;
