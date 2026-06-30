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
