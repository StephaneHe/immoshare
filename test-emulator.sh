#!/bin/bash
# ImmoShare Emulator UI Test Script
ADB="/mnt/c/Users/steph/AppData/Local/Android/Sdk/platform-tools/adb.exe"

tap() { $ADB shell input tap "$1" "$2" 2>/dev/null; }
text_input() { $ADB shell input text "$1" 2>/dev/null; }
get_ui() { 
  $ADB shell uiautomator dump /sdcard/ui_test.xml 2>/dev/null
  $ADB shell cat /sdcard/ui_test.xml 2>/dev/null | tr '>' '\n' | grep -oP 'text="[^"]+"' | grep -v 'text=""'
}
get_bounds() {
  $ADB shell cat /sdcard/ui_test.xml 2>/dev/null | tr '>' '\n' | grep "text=\"$1\"" | grep -oP 'bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]"' | head -1
}
tap_text() {
  local bounds=$(get_bounds "$1")
  if [ -z "$bounds" ]; then echo "  NOT FOUND: $1"; return 1; fi
  local coords=$(echo "$bounds" | grep -oP '[0-9]+' | head -4)
  local x1=$(echo "$coords" | sed -n '1p')
  local y1=$(echo "$coords" | sed -n '2p')
  local x2=$(echo "$coords" | sed -n '3p')
  local y2=$(echo "$coords" | sed -n '4p')
  local cx=$(( (x1 + x2) / 2 ))
  local cy=$(( (y1 + y2) / 2 ))
  tap $cx $cy
}
check_text() {
  local ui=$(get_ui)
  if echo "$ui" | grep -q "text=\"$1\""; then
    echo "  ✅ Found: $1"
    return 0
  else
    echo "  ❌ Missing: $1"
    return 1
  fi
}

echo "========================================="
echo "ImmoShare Emulator UI Tests"
echo "========================================="

# TEST 1: Login → Register
echo ""
echo "TEST 1: Login → Register (tap Sign Up)"
get_ui > /dev/null  # refresh UI tree
tap_text "Sign Up"
sleep 1
check_text "Create Account"
check_text "First name"
check_text "Last name"

# TEST 2: Register → Login  
echo ""
echo "TEST 2: Register → Login (tap Sign In)"
get_ui > /dev/null
tap_text "Sign In"
sleep 1
check_text "ImmoShare"
check_text "Sign In"
check_text "Forgot password?"

# TEST 3: Login → ForgotPassword
echo ""
echo "TEST 3: Login → ForgotPassword"
get_ui > /dev/null
tap_text "Forgot password?"
sleep 1
check_text "Reset Password"
check_text "Send Reset Link"
check_text "Back to Sign In"

# TEST 4: ForgotPassword → Login
echo ""
echo "TEST 4: ForgotPassword → Login (tap Back)"
get_ui > /dev/null
tap_text "Back to Sign In"
sleep 1
check_text "ImmoShare"
check_text "Email"
check_text "Password"

# TEST 5: Register a new user via API
echo ""
echo "TEST 5: Register new user (API integration)"
get_ui > /dev/null
tap_text "Sign Up"
sleep 1

# Fill in registration form
get_ui > /dev/null
tap_text "First name"
sleep 0.5
text_input "Test"
tap_text "Last name"
sleep 0.5
text_input "User"

# Find and tap email field  
get_ui > /dev/null
# Email field - tap it
EMAILBOUNDS=$($ADB shell cat /sdcard/ui_test.xml 2>/dev/null | tr '>' '\n' | grep 'text="Email"' | grep 'EditText' | grep -oP 'bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]"' | head -1)
if [ -n "$EMAILBOUNDS" ]; then
  coords=$(echo "$EMAILBOUNDS" | grep -oP '[0-9]+' | head -4)
  x1=$(echo "$coords" | sed -n '1p'); y1=$(echo "$coords" | sed -n '2p')
  x2=$(echo "$coords" | sed -n '3p'); y2=$(echo "$coords" | sed -n '4p')
  tap $(( (x1+x2)/2 )) $(( (y1+y2)/2 ))
  sleep 0.5
  text_input "test@immoshare.com"
fi

# Password field
PWBOUNDS=$($ADB shell cat /sdcard/ui_test.xml 2>/dev/null | tr '>' '\n' | grep 'password="true"' | grep -oP 'bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]"' | head -1)
if [ -n "$PWBOUNDS" ]; then
  coords=$(echo "$PWBOUNDS" | grep -oP '[0-9]+' | head -4)
  x1=$(echo "$coords" | sed -n '1p'); y1=$(echo "$coords" | sed -n '2p')
  x2=$(echo "$coords" | sed -n '3p'); y2=$(echo "$coords" | sed -n '4p')
  tap $(( (x1+x2)/2 )) $(( (y1+y2)/2 ))
  sleep 0.5
  text_input "Test1234!"
fi

# Hide keyboard and tap Create Account button
$ADB shell input keyevent 4 2>/dev/null  # Back key to dismiss keyboard
sleep 0.5
get_ui > /dev/null
# Tap the Create Account BUTTON (not title)
$ADB shell cat /sdcard/ui_test.xml 2>/dev/null | tr '>' '\n' | grep 'text="Create Account"' | while read -r line; do
  if echo "$line" | grep -q 'clickable="true"\|android.view.View'; then
    bounds=$(echo "$line" | grep -oP 'bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]"')
    if [ -n "$bounds" ]; then
      coords=$(echo "$bounds" | grep -oP '[0-9]+' | head -4)
      x1=$(echo "$coords" | sed -n '1p'); y1=$(echo "$coords" | sed -n '2p')
      x2=$(echo "$coords" | sed -n '3p'); y2=$(echo "$coords" | sed -n '4p')
      echo "  Tapping Create Account button at $(( (x1+x2)/2 )),$(( (y1+y2)/2 ))"
      $ADB shell input tap $(( (x1+x2)/2 )) $(( (y1+y2)/2 )) 2>/dev/null
    fi
  fi
done
sleep 3

# Check result - should either show MainTabs or an error
echo "  After register submit:"
get_ui > /dev/null
UI=$($ADB shell cat /sdcard/ui_test.xml 2>/dev/null | tr '>' '\n' | grep -oP 'text="[^"]+"' | grep -v 'text=""' | head -15)
echo "$UI"

# Check for tabs (Properties, Share, Alerts, Profile) = success
if echo "$UI" | grep -q "Properties"; then
  echo "  ✅ Registration succeeded - MainTabs visible"
elif echo "$UI" | grep -q "error\|Error\|failed\|Failed"; then
  echo "  ⚠️  Registration returned an error (expected if user exists)"
else
  echo "  ℹ️  Unknown state"
fi

echo ""
echo "========================================="
echo "JS Errors check:"
$ADB logcat -d -s "ReactNativeJS:*" 2>/dev/null | grep -iE "error" | grep "20:" | tail -5
echo "========================================="
echo "Tests complete!"
