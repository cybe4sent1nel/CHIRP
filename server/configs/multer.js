import multer from "multer";

const storage = multer.diskStorage({});

// Custom file filter to handle unexpected fields gracefully
const fileFilter = (req, file, cb) => {
  // Accept any file type - let the controller decide what to do
  cb(null, true);
};

export const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

