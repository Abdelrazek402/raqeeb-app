export function downloadWindowsExe(): void {
  window.location.assign('/api/download/windows-exe');
}

export function downloadAndroidApk(): void {
  window.location.assign('/api/download/android-apk');
}
