use aes_gcm::{
    aead::{Aead, KeyInit},
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

    // 96-bit nonce
    let nonce_bytes = [7u8; 12];
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, content.as_bytes())
        .map_err(|e| format!("Encryption error: {}", e))?;

    Ok(BASE64.encode(ciphertext))
}

pub fn decrypt_content(encrypted_base64: &str, password: &str) -> Result<String, String> {
    let ciphertext = BASE64
        .decode(encrypted_base64)
        .map_err(|e| format!("Invalid base64 payload: {}", e))?;

    let mut key_hasher = Sha256::new();
    key_hasher.update(b"noteflow-key-salt-");
    key_hasher.update(password.as_bytes());
    let key_bytes = key_hasher.finalize();

    let cipher = Aes256Gcm::new_from_slice(&key_bytes)
        .map_err(|e| format!("Failed to create cipher: {}", e))?;

    let nonce_bytes = [7u8; 12];
    let nonce = Nonce::from_slice(&nonce_bytes);

    let decrypted_bytes = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|_| "Incorrect password or corrupted note".to_string())?;

    String::from_utf8(decrypted_bytes)
        .map_err(|e| format!("UTF-8 decode error: {}", e))
}
