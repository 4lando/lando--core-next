
// checks to see if a setting is disabled
export default ({
  title: 'This app was built on a different version of Lando.',
  detail: [
    'While it may not be necessary, we highly recommend you update the app.',
    'This ensures your app is up to date with your current Lando version.',
    'You can do this with the command below:',
  ],
  command: 'lando rebuild',
});
