import React, {useState, useEffect, useCallback} from 'react';
import {
  Text,
  View,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
var styles = require('./style');

const SuccessScreen = ({ navigation, route }: any) => {
  const [data, setData] = useState(null);

  // Fetch balance data
  const getBalance = useCallback(async () => {
    await fetch("http://localhost:8080/api/balance")
    .then((response) => response.json())
    .then((data) => {
      setData(data);
    })
    .catch((err) => {
      console.log(err);
    });
  });

  useEffect(() => {
    if (data == null) {
      getBalance();
    }
  }, [data])

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.heading}>
        <Text style={styles.titleText}>Balance Response</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.baseText}>
            {
              JSON.stringify(data)
            }
        </Text>
      </View>
    </View>
  );
};

function notifyMessage(msg: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert(msg);
  }
}

export default SuccessScreen;