use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use sha2::{Digest, Sha256};

pub fn hash_password(password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(b"noteflow-salt-");
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    BASE64.encode(result)
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    hash_password(password) == hash
}

pub fn encrypt_content(content: &str, password: &str) -> Result<String, String> {
    let mut key_hasher = Sha256::new();
    key_hasher.update(b"noteflow-key-salt-");
    key_hasher.update(password.as_bytes());
    let key_bytes = key_hasher.finalize();

    let cipher = Aes256Gcm::new_from_slice(&key_bytes)
        .map_err(|e| format!("Failed to create cipher: {}", e))?;

    // 96-bit cryptographically secure random nonce (prevents nonce reuse vulnerability)
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

    let ciphertext = cipher
        .encrypt(&nonce, content.as_bytes())
        .map_err(|e| format!("Encryption error: {}", e))?;

    // Prepend 12-byte nonce to ciphertext
    let mut combined = Vec::with_capacity(12 + ciphertext.len());
    combined.extend_from_slice(nonce.as_slice());
    combined.extend_from_slice(&ciphertext);

    Ok(BASE64.encode(combined))
}

pub fn decrypt_content(encrypted_base64: &str, password: &str) -> Result<String, String> {
    let raw_bytes = BASE64
        .decode(encrypted_base64)
        .map_err(|e| format!("Invalid base64 payload: {}", e))?;

    let mut key_hasher = Sha256::new();
    key_hasher.update(b"noteflow-key-salt-");
    key_hasher.update(password.as_bytes());
    let key_bytes = key_hasher.finalize();

    let cipher = Aes256Gcm::new_from_slice(&key_bytes)
        .map_err(|e| format!("Failed to create cipher: {}", e))?;

    // First attempt: slice first 12 bytes as random nonce
    if raw_bytes.len() >= 12 {
        let (nonce_bytes, ciphertext) = raw_bytes.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);
        if let Ok(decrypted_bytes) = cipher.decrypt(nonce, ciphertext) {
            if let Ok(text) = String::from_utf8(decrypted_bytes) {
                return Ok(text);
            }
        }
    }

    // Fallback attempt for legacy static nonce
    let legacy_nonce_bytes = [7u8; 12];
    let legacy_nonce = Nonce::from_slice(&legacy_nonce_bytes);
    if let Ok(decrypted_bytes) = cipher.decrypt(legacy_nonce, raw_bytes.as_slice()) {
        if let Ok(text) = String::from_utf8(decrypted_bytes) {
            return Ok(text);
        }
    }

    Err("Incorrect password or corrupted note".to_string())
}
