var loginToken;
var nokeService;
var sessionString;


var sessionChar;
var writeChar;
var notifyChar;

var device;
var nokeServer;

function onLoginClick() {

  var company = document.getElementById("company").value;
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  log('Logging in ' + email + '...');

  var url = "https://iggy-002-dot-noke-pro.appspot.com/company/login/";

  $.post(url,
    JSON.stringify({"username":email, "password":password, "companyDomain":company}),
    function(data, status){

        var obj = JSON.parse(data);
        log("Login Result: " + obj.result);
        loginToken = obj.token;
    });
}



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
    log('Getting Services...');
    nokeServer = server;
    return server.getPrimaryService('1bc50001-0200-d29e-e511-446c609db825');
  })
  .then(service => {
    log('Getting Session Characteristic...');
    var nokeService = service;
    return service.getCharacteristic('1bc50004-0200-d29e-e511-446c609db825');
  })
  .then(characteristic =>{
    log('Reading Session...');
    return characteristic.readValue();
  })
  .then(value => {
    log('Session length: ' + value.byteLength + ' offset: ' + value.bythOffset);
    sessionString = bytesToHex(value);

    log('Session string: ' + sessionString);  

  })
  .catch(error => {
    log('Argh! ' + error);
  });
}


function onUnlockClick()
{

  nokeServer.getPrimaryService('1bc50001-0200-d29e-e511-446c609db825')
    .then(service => service.getCharacteristic('1bc50003-0200-d29e-e511-446c609db825'))
    .then(characteristic => {
      log('Enabling notifications');
    
      return characteristic.startNotifications()
      .then(_ => {
        characteristic.addEventListener('characteristicvaluechanged',
                                    handleCharacteristicValueChanged);
        });
        })
        .then(_ => {
          log('Notifications have been started.');
        })
        .catch(error => { console.log(error); });


var url = "https://iggy-002-dot-noke-pro.appspot.com/lock/sdk/unlock/";

    $.ajax({
    url: url,
    type: 'POST',
    datatype: 'json',
    data: JSON.stringify({"session":sessionString, "mac":"DE:A3:1F:B0:74:2C"}),
    headers: {
       "Authorization": 'Bearer ' + loginToken
     },
    success: function(data, status) {
     var arr = data.commands;

     var command = arr[0];
     log('Command count: ' + arr.length + ' Command: ' + command);

    log('Getting Write Characteristic!');

    nokeServer.getPrimaryService('1bc50001-0200-d29e-e511-446c609db825')
    .then(service => service.getCharacteristic('1bc50002-0200-d29e-e511-446c609db825'))
    .then(characteristic => {
      log('Writing Characteristic');
      // Writing 1 is the signal to reset energy expended.
      var unlockCommand = new Uint8Array(hexToBytes(command));
      return characteristic.writeValue(unlockCommand);
      })
      .then(_ => {
      log('Unlock command has been written');
      })
      .catch(error => { console.log(error); });
   },
    error: function() { log('Failure!'); },
    

    });
    
}

function handleCharacteristicValueChanged(event) 
{
  var value = event.target.value;

  dataReceived = bytesToHex(value);
  log('Data Received: ' + dataReceived); 

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

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

function bytesToHex(value) {

    var buf = value.buffer;
    var hexChar = ["0", "1", "2", "3", "4", "5", "6", "7","8", "9", "A", "B", "C", "D", "E", "F"];

    byteString = "";

    for(var i = 0; i < value.byteLength; i++)
    {
      var byte = value.getUint8(i);
      //log('BYTE: ' + byte);
      var newHex = hexChar[(byte >> 4) & 0x0f] + hexChar[byte & 0x0f];
      //log('HEX CHAR: ' + newHex);
      var addByte = byteString.concat(newHex);
      byteString = addByte;
    }

    return byteString;

}

