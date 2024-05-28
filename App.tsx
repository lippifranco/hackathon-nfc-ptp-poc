import React from 'react';
import {View, Text, Button, Alert} from 'react-native';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';
import {
  HCESession,
  NFCTagType4NDEFContentType,
  NFCTagType4,
} from 'react-native-hce';

// Componente principal de la aplicación
export default function App() {
  // Variable para la sesión HCE (Host Card Emulation)
  let session: HCESession | null = null;

  // Función para emular un tag NFC tipo 4
  async function sendData() {
    // Crear un tag NFC tipo 4 con contenido de texto
    const tag = new NFCTagType4({
      type: NFCTagType4NDEFContentType.Text,
      content: 'modo', // Contenido a emular
      writable: false, // El tag no es escribible
    });

    // Obtener la instancia de la sesión HCE
    session = await HCESession.getInstance();
    // Configurar la aplicación HCE con el tag creado
    session.setApplication(tag);
    // Habilitar la sesión HCE
    await session.setEnabled(true).catch(err => console.log(err));
  }

  // Función para leer un tag NFC
  const readNfc = async () => {
    try {
      // Solicitar la tecnología NFC (NfcA en este caso)
      await NfcManager.requestTechnology(NfcTech.NfcA);
      // Obtener el tag NFC detectado
      const tag = await NfcManager.getTag();
      console.log(tag);

      // Comando SELECT para seleccionar un archivo en el tag
      const selectCommand = [0x00, 0xa4, 0x00, 0x0c, 0x02, 0xe1, 0x04]; // Cambia 0xE1, 0x04 por tu File ID
      let response = await NfcManager.transceive(selectCommand);

      // Comprobar la respuesta del comando SELECT
      if (response[response.length - 2] !== 0x90 || response[response.length - 1] !== 0x00) {
        throw new Error('Failed to select file');
      }

      // Comando READ BINARY para leer los datos del archivo
      const readCommand = [0x00, 0xb0, 0x00, 0x00, 0x10]; // Leer 16 bytes
      response = await NfcManager.transceive(readCommand);

      // Comprobar la respuesta del comando READ BINARY
      if (response[response.length - 2] !== 0x90 || response[response.length - 1] !== 0x00) {
        throw new Error('Failed to read file');
      }

      // Extraer los datos del archivo (excluyendo los últimos dos bytes de estado)
      const fileData = response.slice(0, -2);
      const fileText = fileData.map(byte => byte.toString(16).padStart(2, '0')).join(' ');
      // Mostrar los datos del archivo en una alerta
      Alert.alert('File Data', fileText);
    } catch (ex) {
      console.warn(ex);
      Alert.alert('Error', ex.toString());
    } finally {
      // Cancelar la solicitud de tecnología NFC
      NfcManager.cancelTechnologyRequest();
    }
  };

  return (
    <View>
      {/* Botón para leer el tag NFC */}
      <Button onPress={readNfc} title="LEER TAG NFC" />
      {/* Botón para emular el tag NFC */}
      <Button onPress={sendData} title="EMULAR TAG NFC" />
    </View>
  );
}
