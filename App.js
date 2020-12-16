import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Button,
  Text
} from 'react-native';
import { authorize } from 'react-native-app-auth';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import Client from 'fhir-kit-client';

const fhirIss ='https://launch.smarthealthit.org/v/r4/sim/eyJrIjoiMSIsImIiOiI2ODk4OTJiZC1kY2JlLTQxZmMtODY1MS0zOGExZDA4OTM4NTQifQ/fhir';

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
  console.log('patient', patient);

  useEffect(() => {
    if(authResult && !patient) {
      const { accessToken, tokenAdditionalParameters: { patient: patientId }} = authResult;
      const fhirClient = initializeFhirClient(fhirIss, accessToken);

      const queryPatient = async () => {
        const patient = await fhirClient.read({ resourceType: 'Patient', id: patientId });
        setPatient(patient)
      }
      queryPatient();
    }
  }, [authResult, patient])

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
      redirectUrl: 'org.reactjs.native.example.ReactNativeOauth:/callback',
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
    <SafeAreaView>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}
      >
        <View style={styles.body}>
        { patient
          ? <PatientView patient={patient} />
          : <Login  handleAuthorize={handleAuthorize} />
        }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const Login = ({ handleAuthorize }) => (
  <Button title="Login" onPress={handleAuthorize} />
);

const PatientView = ({ patient }) => {
  console.log('in PatientView');
  return (
    <Text>
      Patient:
      {JSON.stringify(patient, null, 2)}
    </Text>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  body: {
    backgroundColor: Colors.white,
    justifyContent: 'center',
    minHeight: 300
  }
});

export default App;
