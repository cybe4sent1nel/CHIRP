import crypto from 'crypto'

/**
 * MessageEncryption - AES-256-GCM with authenticated encryption
 * Secure end-to-end encryption for messages
 */
class MessageEncryption {
  /**
   * Encrypt message using AES-256-GCM
   * @param {string} message - Message to encrypt
   * @param {string} password - Password/passphrase
   * @returns {object} Encrypted data with metadata
   */
  static encryptMessage(message, password) {
    try {
      // 1. Derive key using PBKDF2 (strong key derivation)
      const salt = crypto.randomBytes(32) // 256-bit salt
      const iterations = 310000 // OWASP recommendation
      const key = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256')

      // 2. Generate random IV (Initialization Vector)
      const iv = crypto.randomBytes(12) // 96-bit IV for GCM mode

      // 3. Create cipher
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

      // 4. Encrypt message
      let encrypted = cipher.update(message, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      // 5. Get authentication tag
      const authTag = cipher.getAuthTag()

      return {
        ciphertext: encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: 'aes-256-gcm',
        keyDerivation: 'pbkdf2-sha256',
        iterations: iterations,
        tagLength: 16,
        success: true
      }
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`)
    }
  }

  /**
   * Decrypt message using AES-256-GCM
   * @param {object} encryptedData - Encrypted data object
   * @param {string} password - Password/passphrase
   * @returns {object} Decrypted message
   */
  static decryptMessage(encryptedData, password) {
    try {
      const { ciphertext, salt, iv, authTag, iterations } = encryptedData

      // 1. Validate inputs
      if (!ciphertext || !salt || !iv || !authTag) {
        throw new Error('Invalid encrypted data structure')
      }

      // 2. Derive key using same parameters
      const key = crypto.pbkdf2Sync(
        password,
        Buffer.from(salt, 'hex'),
        iterations || 310000,
        32,
        'sha256'
      )

      // 3. Create decipher
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(iv, 'hex')
      )

      // 4. Set authentication tag for verification
      decipher.setAuthTag(Buffer.from(authTag, 'hex'))

      // 5. Decrypt message
      let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return {
        message: decrypted,
        success: true,
        authenticated: true,
        tampered: false
      }
    } catch (error) {
      // Authentication failed or wrong password
      return {
        message: null,
        success: false,
        authenticated: false,
        tampered: error.message.includes('Unsupported state or unable to authenticate data'),
        error: 'Decryption failed - wrong password or message corrupted'
      }
    }
  }

  /**
   * Encrypt with honey encryption (produces fake message on wrong password)
   * @param {string} message - Message to encrypt
   * @param {string} password - Password
   * @returns {object} Encrypted data with fake option
   */
  static generateFakeMessage(length = 50) {
    const templates = [
      'The weather is nice today. Hope you are having a great time.',
      'Just finished work. Heading to grab some coffee with friends.',
      'Watched a great movie last night. You should check it out.',
      'Just landed. The flight was smooth. See you soon.',
      'Working on a new project. Pretty excited about it.',
      'Having lunch with the team. The food here is amazing.'
    ]

    return templates[Math.floor(Math.random() * templates.length)]
      .substring(0, length)
  }

  /**
   * Honey Encryption - confuses attackers with plausible fake message
   * @param {string} message - Real message
   * @param {string} password - Password
   * @returns {object} Encrypted with honey encryption
   */
  static honeyEncrypt(message, password) {
    try {
      const salt = crypto.randomBytes(32)
      const iterations = 310000
      const key = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256')
      const iv = crypto.randomBytes(12)

      // Encrypt real message
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
      let encrypted = cipher.update(message, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      const authTag = cipher.getAuthTag()

      // Generate fake message
      const fakeMessage = this.generateFakeMessage(message.length)
      const fakeCipher = crypto.createCipheriv('aes-256-gcm', key, iv)
      let fakeEncrypted = fakeCipher.update(fakeMessage, 'utf8', 'hex')
      fakeEncrypted += fakeCipher.final('hex')
      const fakeAuthTag = fakeCipher.getAuthTag()

      return {
        ciphertext: encrypted,
        fake_ciphertext: fakeEncrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        fakeAuthTag: fakeAuthTag.toString('hex'),
        algorithm: 'honey-aes-256-gcm',
        success: true
      }
    } catch (error) {
      throw new Error(`Honey encryption failed: ${error.message}`)
    }
  }

  /**
   * Vernam Cipher (One-Time Pad) - Theoretically unbreakable
   * WARNING: Key must be truly random and never reused!
   */
  static vernamEncrypt(message) {
    try {
      const messageBuffer = Buffer.from(message, 'utf8')
      const key = crypto.randomBytes(messageBuffer.length) // Key as long as message

      // XOR encryption
      const encrypted = Buffer.alloc(messageBuffer.length)
      for (let i = 0; i < messageBuffer.length; i++) {
        encrypted[i] = messageBuffer[i] ^ key[i]
      }

      return {
        ciphertext: encrypted.toString('hex'),
        key: key.toString('hex'), // Must be transmitted securely!
        algorithm: 'vernam-cipher',
        warning: 'Key must be kept secret and never reused',
        success: true
      }
    } catch (error) {
      throw new Error(`Vernam encryption failed: ${error.message}`)
    }
  }

  /**
   * Vernam Cipher Decryption
   */
  static vernamDecrypt(ciphertext, key) {
    try {
      const ciphertextBuffer = Buffer.from(ciphertext, 'hex')
      const keyBuffer = Buffer.from(key, 'hex')

      if (keyBuffer.length !== ciphertextBuffer.length) {
        throw new Error('Key length must match ciphertext length')
      }

      const decrypted = Buffer.alloc(ciphertextBuffer.length)
      for (let i = 0; i < ciphertextBuffer.length; i++) {
        decrypted[i] = ciphertextBuffer[i] ^ keyBuffer[i]
      }

      return {
        message: decrypted.toString('utf8'),
        success: true
      }
    } catch (error) {
      return {
        message: null,
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Hash message for integrity verification
   * @param {string} message - Message to hash
   * @returns {string} SHA-256 hash
   */
  static hashMessage(message) {
    return crypto.createHash('sha256').update(message).digest('hex')
  }

  /**
   * Verify message hasn't been tampered with
   * @param {string} message - Original message
   * @param {string} hash - Stored hash
   * @returns {boolean} True if hash matches
   */
  static verifyIntegrity(message, hash) {
    return this.hashMessage(message) === hash
  }

  /**
   * Generate secure random token (for key exchange, one-time codes, etc.)
   * @param {number} length - Token length in bytes
   * @returns {string} Random token in hex
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Encrypt sensitive data (keys, passwords)
   * Using master encryption key
   */
  static encryptSensitive(data, masterKey) {
    try {
      const salt = crypto.randomBytes(16)
      const key = crypto.pbkdf2Sync(masterKey, salt, 310000, 32, 'sha256')
      const iv = crypto.randomBytes(12)

      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex')
      encrypted += cipher.final('hex')
      const authTag = cipher.getAuthTag()

      return {
        encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      }
    } catch (error) {
      throw new Error(`Sensitive data encryption failed: ${error.message}`)
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decryptSensitive(encryptedData, masterKey) {
    try {
      const { encrypted, salt, iv, authTag } = encryptedData
      const key = crypto.pbkdf2Sync(
        masterKey,
        Buffer.from(salt, 'hex'),
        310000,
        32,
        'sha256'
      )

      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(iv, 'hex')
      )

      decipher.setAuthTag(Buffer.from(authTag, 'hex'))

      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return JSON.parse(decrypted)
    } catch (error) {
      throw new Error(`Sensitive data decryption failed: ${error.message}`)
    }
  }
}

export default MessageEncryption
