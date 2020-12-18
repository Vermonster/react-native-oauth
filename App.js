import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  Switch,
  Platform
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
const fhirIssNoPatient ='https://launch.smarthealthit.org/v/r4/sim/eyJrIjoiMSJ9/fhir';

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
  const [withPatient, setWithPatient] = useState(true)
  console.log('authResult', authResult);
  console.log('patient', patient);

  const setFhirIss = withPatient ? fhirIss : fhirIssNoPatient
  
  useEffect(() => {
    if(authResult && !patient) {
      const { accessToken, tokenAdditionalParameters: { patient: patientId }} = authResult;
      const fhirClient = initializeFhirClient(setFhirIss, accessToken);
      const queryPatient = async () => {
        try {
          const patient = await fhirClient.read({ resourceType: 'Patient', id: patientId });
          setPatient(patient)
        } catch (error) {
          setPatient(error)
        }
      }
      queryPatient();

    }
  }, [authResult, patient])

  const handleAuthorize = async () => {
    const fhirClient = initializeFhirClient(setFhirIss);
    const { authorizeUrl, tokenUrl } = await fhirClient.smartAuthMetadata();

    const config = {
      serviceConfiguration: {
        authorizationEndpoint: authorizeUrl._url,
        tokenEndpoint: tokenUrl._url
      },
      additionalParameters: {
        aud: setFhirIss
      },
      clientId: 'example-client-id',
      clientSecret: 'example-client-secret',
      redirectUrl: Platform.OS === 'android' ? 'com.reactnativeoauth:/callback' : 'org.reactjs.native.example.ReactNativeOauth:/callback',
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
        <View style={styles.logoContainer}>
          <Image 
            style={styles.vlogo} 
            source={require('./assets/images/vermonster-logo.png')}
            resizeMode='contain' 
          />
          <Image 
            style={styles.slogo} 
            source={{ uri: 'http://syncfor.science/s4s-logo.png'}} 
            resizeMode='contain'
          />
        </View>
        <View style={styles.description}>
          <Text >SMART + OAuth2 Demo</Text>
        </View>
        <View>
          {/* <PatientView authResult={fakeAuthResult} patient={fakePatient}/> */}
        { patient
          ? <PatientView authResult={authResult} patient={patient} />
            : <View style={styles.body}>
              <Login handleAuthorize={handleAuthorize} />
              <View style={styles.togglePatient}>
                <Text style={styles.togglePatientDescription}>Login with Patient ID Provided</Text>
                <Switch
                  trackColor={{ false: "lightgray", true: "#499949" }}
                  thumbColor="white"
                  onValueChange={() => setWithPatient(previousState => !previousState)}
                  value={withPatient}
                />
              </View>
            </View>
        }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const Login = ({ handleAuthorize }) => (
  <TouchableOpacity style={styles.login} onPress={handleAuthorize}>
    <Text style={styles.loginText}>Login</Text>
  </TouchableOpacity>
);

const PatientView = ({ authResult, patient }) => {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.section}>
        <Text style={styles.title}>Authorization Result:</Text>
        <ScrollView style={styles.scrollViewInternal} nestedScrollEnabled={true}>
          <Text style={styles.text}>{JSON.stringify(authResult, null, 2)}</Text>
        </ScrollView>
      </View>
      <View style={styles.section}>
        <Text style={styles.title}>Patient:</Text>
        <ScrollView style={styles.scrollViewInternal} nestedScrollEnabled={true}>
          <Text>{JSON.stringify(patient, null, 2)}</Text>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
  },
  scrollView: {
    height: "100%",
    padding: 20,
  },
  scrollViewInternal: {
    height: 240,
    padding: 20,
    borderWidth: 1,
    borderColor: 'lightgray'
  },
  sectionContainer: {
    justifyContent: 'space-between',
  },
  section: {
    overflow: 'scroll',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10
  },
  title: {
    fontSize: 24,
    marginBottom: 10
  },
  vlogo: {
    height: 50,
    width: "60%",
  },
  slogo: {
    height: 50,
    width: "60%"
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 25
  },
  login: {
    backgroundColor: '#db882a',
    height: 50,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: "50%",
    marginTop: 100
  },
  loginText: {
    color: 'white',
    fontSize: 20
  },
  body: {
    alignItems: 'center'
  },
  togglePatient: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  togglePatientDescription: {
    margin: 10
  },
  description: {
    alignItems: 'center',
  }
});

export default App;
