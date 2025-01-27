import React, { useContext, useState, useEffect } from "react";
import { Icon, Header, ListItem } from 'react-native-elements';
import NavigationService from '../helpers/NavigationService';
import { AppContext } from '../components/ContextProvider';
import EStyleSheet from 'react-native-extended-stylesheet';
import ConcealTextInput from '../components/ccxTextInput';
import ConcealButton from '../components/ccxButton';
import GuideNavigation from '../helpers/GuideNav';
import { AppColors } from '../constants/Colors';
import AppStyles from '../components/Style';
import Tips from 'react-native-guide-tips';
import { Slider } from 'react-native';
import {
  maskAddress,
  getAspectRatio,
  format4Decimals,
  format6Decimals,
  parseLocaleNumber,
  getDepositInterest
} from '../helpers/utils';
import {
  Text,
  View,
  FlatList,
} from "react-native";

const CreateDepositScreen = () => {
  const { state, actions } = useContext(AppContext);
  const { setAppData } = actions;
  const { appSettings, wallets, appData } = state;
  const currWallet = wallets[appData.common.selectedWallet];

  const sendSummaryList = [];

  if (state.appData.createDeposit.duration) {
    sendSummaryList.push({
      value: `${state.appData.createDeposit.duration} month${state.appData.createDeposit.duration > 1 ? 's' : ''}`,
      title: 'Deposit Duration',
      icon: 'md-clock'
    });
  }

  if (state.appData.createDeposit.amount) {
    sendSummaryList.push({
      value: `${parseLocaleNumber(state.appData.createDeposit.amount, true).toLocaleString(undefined, format6Decimals)} CCX`,
      title: 'Deposit Amount',
      icon: 'md-cash'
    });

    sendSummaryList.push({
      value: `${appSettings.defaultFee} CCX`,
      title: 'Transaction Fee',
      icon: 'md-cash'
    });
  }

  if (state.appData.createDeposit.duration && state.appData.createDeposit.amount) {
    sendSummaryList.push({
      value: `${getDepositInterest(parseLocaleNumber(state.appData.createDeposit.amount, true), state.appData.createDeposit.duration).toLocaleString(undefined, format6Decimals)} CCX`,
      title: 'Interest earned',
      icon: 'md-cash'
    });
  }

  // key extractor for the list
  const keyExtractor = (item, index) => index.toString();

  const renderItem = ({ item }) => (
    <ListItem
      title={item.value}
      subtitle={item.title}
      titleStyle={styles.summaryText}
      subtitleStyle={styles.summaryLabel}
      containerStyle={styles.summaryItem}
      leftIcon={<Icon
        name={item.icon}
        type='ionicon'
        color='white'
        size={32 * getAspectRatio()}
      />}
    />
  );

  const isFormValid = () => {
    if (state.appData.createDeposit.duration && state.appData.createDeposit.amount) {
      let amountAsFloat = parseLocaleNumber(state.appData.createDeposit.amount, true);
      return ((amountAsFloat >= 1) && (amountAsFloat <= (currWallet.balance - appSettings.defaultFee)));
    } else {
      return false;
    }
  }

  const clearSend = () => {
    setAppData({
      createDeposit: {
        amount: '',
        duration: 1,
        durationText: `Deposit duration: 1 month`,
      }
    });
  }

  const getAmountError = () => {
    var amountAsFloat = parseLocaleNumber(state.appData.createDeposit.amount, true);
    if ((amountAsFloat < 1) && (state.appData.createDeposit.amount)) {
      return "Amount must be at least 1 CCX"
    } else if (amountAsFloat > (currWallet.balance - state.appSettings.defaultFee)) {
      return "The amount exceeds wallet balance"
    } else {
      return "";
    }
  }

  // guide navigation state values
  const [guideState, setGuideState] = useState(null);
  const [guideNavigation] = useState(new GuideNavigation('createDeposit', [
    'balance', 'amount', 'duration', 'clear', 'create', 'cancel'
  ]));

  // fire on mount
  useEffect(() => {
    setTimeout(() => {
      setGuideState(guideNavigation.start());
    }, 100);
  }, []);

  return (
    <View style={styles.pageWrapper}>
      <Header
        placement="left"
        statusBarProps={{ translucent: false, backgroundColor: "#212529" }}
        containerStyle={AppStyles.appHeader}
        leftComponent={<Icon
          onPress={() => NavigationService.goBack()}
          name='arrow-back-outline'
          type='ionicon'
          color='white'
          size={32 * getAspectRatio()}
        />}
        centerComponent={
          <View style={AppStyles.appHeaderWrapper}>
            <Text style={AppStyles.appHeaderText}>
              Create Deposit
            </Text>
            <Icon
              onPress={() => {
                guideNavigation.reset();
                setGuideState(guideNavigation.start());
              }}
              name='md-help'
              type='ionicon'
              color='white'
              size={26 * getAspectRatio()}
            />
          </View>
        }
        rightComponent={<Tips
          position={'bottom'}
          visible={guideState == 'clear'}
          textStyle={AppStyles.guideTipText}
          style={[AppStyles.guideTipContainer, styles.guideTipClearDeposit]}
          tooltipArrowStyle={[AppStyles.guideTipArrowTop, styles.guideTipArrowClearDeposit]}
          text="Click on this button to clear deposit info..."
          onRequestClose={() => setGuideState(guideNavigation.next())}
        >
          <Icon
            onPress={() => clearSend()}
            name='md-trash'
            type='ionicon'
            color='white'
            size={32 * getAspectRatio()}
          /></Tips>}
      />
      <View style={styles.walletWrapper}>
        <Tips
          position={'top'}
          visible={guideState == 'balance'}
          textStyle={AppStyles.guideTipText}
          tooltipArrowStyle={AppStyles.guideTipArrowBottom}
          style={[AppStyles.guideTipContainer, styles.guideTipBalance]}
          text="Here you can see your wallet funds current state"
          onRequestClose={() => setGuideState(guideNavigation.next())}
        >
          <View style={styles.fromWrapper}>
            <Text style={styles.fromAddress}>{maskAddress(currWallet.addr)}</Text>
            <Text style={styles.fromBalance}>{currWallet.balance.toLocaleString(undefined, format4Decimals)} CCX</Text>
            {currWallet.locked
              ? (<View style={styles.lockedWrapper}>
                <Icon
                  containerStyle={styles.lockedIcon}
                  name='md-lock'
                  type='ionicon'
                  color='#FF0000'
                  size={16 * getAspectRatio()}
                />
                <Text style={currWallet.locked ? [styles.worthBTC, styles.lockedText] : styles.worthBTC}>
                  {`${currWallet.locked.toLocaleString(undefined, format4Decimals)} CCX'`}
                </Text>
              </View>)
              : null}
          </View>
        </Tips>

        <Tips
          position={'top'}
          visible={guideState == 'amount'}
          textStyle={AppStyles.guideTipText}
          tooltipArrowStyle={AppStyles.guideTipArrowBottom}
          style={[AppStyles.guideTipContainer, styles.guideTipAmount]}
          text="Here you can enter the amount of CCX to deposit..."
          onRequestClose={() => setGuideState(guideNavigation.next())}
        >
          <View style={styles.amountWrapper}>
            <ConcealTextInput
              label={getAmountError()}
              keyboardType='numeric'
              placeholder='Select amount to deposit...'
              containerStyle={styles.sendInput}
              value={state.appData.createDeposit.amount}
              onChangeText={(text) => {
                setAppData({ createDeposit: { amount: text.replace(/[^0-9,.]/g, '') } });
              }}
              rightIcon={
                <Text style={styles.ccxUnit}>CCX</Text>
              }
            />
          </View>
        </Tips>
        <View style={styles.amountPercentWrapper}>
          <ConcealButton
            style={styles.btnDepositPercent}
            onPress={() => setAppData({ createDeposit: { amount: ((currWallet.balance - appSettings.defaultFee) * 0.25).toLocaleString(undefined, format6Decimals) } })}
            text="25%"
          />
          <ConcealButton
            style={styles.btnDepositPercent}
            onPress={() => setAppData({ createDeposit: { amount: ((currWallet.balance - appSettings.defaultFee) * 0.50).toLocaleString(undefined, format6Decimals) } })}
            text="50%"
          />
          <ConcealButton
            style={styles.btnDepositPercent}
            onPress={() => setAppData({ createDeposit: { amount: ((currWallet.balance - appSettings.defaultFee) * 0.75).toLocaleString(undefined, format6Decimals) } })}
            text="75%"
          />
          <ConcealButton
            style={styles.btnDepositPercent}
            onPress={() => setAppData({ createDeposit: { amount: (currWallet.balance - appSettings.defaultFee - appSettings.minValue).toLocaleString(undefined, format6Decimals) } })}
            text="100%"
          />
        </View>
        <Tips
          position={'top'}
          visible={guideState == 'duration'}
          textStyle={AppStyles.guideTipText}
          style={AppStyles.guideTipContainer}
          tooltipArrowStyle={AppStyles.guideTipArrowBottom}
          text="Here you can set the duration of the deposit..."
          onRequestClose={() => setGuideState(guideNavigation.next())}
        >
          <View style={styles.durationWrapper}>
            <Text style={styles.durationLabel}>{state.appData.createDeposit.durationText}</Text>
            <Slider
              style={styles.durationSlider}
              step={1}
              minimumValue={1}
              maximumValue={12}
              minimumTrackTintColor={AppColors.concealOrange}
              thumbTintColor={AppColors.concealOrange}
              maximumTrackTintColor="#FFFFFF"
              onValueChange={(value) => {
                setAppData({
                  createDeposit: {
                    duration: value,
                    durationText: `Deposit duration: ${value.toString()} month${value > 1 ? 's' : ''}`,
                  }
                });
              }}
            />
          </View>
        </Tips>
        <FlatList
          data={sendSummaryList}
          style={styles.summaryList}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
        />
      </View>
      <View style={styles.footer}>
        <View style={[styles.footerBtn, styles.footerBtnLeft]}>
          <Tips
            position={'top'}
            visible={guideState == 'create'}
            textStyle={AppStyles.guideTipText}
            text="Click here to create the deposit"
            style={[AppStyles.guideTipContainer, styles.guideTipCreate]}
            tooltipArrowStyle={[AppStyles.guideTipArrowBottom, styles.guideTipArrowCreate]}
            onRequestClose={() => setGuideState(guideNavigation.next())}
          >
            <ConcealButton
              style={[styles.footerBtn, styles.footerBtnLeft]}
              disabled={!isFormValid()}
              onPress={() => NavigationService.navigate('CreateDepositConfirm')}
              text="CREATE"
            />
          </Tips>
        </View>
        <View style={[styles.footerBtn, styles.footerBtnLeft]}>
          <Tips
            position={'top'}
            visible={guideState == 'cancel'}
            textStyle={AppStyles.guideTipText}
            text="Click here to cancel the deposit creation"
            style={[AppStyles.guideTipContainer, styles.guideTipCancel]}
            tooltipArrowStyle={[AppStyles.guideTipArrowBottom, styles.guideTipArrowCancel]}
            onRequestClose={() => setGuideState(guideNavigation.next())}
          >
            <ConcealButton
              style={[styles.footerBtn, styles.footerBtnRight]}
              onPress={() => NavigationService.goBack()}
              text="CANCEL"
            />
          </Tips>
        </View>
      </View>
    </View>
  )
};

