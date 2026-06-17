PACKREP NEXT BUILD

What changed:
- Map now shows ALL valid new-build and used-home pins, not just the top 10 cards.
- App asks for current location on open and tries to auto-load nearby places:
  schools, hospital, police, fire, pharmacy, grocery, USPS/city services.
- New Build and Used Home screens now have a "Use My Current Location" button so you can stand at a model/home and save the exact pin.
- Builder seed data is now merged into a fresh builder key so new defaults can load without wiping manual entries.

Important note:
- The school pins are nearby schools from map data, not guaranteed attendance/zoning boundaries yet.
- If a specific builder pin is still wrong, open New Build Communities and re-add that community with the exact lat/lon while standing there.

Run:
1) npm install
2) npx expo start -c
