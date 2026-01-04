import ImageKit from "@imagekit/nodejs";

let imageKit = null;

// Initialize ImageKit if credentials are provided
if (process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
  imageKit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
  console.log("✓ ImageKit initialized");
} else {
  // Create a mock/stub ImageKit if credentials are missing
  console.warn("⚠ ImageKit credentials missing - file uploads will be disabled");
  imageKit = {
    files: {
      upload: async () => {
        throw new Error("ImageKit not configured. Set IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY, and IMAGEKIT_URL_ENDPOINT in .env");
      }
    },
    helper: {
      buildSrc: (options) => options.src
    }
  };
}

export default imageKit;