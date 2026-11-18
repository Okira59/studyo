; OkiRa Stüdyo kurulum betiği (NSIS)
Unicode true
!include "MUI2.nsh"
!define APPNAME "OkiRa Stüdyo"
!define EXENAME "OkiRa Studyo.exe"
!define VERSION "1.0.0"
Name "${APPNAME}"
OutFile "${OUTFILE}"
InstallDir "$LOCALAPPDATA\Programs\OkiRa Studyo"
RequestExecutionLevel user
SetCompressor /SOLID lzma
!define MUI_ICON "${SRCDIR}\icon.ico"
!define MUI_UNICON "${SRCDIR}\icon.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\${EXENAME}"
!define MUI_FINISHPAGE_RUN_TEXT "OkiRa Stüdyo'yu şimdi aç"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Turkish"
Section "Kur"
  SetOutPath "$INSTDIR"
  File /r "${SRCDIR}\app\*.*"
  File "${SRCDIR}\icon.ico"
  CreateShortCut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\${EXENAME}" "" "$INSTDIR\icon.ico"
  CreateDirectory "$SMPROGRAMS\${APPNAME}"
  CreateShortCut "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk" "$INSTDIR\${EXENAME}" "" "$INSTDIR\icon.ico"
  CreateShortCut "$SMPROGRAMS\${APPNAME}\Kaldır.lnk" "$INSTDIR\Kaldir.exe"
  WriteUninstaller "$INSTDIR\Kaldir.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\OkiRaStudyo" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\OkiRaStudyo" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\OkiRaStudyo" "Publisher" "OkiRa8406"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\OkiRaStudyo" "DisplayIcon" "$INSTDIR\icon.ico"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\OkiRaStudyo" "UninstallString" '"$INSTDIR\Kaldir.exe"'
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\OkiRaStudyo" "NoModify" 1
SectionEnd
Section "Uninstall"
  Delete "$DESKTOP\${APPNAME}.lnk"
  RMDir /r "$SMPROGRAMS\${APPNAME}"
  Delete "$INSTDIR\OkiRa Studyo.exe"
  Delete "$INSTDIR\*.dll"
  Delete "$INSTDIR\*.pak"
  Delete "$INSTDIR\*.bin"
  Delete "$INSTDIR\icudtl.dat"
  Delete "$INSTDIR\vk_swiftshader_icd.json"
  Delete "$INSTDIR\version"
  Delete "$INSTDIR\LICENSE"
  Delete "$INSTDIR\icon.ico"
  RMDir /r "$INSTDIR\locales"
  RMDir /r "$INSTDIR\resources"
  Delete "$INSTDIR\Kaldir.exe"
  RMDir "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\OkiRaStudyo"
SectionEnd
