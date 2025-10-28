import { Redirect } from 'expo-router';

export default function CreateScreen() {
  // Redirect to upload for now, later create a wizard
  return <Redirect href="/(tabs)/upload" />;
}

