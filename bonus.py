#!/usr/bin/env python3
"""
Deep Sleeper Alarm - Bonus Python Features
Provides system-level alarm functionality and a local server for the web app.
"""

import time
import datetime
import threading
import webbrowser
import os
import sys
from pathlib import Path

try:
    import playsound
    HAS_PLAYSOUND = True
except ImportError:
    HAS_PLAYSOUND = False

try:
    from plyer import notification
    HAS_PLYER = True
except ImportError:
    HAS_PLYER = False

try:
    import tkinter as tk
    from tkinter import messagebox
    HAS_TKINTER = True
except ImportError:
    HAS_TKINTER = False


class SystemAlarm:
    """System-level alarm for deep sleepers with escalating intensity."""
    
    def __init__(self):
        self.alarms = []
        self.snooze_count = 0
        
    def add_alarm(self, hour, minute, label="Alarm"):
        """Add an alarm for a specific time."""
        self.alarms.append({
            'hour': hour,
            'minute': minute,
            'label': label,
            'enabled': True
        })
        
    def check_alarms(self):
        """Check if any alarms should trigger."""
        now = datetime.datetime.now()
        current_time = now.hour * 60 + now.minute
        
        for alarm in self.alarms:
            if alarm['enabled']:
                alarm_time = alarm['hour'] * 60 + alarm['minute']
                if abs(current_time - alarm_time) < 1:
                    self.trigger_alarm(alarm)
                    alarm['enabled'] = False
                    
    def trigger_alarm(self, alarm):
        """Trigger the alarm with escalating intensity."""
        print(f"\n{'='*50}")
        print(f"⏰ ALARM: {alarm['label']}")
        print(f"{'='*50}\n")
        
        # Show system notification
        self.show_notification(alarm['label'])
        
        # Play sound with increasing volume
        self.play_escalating_sound()
        
        # Show popup dialog
        self.show_popup(alarm['label'])
        
    def show_notification(self, label):
        """Show system notification."""
        if HAS_PLYER:
            notification.notify(
                title="Deep Sleeper Alarm",
                message=f"{label} - Wake up! Get up! Now!",
                timeout=10
            )
        else:
            # Fallback: print to console
            print(f"NOTIFICATION: {label} - Wake up!")
            
    def play_escalating_sound(self):
        """Play alarm sound with escalating volume."""
        if HAS_PLAYSOUND:
            # Play multiple times with increasing intensity
            for i in range(5):
                try:
                    playsound.playsound('alarm.mp3', block=False)
                    time.sleep(2)
                except:
                    # Fallback beep
                    print('\a' * (i + 1))
                    time.sleep(1)
        else:
            # Fallback: system beep
            for _ in range(10):
                print('\a')
                time.sleep(0.5)
                
    def show_popup(self, label):
        """Show popup dialog to stop alarm."""
        if HAS_TKINTER:
            root = tk.Tk()
            root.withdraw()  # Hide main window
            
            # Make window always on top
            root.attributes('-topmost', True)
            
            result = messagebox.showwarning(
                "DEEP SLEEPER ALARM",
                f"{label}\n\nWAKE UP! This alarm will repeat!",
                type='ok'
            )
            root.destroy()
        else:
            # Fallback: wait for user input
            input("Press Enter to stop the alarm...")
            
    def run(self):
        """Run the alarm checker loop."""
        print("Deep Sleeper Alarm System running...")
        print("Press Ctrl+C to exit\n")
        
        while True:
            self.check_alarms()
            time.sleep(30)  # Check every 30 seconds


def start_local_server():
    """Start a local HTTP server for the web alarm app."""
    import http.server
    import socketserver
    
    PORT = 8000
    
    # Get the directory of this script
    directory = Path(__file__).parent
    
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(directory), **kwargs)
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        webbrowser.open(f"http://localhost:{PORT}")
        httpd.serve_forever()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "server":
            start_local_server()
        elif sys.argv[1] == "system":
            alarm = SystemAlarm()
            alarm.add_alarm(7, 0, "Morning Alarm")
            alarm.run()
    else:
        print("Deep Sleeper Alarm - Bonus Python Features")
        print("Usage:")
        print("  python bonus.py server  - Start web server")
        print("  python bonus.py system  - Run system alarm")