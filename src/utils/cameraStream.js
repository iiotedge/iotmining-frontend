// utils/cameraStream.js
import Hls from "hls.js";

export const initializeHLSStream = (videoId, streamUrl, onPlayCallback, onErrorCallback) => {
  const video = document.getElementById(videoId);

  if (!video) {
    console.error(`Video element with ID '${videoId}' not found.`);
    onErrorCallback?.("Video element not found.");
    return;
  }

  // Cleanup previous HLS instance if it exists
  if (video.hlsInstance) {
    video.hlsInstance.destroy();
    video.hlsInstance = null;
  }

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.attachMedia(video);
    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls.loadSource(streamUrl);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().then(() => {
        onPlayCallback?.();
      }).catch((e) => {
        console.error("HLS Play Error:", e);
        onErrorCallback?.(`Unable to play stream: ${e.message}`);
      });
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error("HLS.js error:", data);
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            onErrorCallback?.("Network error during stream loading.");
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            onErrorCallback?.("Media error during playback.");
            hls.recoverMediaError();
            break;
          default:
            onErrorCallback?.(`Fatal HLS error: ${data.details || "Unknown"}`);
            hls.destroy();
            break;
        }
      } else {
        onErrorCallback?.(`Non-fatal HLS error: ${data.details || "Unknown"}`);
      }
    });

    video.hlsInstance = hls;
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    // Native HLS support for Safari/iOS
    video.src = streamUrl;
    video.addEventListener("loadedmetadata", () => {
      video.play().then(() => {
        onPlayCallback?.();
      }).catch((e) => {
        console.error("Native HLS Play Error:", e);
        onErrorCallback?.(`Unable to play stream: ${e.message}`);
      });
    });
    // Add error listener for native video element
    video.addEventListener('error', (e) => {
      console.error("Native video error:", e);
      onErrorCallback?.(`Native video error: ${e.message || 'Unknown'}`);
    });
  } else {
    onErrorCallback?.("HLS playback not supported in this browser.");
  }
};

export const destroyHLSStream = (videoId) => {
  const video = document.getElementById(videoId);
  if (video) {
    if (video.hlsInstance) {
      video.hlsInstance.destroy();
      video.hlsInstance = null;
    }
    video.pause();
    video.removeAttribute('src'); // Clear the source
    video.load(); // Reload the video element to apply changes
  }
};