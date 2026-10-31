fn main() {
    println!("cargo:rerun-if-changed=../build");
    tauri_build::build();
}
