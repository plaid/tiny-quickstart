import React, { useState, useEffect, useCallback } from 'react';
import { Platform, View, Text, Button } from 'react-native';
import { createPlaidLinkSession, LinkSuccess, LinkExit, LinkEvent } from 'react-native-plaid-link-sdk';

var styles = require('./style');

const HomeScreen = ({ navigation }: any) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const address = Platform.OS === 'ios' ? 'localhost' : '10.0.2.2';

  const createLinkToken = useCallback(async () => {
    await fetch(`http://${address}:8080/api/create_link_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ address: address })
    })
      .then((response) => response.json())
      .then((data) => {
        setLinkToken(data.link_token);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [address]);

  useEffect(() => {
    if (linkToken == null) {
      createLinkToken();
    }
  }, [linkToken, createLinkToken]);

  const handleOpenLink = async () => {
    if (linkToken == null) {
      return;
    }
    try {
      const session = await createPlaidLinkSession({
        token: linkToken,
        onSuccess: async (success: LinkSuccess) => {
          await fetch(`http://${address}:8080/api/exchange_public_token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ public_token: success.publicToken }),
          })
            .catch((err) => {
              console.log(err);
            });
          navigation.navigate('Success', success);
        },
        onExit: (linkExit: LinkExit) => {
          console.log('Exit: ', linkExit);
        },
        onEvent: (linkEvent: LinkEvent) => {
          console.log('Event: ', linkEvent);
        },
      });
      await session.open();
    } catch (err) {
      console.log('Unable to open Plaid Link: ', err);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.heading}>
        <Text style={styles.titleText}>Tiny Quickstart – React Native</Text>
      </View>
      <View style={styles.bottom}>
        <Button
          title="Open Link"
          onPress={handleOpenLink}
          disabled={linkToken == null}
        />
      </View>
    </View>
  );
};

export default HomeScreen;
