# passback

A universal, Frida based, local Windows account password backdoor utility.

## building

This project depends on the frida-core devkit, and was built using version 12.4.8. You can download the correct devkit from [here](https://github.com/frida/frida/releases/download/12.4.8/frida-core-devkit-12.4.8-windows-x86.exe).

The resultant files should be placed next to `passback.c`. Be sure to update the `frida-core.h` header file if you download a devkit newer than v12.4.8.
