const MsvpPasswordValidate = Module.getExportByName(null, 'MsvpPasswordValidate');
console.log('MsvpPasswordValidate @ ' + MsvpPasswordValidate);

Interceptor.attach(MsvpPasswordValidate, {
  onLeave: function (retval) {
    retval.replace(0x1);
  }
});
