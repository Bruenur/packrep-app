PACKREP FULL EXPO — SDK 54 FIXED

What was fixed:
- Upgraded project to Expo SDK 54 so it works with Expo Go on a physical iPhone.
- Added babel-preset-expo to fix the Babel preset error.
- Pinned Expo SDK 54 package versions for expo-location, expo-status-bar, react-native-maps, and AsyncStorage.
- Enabled newArchEnabled in app.json because Expo Go supports the New Architecture.

How to run:
1) Open CMD in this folder
2) Run: npm install
3) Run: npx expo start -c

If npm install finishes but you still get a dependency mismatch, run:
   npx expo install --fix
   npx expo start -c

Notes:
- This zip does NOT include node_modules. npm install is still required once after download.
- The map screen is the hero screen in this project.


Update: Bottom dashboard now uses New Builds, Pins, and Community Wall. Used Homes stays behind the menu until a licensed/imported used-home feed is connected.
