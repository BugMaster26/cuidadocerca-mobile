import { Platform } from 'react-native';
import { Contact, ContactField, getPermissionsAsync, requestPermissionsAsync } from 'expo-contacts';
import { chooseSosContact } from './contactSelection';
export async function selectDeviceContact() {
  return chooseSosContact({
    requiresPermission: Platform.OS === 'android', permission: getPermissionsAsync, requestPermission: requestPermissionsAsync,
    pick: async () => {
      const contact = await Contact.presentPicker();
      return contact ? contact.getDetails([ContactField.FULL_NAME, ContactField.GIVEN_NAME, ContactField.FAMILY_NAME, ContactField.PHONES]) : null;
    },
  });
}
