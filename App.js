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

const fakeAuthResult = {
  auth: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum"
}

const fakePatient = {
  patient: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum"
}

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
          <PatientView authResult={fakeAuthResult} patient={fakePatient}/>
        {/* { patient
          ? <PatientView authResult={authResult} patient={patient} />
          : <Login  handleAuthorize={handleAuthorize} />
        } */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const Login = ({ handleAuthorize }) => (
  <Button title="Login" onPress={handleAuthorize} />
);

const PatientView = ({ authResult, patient }) => {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.section}>
        <Text>Authorization Result:</Text>
        <View>
          <Text style={styles.text}>{JSON.stringify(authResult, null, 2)}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text>Patient:</Text>
        <View>
          <Text style={styles.text}>{JSON.stringify(patient, null, 2)}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1
  },
  scrollView: {
    padding: 20
  },
  sectionContainer: {
    justifyContent: 'space-between',
  },
  section: {
    overflow: 'scroll',
    marginVertical: 10
  },
  text: {
    borderWidth: 1,
    padding: 20,
  }
});

export default App;
