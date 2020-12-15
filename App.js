import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  StatusBar,
  Button,
  Text
} from 'react-native';
import { authorize } from 'react-native-app-auth';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import Client from 'fhir-kit-client';

const fhirIss ='https://launch.smarthealthit.org/v/r4/sim/eyJrIjoiMSIsImIiOiI2ODk4OTJiZC1kY2JlLTQxZmMtODY1MS0zOGExZDA4OTM4NTQifQ/fhir';

// const fhirClient = new Client({
//   baseUrl: fhirIss
// });

const initializeFhirClient = (baseUrl, accessToken) => {
  if(!accessToken) {
    return new Client({ baseUrl });
  }
  return new Client({
    baseUrl,
    customHeaders: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}

const App = () => {
  const [authResult, setAuthResult] = useState(null);
  const [patient, setPatient] = useState(null);
  console.log('authResult', authResult);

  useEffect(() => {
    if(authResult && !patient) {
      console.log('calling useEffect');
      const { accessToken, tokenAdditionalParameters: { patient: patientId }} = authResult;
      const fhirClient = initializeFhirClient(fhirIss, accessToken);

      fhirClient
        .read({
          resourceType: 'Patient',
          id: patientId
        })
        .then((res) => {
          console.log('response', res);
          setPatient(res)
        })
        .catch(e => console.log('error', e))
    }
  }, [authResult, patient]);

  console.log('patient', patient);

  const handleAuthorize = async () => {
    const fhirClient = initializeFhirClient(fhirIss);
    const { authorizeUrl, tokenUrl } = await fhirClient.smartAuthMetadata();

    const config = {
      serviceConfiguration: {
        authorizationEndpoint: authorizeUrl._url,
        tokenEndpoint: tokenUrl._url
      },
      additionalParameters: {
        aud: fhirIss
      },
      clientId: 'example-client-id',
      clientSecret: 'example-client-secret',
      redirectUrl: 'org.reactjs.native.example.ReactNativeOauth:/oauthredirect',
      scopes: ['openid', 'fhirUser', 'patient/*.*', 'launch/patient', 'online_access']
    };

    try {
      const result = await authorize(config);
      setAuthResult(result);
    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}
        >
          <View style={styles.body}>
            <Button title="Login" onPress={handleAuthorize} />
          </View>
          <Text>
            {patient}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  body: {
    backgroundColor: Colors.white,
  }
});

export default App;
