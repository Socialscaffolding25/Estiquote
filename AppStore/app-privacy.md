# App Privacy answers

Use these answers for version 1.0 after confirming the uploaded production build matches this repository.

## Privacy policy

- Privacy Policy URL: `https://estiquote.co.uk/privacy.html`
- User Privacy Choices URL: leave blank for version 1.0

The privacy-policy URL must serve the new static privacy page publicly before submission.

## App Store Connect questionnaire

For **Do you or your third-party partners collect data from this app?**, select:

> No, we do not collect data from this app.

No data-type follow-up answers are required after selecting No.

## Why this answer matches version 1.0

- No Estiquote account or login is present.
- Estimates, country preference, contractor names, written quote values, markup and the optional Trade business logo are stored locally on the iPhone.
- The app uses Apple's system photo picker, which provides only the business-logo image the user explicitly selects.
- Country pricing factors are bundled and work offline; the selected country is not sent to Estiquote, the World Bank or another market-data provider.
- The app has no advertising, analytics, attribution or behavioural-tracking SDK.
- StoreKit handles payment processing. Estiquote receives verified product and entitlement information but not the customer's full payment-card details.
- Sharing is user initiated through Apple's share sheet. The user chooses the destination for the locally generated PDF.
- Optional support email is initiated by the user outside the app's primary workflow.

The Release binary links Apple system frameworks only. Its privacy manifest declares no collected data or tracking and declares UserDefaults under required-reason code `CA92.1`.

## Recheck before every release

Change the answer before submission if a later build adds any account system, cloud sync, crash reporting, analytics, advertising, remote estimator API, location access or other data transmission. Apple's answers must include the practices of third-party SDKs as well as Estiquote's own code.

Apple references:

- [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)
- [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
