// Deep Sleeper Alarm System
class DeepSleeperAlarm {
    constructor() {
        this.alarms = [];
        this.activeAlarm = null;
        this.audioContext = null;
        this.oscillator = null;
        this.gainNode = null;
        this.volume = 0.5;
        this.volumeInterval = null;
        this.flashInterval = null;
        this.snoozeCount = 0;
        this.init();
    }

    init() {
        this.loadAlarms();
        this.setupEventListeners();
        this.requestNotificationPermission();
        this.checkAlarms();
        setInterval(() => this.checkAlarms(), 1000);
    }

    setupEventListeners() {
        document.getElementById('set-alarm-btn').addEventListener('click', () => this.setAlarm());
        document.getElementById('stop-btn').addEventListener('click', () => this.stopAlarm());
        document.getElementById('snooze-btn').addEventListener('click', () => this.snoozeAlarm());
    }

    loadAlarms() {
        const saved = localStorage.getItem('alarms');
        this.alarms = saved ? JSON.parse(saved) : [];
        this.renderAlarms();
    }

    saveAlarms() {
        localStorage.setItem('alarms', JSON.stringify(this.alarms));
    }

    setAlarm() {
        let hour = parseInt(document.getElementById('hour').value) || 1;
        const minute = parseInt(document.getElementById('minute').value) || 0;
        const ampm = document.getElementById('ampm').value;
        const label = document.getElementById('label').value.trim() || 'Alarm';

        // Convert 12-hour to 24-hour format
        if (ampm === 'PM' && hour !== 12) {
            hour += 12;
        } else if (ampm === 'AM' && hour === 12) {
            hour = 0;
        }

        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            alert('Please enter valid time (1-12 for hours, 0-59 for minutes)');
            return;
        }

        const alarm = {
            id: Date.now(),
            hour,
            minute,
            label,
            enabled: true,
            snoozeIntensity: 0
        };

        this.alarms.push(alarm);
        this.saveAlarms();
        this.renderAlarms();
        this.clearForm();
    }

    clearForm() {
        document.getElementById('hour').value = '';
        document.getElementById('minute').value = '';
        document.getElementById('label').value = '';
        document.getElementById('ampm').value = 'AM';
    }

    renderAlarms() {
        const container = document.getElementById('alarms-container');
        
        if (this.alarms.length === 0) {
            container.innerHTML = '<p class="no-alarms">No alarms set. Add one above!</p>';
            return;
        }

        container.innerHTML = this.alarms.map(alarm => `
            <div class="alarm-item" data-id="${alarm.id}">
                <div class="alarm-info">
                    <div class="alarm-time-display">${this.formatTime(alarm.hour, alarm.minute)}</div>
                    <div class="alarm-label-display">${alarm.label}</div>
                </div>
                <div class="alarm-actions">
                    <button class="toggle-btn ${alarm.enabled ? '' : 'disabled'}" 
                            onclick="alarmApp.toggleAlarm(${alarm.id})">
                        ${alarm.enabled ? 'ON' : 'OFF'}
                    </button>
                    <button class="delete-btn" onclick="alarmApp.deleteAlarm(${alarm.id})">DELETE</button>
                </div>
            </div>
        `).join('');
    }

    formatTime(hour, minute) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
    }

    toggleAlarm(id) {
        const alarm = this.alarms.find(a => a.id === id);
        if (alarm) {
            alarm.enabled = !alarm.enabled;
            this.saveAlarms();
            this.renderAlarms();
        }
    }

    deleteAlarm(id) {
        this.alarms = this.alarms.filter(a => a.id !== id);
        this.saveAlarms();
        this.renderAlarms();
    }

    checkAlarms() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const currentDate = now.toDateString();

        for (const alarm of this.alarms) {
            if (alarm.enabled && !alarm.triggered) {
                const alarmTime = alarm.hour * 60 + alarm.minute;
                // Check if alarm time matches (within 1 minute window)
                if (Math.abs(currentTime - alarmTime) < 1) {
                    this.triggerAlarm(alarm);
                    alarm.triggered = true;
                    this.saveAlarms();
                }
            }
        }
    }

    triggerAlarm(alarm) {
        this.activeAlarm = alarm;
        this.snoozeCount = 0;
        this.volume = 0.5;
        
        // Show alarm screen
        document.getElementById('alarm-active').style.display = 'block';
        document.getElementById('active-alarm-label').textContent = alarm.label;
        document.getElementById('active-alarm-time').textContent = this.formatTime(alarm.hour, alarm.minute);
        
        // Start alarm effects
        this.startAudio();
        this.startFlash();
        this.showNotification();
    }

    startAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.volume;
        this.gainNode.connect(this.audioContext.destination);
        
        this.playBeep();
        
        // Escalate volume every 30 seconds
        this.volumeInterval = setInterval(() => {
            this.volume = Math.min(this.volume + 0.1, 1.0);
            this.gainNode.gain.value = this.volume;
            document.getElementById('intensity-hint').textContent = 
                `Volume: ${Math.round(this.volume * 100)}% - Get up!`;
        }, 30000);
    }

    playBeep() {
        if (!this.audioContext) return;
        
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.value = 880; // High pitch for attention
        this.oscillator.connect(this.gainNode);
        this.oscillator.start();
        
        // Play beep pattern
        setTimeout(() => {
            if (this.oscillator) {
                this.oscillator.stop();
            }
        }, 500);
        
        // Repeat beep every 1.5 seconds
        setTimeout(() => this.playBeep(), 1500);
    }

    startFlash() {
        document.body.classList.add('flash');
    }

    stopFlash() {
        document.body.classList.remove('flash');
    }

    showNotification() {
        if (Notification.permission === 'granted') {
            new Notification('Deep Sleeper Alarm', {
                body: `${this.activeAlarm.label} - Wake up!`,
                requireInteraction: true
            });
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }

    stopAlarm() {
        this.cleanupAlarm();
        document.getElementById('alarm-active').style.display = 'none';
        document.getElementById('intensity-hint').textContent = '';
        
        // Reset triggered state for next day
        if (this.activeAlarm) {
            this.activeAlarm.triggered = false;
            this.activeAlarm.snoozeIntensity = 0;
            this.saveAlarms();
        }
    }

    snoozeAlarm() {
        this.cleanupAlarm();
        this.snoozeCount++;
        
        // Increase intensity for next alarm
        if (this.activeAlarm) {
            this.activeAlarm.snoozeIntensity = this.snoozeCount;
            this.saveAlarms();
        }
        
        // Set snooze for 5 minutes
        const snoozeTime = new Date();
        snoozeTime.setMinutes(snoozeTime.getMinutes() + 5);
        
        // Create temporary snooze alarm
        const snoozeAlarm = {
            id: Date.now() + '_snooze',
            hour: snoozeTime.getHours(),
            minute: snoozeTime.getMinutes(),
            label: `Snooze #${this.snoozeCount}`,
            enabled: true,
            isSnooze: true,
            originalAlarm: this.activeAlarm
        };
        
        this.alarms.push(snoozeAlarm);
        this.saveAlarms();
        this.renderAlarms();
        
        document.getElementById('alarm-active').style.display = 'none';
    }

    cleanupAlarm() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        if (this.volumeInterval) {
            clearInterval(this.volumeInterval);
            this.volumeInterval = null;
        }
        this.stopFlash();
    }
}

// Initialize the alarm app
const alarmApp = new DeepSleeperAlarm();