# FairSplit

An iOS bill splitting app built with **Expo** and **React Native**. Add people, record expenses, and see exactly who owes whom.

## Features

- Native iOS UI (also runs on Android and web for quick preview)
- Add and remove participants
- Record expenses with payer and split participants
- Equal split among selected people
- Live balance calculations
- Suggested minimum settlements

## Preview & test

### In the browser (quick preview)

```bash
npm install
npm run web
```

### On your iPhone (real iOS experience)

1. Install **[Expo Go](https://apps.apple.com/app/expo-go/id982107779)** from the App Store
2. Start the dev server with tunnel mode:
   ```bash
   npm start
   ```
   Then press `s` to switch to tunnel, or run:
   ```bash
   npx expo start --tunnel
   ```
3. Scan the QR code with your iPhone camera — it opens in Expo Go

> **Note:** The iOS Simulator requires a Mac with Xcode. On iPhone, Expo Go is the easiest way to test without a Mac.

### Build a standalone iOS app

For TestFlight or App Store distribution, use [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm install -g eas-cli
eas build --platform ios
```

## Tech stack

- Expo SDK 57
- React Native 0.86
- TypeScript

## License

MIT