const styles = EStyleSheet.create({
  pageWrapper: {
    flex: 1,
    backgroundColor: 'rgb(40, 45, 49)'
  },
  icon: {
    color: "orange"
  },
  fromWrapper: {
    width: '100%',
    padding: '15rem',
    aspectRatio: 3 / 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#212529',
    borderColor: AppColors.concealBorderColor,
    borderWidth: 1
  },
  sendInput: {
    marginTop: '5rem',
    marginBottom: '10rem'
  },
  addressInput: {
    marginBottom: '5rem'
  },
  fromAddress: {
    fontSize: '18rem',
    color: "#FFA500",
    textAlign: 'center'
  },
  toAddress: {
    color: "#FFFFFF",
  },
  fromBalance: {
    textAlign: 'center',
    color: "#AAAAAA",
    fontSize: '24rem'
  },
  data: {
    color: "#AAAAAA"
  },
  sendSummary: {
    color: "#AAAAAA",
    backgroundColor: '#212529',
    borderColor: '#333',
    borderWidth: 1,
    marginBottom: '2rem',
    marginTop: '2rem',
    padding: '10rem',
    fontSize: '16rem'
  },
  sendSummaryLabel: {
    color: AppColors.concealOrange
  },
  buttonContainer: {
    margin: '5rem'
  },
  walletWrapper: {
    flex: 1,
    top: '80rem',
    left: '5rem',
    right: '5rem',
    bottom: '50rem',
    margin: '10rem',
    position: 'absolute',
    flexDirection: 'column'
  },
  sendSummaryWrapper: {
    margin: '10rem',
    marginTop: '5rem'
  },
  overlayWrapper: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: 'absolute'
  },
  addressWrapper: {
    top: '10rem',
    left: '10rem',
    right: '10rem',
    bottom: '80rem',
    borderRadius: '10rem',
    position: 'absolute'
  },
  footer: {
    bottom: '10rem',
    left: '20rem',
    right: '20rem',
    position: 'absolute',
    flex: 1,
    alignItems: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  footerBtn: {
    flex: 1
  },
  footerBtnRight: {
    marginLeft: '3rem'
  },
  footerBtnLeft: {
    marginRight: '3rem'
  },
  summaryLabel: {
    color: AppColors.concealOrange,
    fontSize: '12rem'
  },
  summaryText: {
    color: AppColors.concealTextColor,
    fontSize: '14rem'
  },
  summaryList: {
    flex: 1,
    margin: '10rem',
    backgroundColor: AppColors.concealBackground
  },
  summaryItem: {
    backgroundColor: '#212529',
    borderWidth: 0,
    paddingTop: '5rem',
    paddingBottom: '5rem',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.concealBackground
  },
  lockedWrapper: {
    height: '20rem',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  lockedIcon: {
    marginRight: '5rem',
    paddingTop: '2rem'
  },
  lockedText: {
    color: '#FF0000'
  },
  amountPercentWrapper: {
    padding: '10rem',
    marginTop: '10rem',
    flexDirection: 'row'
  },
  btnDepositPercent: {
    flex: 1,
    margin: '1rem',
  },
  durationSlider: {
    marginTop: '10rem',
    height: '20rem'
  },
  amountWrapper: {
    flexDirection: 'row'
  },
  durationLabel: {
    color: 'rgb(255, 255, 255)',
    marginLeft: '10rem',
    marginTop: '10rem',
    fontSize: '18rem'
  },
  guideTipClearDeposit: {
    left: '-130rem'
  },
  guideTipArrowClearDeposit: {
    left: '97%'
  },
  guideTipBalance: {
    top: '-50rem'
  },
  guideTipAmount: {
    top: '25rem'
  },
  guideTipCreate: {
    left: '20rem',
    top: '-5rem'
  },
  guideTipCancel: {
    left: '-60rem',
    top: '-5rem'
  },
  guideTipArrowCreate: {
    left: '23%'
  },
  guideTipArrowCancel: {
    left: '72%'
  },
  ccxUnit: {
    fontSize: '16rem',
    color: AppColors.concealTextColor
  }
});


export default CreateDepositScreen;
