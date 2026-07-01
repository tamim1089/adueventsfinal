/**
 * CameraService — Module-level singleton
 *
 * Owns the MediaStream lifecycle. Rules 7–9:
 *   - Rule 7: Stops all existing tracks before starting a new stream
 *   - Rule 8: Stores the stream globally
 *   - Rule 9: Returns the existing stream immediately if already live
 *
 * This class never calls getUserMedia itself.
 * getUserMedia MUST be called by the caller inside a user-gesture handler.
 * The resulting stream is then handed to CameraService.setStream().
 */
class CameraServiceClass {
  private _stream: MediaStream | null = null;

  /** Read-only access to the current stream */
  get stream(): MediaStream | null {
    return this._stream;
  }

  /**
   * True only when a stream exists AND every video track is still live.
   * A track can go dead if the user revokes permission mid-session.
   */
  get isLive(): boolean {
    if (!this._stream) return false;
    const tracks = this._stream.getVideoTracks();
    return tracks.length > 0 && tracks.every((t) => t.readyState === "live");
  }

  /**
   * Rule 7: Stop all tracks on the existing stream before accepting a new one.
   * Rule 8: Store the new stream globally.
   */
  setStream(stream: MediaStream): void {
    // Rule 7: release previous stream before storing the new one
    this._stopCurrentStream();
    this._stream = stream;
  }

  /**
   * Rule 9: If a valid stream is already live, return it without re-requesting.
   * Returns null if no live stream exists (caller should call getUserMedia).
   */
  getLiveStream(): MediaStream | null {
    return this.isLive ? this._stream : null;
  }

  /** Stop all tracks and clear the stored stream */
  release(): void {
    this._stopCurrentStream();
  }

  private _stopCurrentStream(): void {
    this._stream?.getTracks().forEach((t) => t.stop());
    this._stream = null;
  }
}

// Rule 8: single module-level instance
export const CameraService = new CameraServiceClass();

export async function captureStill(
  video: HTMLVideoElement,
  maxDim = 1280,
): Promise<ImageData | null> {
  if (video.readyState < 2 || video.videoWidth === 0) return null;

  const track = video.srcObject instanceof MediaStream
    ? video.srcObject.getVideoTracks()[0]
    : null;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  if (track && 'ImageCapture' in window && typeof (window as any).ImageCapture !== 'undefined') {
    try {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const capture = new (window as any).ImageCapture(track);
      const photoCapabilities = await capture.getPhotoCapabilities();

      let photoWidth = Math.min(photoCapabilities.imageWidthRange?.max ?? maxDim, maxDim);
      let photoHeight = Math.round(photoWidth * (video.videoHeight / video.videoWidth));

      if (photoCapabilities.imageWidthRange) {
        photoWidth = Math.min(
          Math.max(photoWidth, photoCapabilities.imageWidthRange.min),
          photoCapabilities.imageWidthRange.max,
        );
      }
      if (photoCapabilities.imageHeightRange) {
        photoHeight = Math.min(
          Math.max(photoHeight, photoCapabilities.imageHeightRange.min),
          photoCapabilities.imageHeightRange.max,
        );
      }

      const blob = await capture.takePhoto({ imageWidth: photoWidth, imageHeight: photoHeight });
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch {
      // fall through to canvas capture
    }
  }

  const canvas = document.createElement("canvas");
  const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
