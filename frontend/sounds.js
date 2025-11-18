/* ============================================================
   SOUND ENGINE — Monte Carlo Gamble Game
   Fully fixed for:
   - Chrome autoplay restrictions
   - iOS Safari tap requirement
   - Proper preloading
   - Safe sound triggering
   ============================================================ */

   const SoundEngine = (() => {

    /* ------------------------------------------------------------
       LOAD SOUNDS (correct paths)
       ------------------------------------------------------------ */
    const sounds = {
      ambient: new Audio("assets/sounds/ambient-loop.mp3"),
      gamble:  new Audio("assets/sounds/gamble.wav"),
      spin:    new Audio("assets/sounds/spin.wav"),
      reward:  new Audio("assets/sounds/reward.wav")
    };
  
    /* Preload & configure */
    sounds.ambient.loop = true;
    sounds.ambient.volume = 0.25;
    sounds.ambient.load();
  
    const DEFAULT_VOLUME = {
      gamble: 0.8,
      spin: 0.5,
      reward: 0.9,
    };
  
    for (const key in DEFAULT_VOLUME) {
      if (sounds[key]) sounds[key].volume = DEFAULT_VOLUME[key];
    }
  
    /* ------------------------------------------------------------
       GLOBAL AUDIO ENABLE/DISABLE
       ------------------------------------------------------------ */
    let audioEnabled = true;
  
    function enableAudio() {
      audioEnabled = true;
      try { sounds.ambient.play(); } catch {}
    }
  
    function disableAudio() {
      audioEnabled = false;
      sounds.ambient.pause();
    }
  
    function toggleAudio() {
      audioEnabled ? disableAudio() : enableAudio();
    }
  
    /* ------------------------------------------------------------
       SAFE SOUND PLAY WRAPPER
       ------------------------------------------------------------ */
    function playSound(name) {
      if (!audioEnabled) return;
  
      const snd = sounds[name];
      if (!snd) return;
  
      snd.currentTime = 0;
      snd.play().catch(() => {
        console.log("Autoplay prevented:", name);
      });
    }
  
    /* ------------------------------------------------------------
       PUBLIC API
       ------------------------------------------------------------ */
    return {
      playGamble: () => playSound("gamble"),
      playSpin:   () => playSound("spin"),
      playReward: () => playSound("reward"),
  
      musicOn: enableAudio,
      musicOff: disableAudio,
      toggleAudio,
  
      startAmbient: () => {
        try { sounds.ambient.play(); } catch {}
      }
    };
  
  })();
  
  /* ------------------------------------------------------------
     AUTO-START AMBIENT MUSIC ON FIRST USER GESTURE
     (Chrome + Safari required)
     ------------------------------------------------------------ */
  
  const startOnFirstInteraction = () => {
    SoundEngine.startAmbient();
    window.removeEventListener("click", startOnFirstInteraction);
    window.removeEventListener("touchstart", startOnFirstInteraction);
  };
  
  window.addEventListener("click", startOnFirstInteraction, { once: true });
  window.addEventListener("touchstart", startOnFirstInteraction, { once: true });
  
  window.SoundEngine = SoundEngine;
  