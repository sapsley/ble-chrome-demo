function onButtonClick() {
 // Validate services UUID entered by user first.
  let services = document.querySelector('#optionalServices').value.split(/, ?/)
    .map(s => s.startsWith('0x') ? parseInt(s) : s)
    .filter(s => s && BluetoothUUID.getService);

  log('Requesting any Bluetooth Device...');
  navigator.bluetooth.requestDevice(
    {filters: anyDevice(), optionalServices: services})
  .then(device => {
    log('> Name:             ' + device.name);
    log('> Allowed Services: ' + device.uuids.join('\n' + ' '.repeat(20)));
    log('Connecting to GATT Server...');
    return device.gatt.connect();
  })
    .then(server => {
    // Note that we could also get all services that match a specific UUID by
    // passing it to getPrimaryServices().
    log('Getting Services...');
    return server.getPrimaryService('1bc50001-0200-d29e-e511-446c609db825');
  })
  /**
  .then(services => {
    log('Getting Characteristics...');
    let queue = Promise.resolve();
    services.forEach(service => {
      queue = queue.then(_ => service.getCharacteristics().then(characteristics => {
        log('> Service: ' + service.uuid);
        characteristics.forEach(characteristic => {
          log('>> Characteristic: ' + characteristic.uuid + ' ' +
              getSupportedProperties(characteristic));
        });
      }));
    });
    return queue;
  })
  **/
  .then(service => {
    log('Getting Session Characteristic...');
    return service.getCharacteristic('1bc50004-0200-d29e-e511-446c609db825');
  })
  .then(characteristic =>{
    log('Reading Session...');
    return characteristic.readValue();
  })
  .then(value => {
    log('Session length: ' + value.getLength() + ' value: ' + value);
    console.log('Session value is ' + value);
  })
  .catch(error => {
    log('Argh! ' + error);
  });
}

/* Utils */

function getSupportedProperties(characteristic) {
  let supportedProperties = [];
  for (const p in characteristic.properties) {
    if (characteristic.properties[p] === true) {
      supportedProperties.push(p.toUpperCase());
    }
  }
  return '[' + supportedProperties.join(', ') + ']';
}

function anyDevice() {
  // This is the closest we can get for now to get all devices.
  // https://github.com/WebBluetoothCG/web-bluetooth/issues/234
  return Array.from('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
      .map(c => ({namePrefix: c}))
      .concat({name: ''});
}