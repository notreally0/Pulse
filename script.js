const canvas = document.getElementById('visualizer');

if (canvas) {
    const ctx = canvas.getContext('2d');
    const pads = document.querySelectorAll('.pad-btn');

    const recBtn = document.getElementById('rec-btn');
    const playBtn = document.getElementById('play-btn');
    const clearBtn = document.getElementById('clear-btn');
    const recStatus = document.getElementById('rec-status');

    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let audioCtx = null;
    let currentRadius = 20;
    let targetRadius = 20;
    let rippleColor = '#00ff66';

    let isRecording = false;
    let startTime = 0;
    let recordedNotes = [];
    let playbackTimeouts = [];

    function triggerSound(freq, padEl, recordable = true) {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);

        targetRadius = Math.random() * 80 + 80;
        rippleColor = freq > 500 ? '#ff6600' : '#00ff66';

        if (padEl) {
            padEl.classList.add('active');
            setTimeout(() => padEl.classList.remove('active'), 150);
        }

        if (isRecording && recordable) {
            const timeoffset = Date.now() - startTime;
            recordedNotes.push({ freq, timeoffset, key: padEl ? padEl.dataset.key : null});
        }
    }

    pads.forEach(pad => {
        pad.addEventListener('click', () => {
            const freq = parseFloat(pad.dataset.freq);
            triggerSound(freq, pad);
        });
    });

    window.addEventListener('keydown', (e) => {
        const key = e.key.toUpperCase();
        const pad = Array.from(pads).find(p => p.dataset && p.dataset.key === key);
        if (pad) {
            const freq = parseFloat(pad.dataset.freq);
            triggerSound(freq, pad);
        }
    });

    recBtn.addEventListener('click', () => {
        if (!isRecording) {
            isRecording = true;
            recordedNotes = [];
            startTime = Date.now();
            recBtn.classList.add('recording');
            recBtn.innerText = 'STOP';
            recStatus.innerText = 'STATUS: RECORDING...';
            playBtn.disabled = true;
            clearBtn.disabled = true;
        } else {
            isRecording = false;
            recBtn.classList.remove('recording');
            recBtn.innerText = 'REC';

            if (recordedNotes.length >0) {
                recStatus.innerText = `SAVED: ${recordedNotes.length} NOTES`;
                playBtn.disabled = false;
                clearBtn.disabled = false;
            } else {
                recStatus.innerText = 'STATUS: IDLE';
            }
        }
    });

    playBtn.addEventListener('click', () => {
        if (recordedNotes.length === 0) return;

        playbackTimeouts.forEach(t => clearTimeout(t));
        playbackTimeouts = [];

        recStatus.innerText = 'PLAYING BACK...';

        recordedNotes.forEach(note => {
            const timeout = setTimeout(() => {
                const pad = Array.from(pads).find(p => p.dataset.key === note.key);
                triggerSound(note.freq, pad, false);
            }, note.timeoffset);

            playbackTimeouts.push(timeout);
        });

        const lastNoteTime = recordedNotes[recordedNotes.length - 1].timeoffset + 600;
        const endTimeout = setTimeout(() => {
            recStatus.innerText = 'PLAYBACK COMPLETE';
        }, lastNoteTime);
        playbackTimeouts.push(endTimeout);
    });

    clearBtn.addEventListener('click', () => {
        recordedNotes = [];
        playbackTimeouts.forEach(t => clearTimeout(t));
        playbackTimeouts = [];
        playBtn.disabled = true;
        clearBtn.disabled = true;
        recStatus.innerText = 'CLEARED';
    });

    function render() {
        ctx.fillStyle = 'rgba(6,6,10,0.2)';
        ctx.fillRect(0,0, canvas.width, canvas.height);

        currentRadius += (targetRadius - currentRadius) * 0.1;
        targetRadius = Math.max(20, targetRadius - 1.5);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = rippleColor;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = rippleColor;
        ctx.stroke();

        requestAnimationFrame(render);
    }
    render();
}