// Temporarily disable on-device classification to avoid runtime issues on RN
// Always return a safe default label. You can re-enable TFJS later if needed.
export async function classifyImage(uri) {
  return ["unknown"];
}

