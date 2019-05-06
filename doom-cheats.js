//  chocolate-doom-win32 v3.0.0, frida based cheats.
//  Created during SenseCon '19
//
//  Attach and activate with:
//      frida chocolate-doom.exe -l doom-cheats.js
//
//  Cheats are:
//      funpolice => increment ammmo
//      nobodydies => well, nobody dies. (a little unstable)

const doom = Process.getModuleByName('chocolate-doom.exe');
const cheatMeBaby = doom.base.add(0xfe90);

const health = [doom.base.add(0x2C385), doom.base.add(0x2C3C9)];

console.log('[+] Doom base @ ' + doom.base);
console.log('[+] Doom cheats @ ' + cheatMeBaby);

const ASCII_MIN = 33;
const ASCII_MAX = 123;

// [A short two hours later]
// 83 ac 93 a4 00 00 00 01  ; sub     dword ptr [ebx+edx*4+0A4h], 1
// 83 84 93 a4 00 00 00 01  ; add     dword ptr [ebx+edx*4+0A4h], 1
const AMMO_DECREMENT_SIGNATURE = '83 ac';
const AMMO_INCREMENT_SIGNATURE = '83 84'; // needed to revert the increment patch
const AMMO_INCREMENT_PATCH = [0x83, 0x84];
const AMMO_DECREMENT_PATCH = [0x83, 0xac];
const HEALTH_INCREMENT_PATCH = [0x01, 0xF0];
const HEALTH_DECREMENT_PATCH = [0x29, 0xF0];

const CHEAT_INCREMENT_AMMO = 'funpolice';
const CHEAT_INCREMENT_AMMO_ENABLED = false;
const CHEAT_NOBODY_DIES = 'nobodydies';
const CHEAT_NOBODY_DIES_ENABLED = false;

const MAX_CHEAT_LEN = 10;
var CHEAT_BUF = '';

// Ensure that our cheat buffer is only MAX_CHEAT_LEN chars
// Remove the last char to make space for the new one if a
// new, unique (not matching previous) character is entered.
//
// Returns the current cheat buffer only if a new character
// was added, otherwise, an empty string.
const getCheatFromBufWithChar = function (ch) {
  if (CHEAT_BUF.length > MAX_CHEAT_LEN) { CHEAT_BUF = CHEAT_BUF.slice(-MAX_CHEAT_LEN); }
  if (CHEAT_BUF.length = MAX_CHEAT_LEN) { CHEAT_BUF = CHEAT_BUF.substr(0); }

  if (CHEAT_BUF[CHEAT_BUF.length - 1] != ch) {
    CHEAT_BUF = CHEAT_BUF + ch;
    return CHEAT_BUF;
  }
  return '';
}

// Entrypoint for our cheats, just like Doom
Interceptor.attach(cheatMeBaby, {
  onEnter: function (args) {
    const intKey = parseInt(args[1]);
    const keyChar = String.fromCharCode(intKey);

    // ALL keys end up in the cheat routine? lolwutid. skip non ascii
    if ((intKey < ASCII_MIN) || (intKey > ASCII_MAX)) { return; }

    const currentCheat = getCheatFromBufWithChar(keyChar);

    if (currentCheat.endsWith(CHEAT_INCREMENT_AMMO)) {
      console.log('[+] Ammo cheat enabled is: ' + CHEAT_INCREMENT_AMMO_ENABLED + ', toggling');
      toggleAndWriteAmmoCheatPatch(!CHEAT_INCREMENT_AMMO_ENABLED);
      // toggle the ammo cheat status
      CHEAT_INCREMENT_AMMO_ENABLED = CHEAT_INCREMENT_AMMO_ENABLED ? false : true;
    }

    if (currentCheat.endsWith(CHEAT_NOBODY_DIES)) {
      console.log('[+] Health cheat enabled is: ' + CHEAT_NOBODY_DIES_ENABLED + ', toggling');
      toggleAndWriteHealthCheatPatch(!CHEAT_NOBODY_DIES_ENABLED);
      // toggle the health cheat
      CHEAT_NOBODY_DIES_ENABLED = CHEAT_NOBODY_DIES_ENABLED ? false : true;
    }
  }
});

const toggleAndWriteHealthCheatPatch = function (toggle) {
  console.log('[+] Health cheat is now going: ' + (toggle ? 'on' : 'off'));

  if (toggle) {

    console.log('[+] Patching Health functions to increment');
    health.forEach(function (p) {
      console.log('[+] Patching function @ ' + p);
      Memory.patchCode(p, 2, function (code) {
        p.writeByteArray(HEALTH_INCREMENT_PATCH);
      });
    });

    return;
  }

  console.log('[+] Patching Health functions to decrement');

  health.forEach(function (p) {
    console.log('[+] Patching function @ ' + p);
    Memory.patchCode(p, 2, function (code) {
      p.writeByteArray(HEALTH_DECREMENT_PATCH);
    });
  });

  console.log('[+] Done Patching Health functions to decrement');
}

const toggleAndWriteAmmoCheatPatch = function (toggle) {
  console.log('[+] Ammo cheat is now going: ' + (toggle ? 'on' : 'off'));

  if (toggle) {

    const ammoInstructions = Memory.scanSync(doom.base, doom.size, AMMO_DECREMENT_SIGNATURE);
    console.log('[+] Found ' + ammoInstructions.length + ' ammo decrement instrutions');
    ammoInstructions.forEach(function (f) {
      console.log('[+] Patching @ ' + f.address + '...');
      Memory.patchCode(f.address, 2, function (code) {
        f.address.writeByteArray(AMMO_INCREMENT_PATCH);
      });
    });

    return;
  }

  const ammoInstructions = Memory.scanSync(doom.base, doom.size, AMMO_INCREMENT_SIGNATURE);
  console.log('[+] Found ' + ammoInstructions.length + ' ammo increment instrutions');
  ammoInstructions.forEach(function (f) {
    console.log('[+] Patching @ ' + f.address + '...');
    Memory.patchCode(f.address, 2, function (code) {
      f.address.writeByteArray(AMMO_DECREMENT_PATCH);
    });
  });
}

console.log('[+] Ready to cheat. Don\'t tell Reino :)');
