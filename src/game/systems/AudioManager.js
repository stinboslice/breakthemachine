let currentMusicKey = null;
let currentMusic = null;

export function playMusic(scene, key, options = {}) {
  if (!scene || !key) return;

  if (currentMusicKey === key && currentMusic?.isPlaying) {
    return;
  }

  stopMusic();

  currentMusicKey = key;
  currentMusic = scene.sound.add(key, {
    loop: true,
    volume: options.volume ?? 0.45
  });

  currentMusic.play();
}

export function stopMusic() {
  if (currentMusic) {
    currentMusic.stop();
    currentMusic.destroy();
  }

  currentMusic = null;
  currentMusicKey = null;
}
