const crypto = require("crypto");

const algorithm = "aes-256-cbc";

const encrypt = function(clearText, secret, saltGenerator) {
  const iv = saltGeneratorWrapper(saltGenerator(secret));
  const cipher = crypto.createCipheriv(algorithm, secret, iv);
  const encrypted = cipher.update(clearText);
  const finalBuffer = Buffer.concat([encrypted, cipher.final()]);
  const encryptedHex = iv.toString("hex") + ":" + finalBuffer.toString("hex");
  return encryptedHex;
};

const saltGeneratorWrapper = iv => {
  if (iv instanceof Buffer) {
    if (iv.length !== 16) {
      throw new Error("Invalid salt provided, please ensure that the salt is a Buffer of length 16");
    }
    return iv;
  }

  if (typeof iv === "string" || iv instanceof String) {
    if (iv.length !== 16) {
      throw new Error("Invalid salt, please ensure that the salt is a string of length 16");
    }
    return Buffer.from(iv);
  }

  throw new Error("Invalid salt, please ensure that the salt is either a string or a Buffer of length 16");
};

const defaultSaltGenerator = secret => crypto.randomBytes(16);

const decrypt = function(encryptedHex, secret) {
  const encryptedArray = encryptedHex.split(":");

  const iv = new Buffer.from(encryptedArray[0], "hex");
  const encrypted = new Buffer.from(encryptedArray[1], "hex");
  const decipher = crypto.createDecipheriv(algorithm, secret, iv);
  const decrypted = decipher.update(encrypted);
  const clearText = Buffer.concat([decrypted, decipher.final()]).toString();
  return clearText;
};

const getCipherKey = function(key) {
  if (key && key.length >= 8) {
    return crypto.scryptSync(key, "salt", 32);
  } else {
    throw new Error("Invalid key, must be min 8 characters");
  }
};

module.exports = {
  encrypt,
  decrypt,
  defaultSaltGenerator,
  getCipherKey
};
