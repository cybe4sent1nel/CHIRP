import { useState, useRef, useEffect } from "react";
import QRCodeStyling from "qr-code-styling";
import { RefreshCw, Copy, Download } from "lucide-react";
import { useSelector } from "react-redux";

const qrPatterns = [
  "ball0.png", "ball1.png", "ball2.png", "ball3.png", "ball5.png", "ball6.png",
  "ball7.png", "ball8.png", "ball10.png", "ball11.png", "ball12.png", "ball13.png",
  "ball14.png", "ball15.png", "ball16.png", "ball17.png", "ball18.png", "ball19.png",
  "circle-zebra-vertical.png", "circle-zebra.png", "circle.png", "circular.png",
  "diamond.png", "dot.png", "edge-cut-smooth.png", "edge-cut.png",
  "frame0.png", "frame1.png", "frame2.png", "frame3.png", "frame4.png", "frame5.png",
  "frame6.png", "frame7.png", "frame8.png", "frame10.png", "frame11.png", "frame12.png",
  "frame13.png", "frame14.png", "frame16.png", "japnese.png", "leaf.png", "mosaic.png",
  "pointed-edge-cut.png", "pointed-in-smooth.png", "pointed-in.png", "pointed-smooth.png",
  "pointed.png", "round.png", "rounded-in-smooth.png", "rounded-in.png", "rounded-pointed.png",
  "square.png", "star.png"
];

const QR_DOT_TYPES = ["rounded", "dots", "classy", "classy-rounded", "extra-rounded", "square"];

const ProfileQR = () => {
  const user = useSelector((state) => state.user?.value);
  const qrRef = useRef(null);
  const qrInstanceRef = useRef(null);

  const [bgColor, setBgColor] = useState("#ffffff");
  const [fgColor, setFgColor] = useState("#000000");
  const [pattern, setPattern] = useState(qrPatterns[0]);
  const [dotType, setDotType] = useState(QR_DOT_TYPES[0]);
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/profile/${user?.username}`;

  // Reinitialize QR code when any style property changes
  useEffect(() => {
    if (!user || !qrRef.current) return;

    // Clear previous QR code
    if (qrInstanceRef.current) {
      qrRef.current.innerHTML = "";
    }

    // Create new QR code with current settings
    const qrCode = new QRCodeStyling({
      width: 280,
      height: 280,
      data: profileUrl,
      image: "/LOGOO.png",
      dotsOptions: {
        color: fgColor,
        type: dotType,
      },
      cornersSquareOptions: {
        color: fgColor,
        type: "square",
      },
      cornersDotOptions: {
        color: fgColor,
        type: "dot",
      },
      backgroundOptions: {
        color: bgColor,
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 5,
        imageSize: 0.28,
      },
      margin: 10,
    });

    qrInstanceRef.current = qrCode;
    qrCode.append(qrRef.current);

    return () => {
      if (qrRef.current) {
        qrRef.current.innerHTML = "";
      }
    };
  }, [user, profileUrl, fgColor, bgColor, dotType]);

  const handleDownloadQR = () => {
    if (qrInstanceRef.current) {
      qrInstanceRef.current.download({ name: `${user?.username}-qr`, extension: "png" });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateNew = () => {
    const randomBg =
      "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    const randomFg =
      "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    const randomPattern = qrPatterns[Math.floor(Math.random() * qrPatterns.length)];
    const randomDotType = QR_DOT_TYPES[Math.floor(Math.random() * QR_DOT_TYPES.length)];

    setBgColor(randomBg);
    setFgColor(randomFg);
    setPattern(randomPattern);
    setDotType(randomDotType);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading Profile QR Generator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Profile QR Code
          </h1>
          <p className="text-gray-600">
            Share your profile with a beautiful custom QR code
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* QR Code Preview */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
            {/* QR Code Container with Pattern Overlay */}
            <div
              className="relative p-8 rounded-xl shadow-lg overflow-hidden"
              style={{ backgroundColor: bgColor }}
            >
              {/* Pattern overlay */}
              {pattern && (
                <div
                  style={{
                    position: "absolute",
                    inset: 18,
                    backgroundImage: `url(/qr-patterns/${pattern})`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "contain",
                    opacity: 0.12,
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* QR Code */}
              <div
                ref={qrRef}
                className="flex justify-center items-center relative z-10"
              ></div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 w-full">
              <button
                onClick={handleDownloadQR}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-all active:scale-95"
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            {/* Profile Link */}
            <div className="mt-4 w-full bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Profile Link:</p>
              <p className="text-sm text-indigo-600 font-mono truncate">
                {profileUrl}
              </p>
            </div>
          </div>

          {/* Customization Panel */}
          <div className="space-y-6">
            {/* Colors Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Customize Colors
              </h2>

              {/* Foreground Color */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  QR Code Color (Foreground)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-200"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-mono text-gray-600">
                      {fgColor}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Make QR code darker
                    </p>
                  </div>
                </div>
              </div>

              {/* Background Color */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-200"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-mono text-gray-600">
                      {bgColor}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Make background lighter
                    </p>
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase">
                  Quick Presets
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { bg: "#ffffff", fg: "#000000" },
                    { bg: "#1f2937", fg: "#ffffff" },
                    { bg: "#4f46e5", fg: "#ffffff" },
                    { bg: "#ec4899", fg: "#ffffff" },
                    { bg: "#06b6d4", fg: "#ffffff" },
                    { bg: "#f59e0b", fg: "#000000" },
                    { bg: "#10b981", fg: "#ffffff" },
                    { bg: "#8b5cf6", fg: "#ffffff" },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setBgColor(preset.bg);
                        setFgColor(preset.fg);
                      }}
                      className="h-10 rounded-lg border-2 border-gray-200 hover:border-indigo-500 transition-all"
                      style={{
                        backgroundColor: preset.bg,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Dot Type Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                QR Dot Patterns
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {QR_DOT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setDotType(type)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                      dotType === type
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Change how the QR code dots look
              </p>
            </div>

            {/* Pattern Overlay Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Background Patterns
              </h2>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {qrPatterns.map((pat) => (
                  <button
                    key={pat}
                    onClick={() => setPattern(pat)}
                    className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                      pattern === pat
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    title={pat}
                  >
                    {pat.replace(".png", "").replace(".svg", "").substring(0, 12)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Decorative overlay patterns
              </p>
            </div>

            {/* Generate New Button */}
            <button
              onClick={handleGenerateNew}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-4 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="w-5 h-5" />
              Generate Random Style
            </button>

            {/* Info Box */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <h3 className="font-semibold text-indigo-900 mb-2">💡 Tip</h3>
              <p className="text-sm text-indigo-800">
                Your QR code encodes your profile link. Anyone can scan it to
                visit your profile instantly. Generate random styles to keep it
                fresh!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileQR;
