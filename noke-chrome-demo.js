var loginToken;


function onLoginClick() {

  var company = document.getElementById("company").value;
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  log('Logging in ' + email + '...');

  var url = "https://larry-0-6-1-9e197a3-dot-noke-pro.appspot.com/company/login/";

  /**
  var xhr = new XMLHttpRequest();
  xhr.open("post", url, true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');


  xhr.send(JSON.stringify({"username":email, "password":password, "companyDomain":company}));

  xhr.onloadend = function () {

      log('Login finished');

  }
  **/
  


$.post(url,
    JSON.stringify({"username":email, "password":password, "companyDomain":company}),
    function(data, status){
        log("Data: " + data + "\nStatus: " + status);

        var obj = JSON.parse(data);
        log("Token: " + obj.token);
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
    log('Session length: ' + value.byteLength + ' offset: ' + value.bythOffset);

    var buf = value.buffer;
    var hexChar = ["0", "1", "2", "3", "4", "5", "6", "7","8", "9", "A", "B", "C", "D", "E", "F"];

    var sessionString = "";

    for(var i = 0; i < value.byteLength; i++)
    {
      var byte = value.getUint8(i);
      //log('BYTE: ' + byte);
      var newHex = hexChar[(byte >> 4) & 0x0f] + hexChar[byte & 0x0f];
      //log('HEX CHAR: ' + newHex);
      var addByte = sessionString.concat(newHex);
      sessionString = addByte;
    }

    log('Session string: ' + sessionString);


    var url = "https://larry-0-6-1-9e197a3-dot-noke-pro.appspot.com/lock/sdk/unlock/";




    function setHeader(xhr) 
    {
      xhr.setRequestHeader('Authorization', 'Bearer ' + loginToken);
  
    }

    $.ajax({

    url: url,
    type: 'POST',
    datatype: 'json',
    data: JSON.stringify({"session":sessionString, "mac":"DE:A3:1F:B0:74:2C"}),
    headers: {
       "Authorization": 'Bearer ' + nokeToken
     },
    success: function(data) {
     log('Unlock data: ' + data); 

   },
    error: function() { log('Failure!'); },
    

    });



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