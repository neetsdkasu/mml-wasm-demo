mod utils;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub struct Mml2SmfResult {
    err_msg: Option<String>,
    smf: Vec<u8>,
}

#[wasm_bindgen]
impl Mml2SmfResult {
    #[wasm_bindgen(js_name = "isError")]
    pub fn is_error(&self) -> bool {
        self.err_msg.is_some()
    }
    #[wasm_bindgen(js_name = "takeErrorMsg")]
    pub fn take_error_msg(&mut self) -> String {
        self.err_msg.take().unwrap_or_else(|| "".into())
    }
    #[wasm_bindgen(js_name = "takeSmfData")]
    pub fn take_smf_data(&mut self) -> Vec<u8> {
        self.smf.drain(..).collect()
    }
    fn error(msg: String) -> Self {
        Mml2SmfResult {
            err_msg: Some(msg),
            smf: Vec::with_capacity(0),
        }
    }
    fn ok(smf: Vec<u8>) -> Self {
        Mml2SmfResult { err_msg: None, smf }
    }
}

#[wasm_bindgen(js_name = "instrumentName")]
pub fn instrument_name(inst: usize) -> String {
    mml_core::INSTRUMENTS
        .get(inst)
        .map(|inst| inst.name_ja())
        .unwrap_or("")
        .into()
}

#[wasm_bindgen]
pub fn mml2smf(src: &str, inst: usize) -> Mml2SmfResult {
    utils::set_panic_hook();

    let inst = match mml_core::INSTRUMENTS.get(inst) {
        None => return Mml2SmfResult::error(format!("楽器番号が不正です({})", inst)),
        Some(inst) => *inst,
    };

    match mml_core::convert(src, inst) {
        Err(error) => Mml2SmfResult::error(format!("{:?}", error)),
        Ok(smf) => Mml2SmfResult::ok(smf),
    }
}
