declare module "ml5" {
  export function pitchDetection(
    model: string,
    audioContext: AudioContext,
    stream: MediaStream,
    callback: () => void,
  ): {
    getPitch: (
      callback: (err: unknown, frequency: number | null) => void,
    ) => void;
  };
}
