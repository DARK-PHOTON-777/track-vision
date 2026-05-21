use tract_onnx::prelude::*;
use wasm_bindgen::prelude::*;
use serde::Serialize;


// Mapping array matching your datasets.ImageFolder indexing layout
const LABELS: &[(&str, &str)] = &[
("Bolliger & Mabillard", "BM"),
("Gerstlauer Amusement Rides", "Gerstlauer"),
("Rocky Mountain Construction", "RMC"),
("Schwarzkopf", "Schwarzkopf"),
("Vekoma", "Vekoma"),
];

const IMAGENET_MEAN: [f32; 3] = [0.485, 0.456, 0.406];
const IMAGENET_STD: [f32; 3] = [0.229, 0.224, 0.225];

#[derive(Serialize)]
pub struct MatchResult {
	pub name: String,
	pub code: String,
	pub confidence: f32,
}

#[wasm_bindgen(start)]
pub fn main() {
	console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub struct ModelSession {
	model: RunnableModel<TypedFact, Box<dyn TypedOp>, Graph<TypedFact, Box<dyn TypedOp>>>,
}

#[wasm_bindgen]
impl ModelSession {
	#[wasm_bindgen(js_name = "fromBytes")]
	pub fn from_bytes(bytes: &[u8]) -> Result<ModelSession, JsValue> {
		let model = tract_onnx::onnx()
		.model_for_read(&mut std::io::Cursor::new(bytes))
		.map_err(|e| JsValue::from_str(&e.to_string()))?
		.with_input_fact(0, f32::fact([1, 3, 224, 224]).into())
		.map_err(|e| JsValue::from_str(&e.to_string()))?
		.into_optimized()
		.map_err(|e| JsValue::from_str(&e.to_string()))?
		.into_runnable()
		.map_err(|e| JsValue::from_str(&e.to_string()))?;
		
		Ok(ModelSession { model })
	}
	
	#[wasm_bindgen]
	pub fn predict(&self, rgba_pixels: &[u8]) -> Result<JsValue, JsValue> {
		const HW: usize = 224 * 224;

		let mut data = vec![0.0f32; 3 * HW];
		
		for i in 0..HW {
			let src = i * 4;
			data[i]          = (rgba_pixels[src]     as f32 / 255.0 - IMAGENET_MEAN[0]) / IMAGENET_STD[0];
			data[i + HW]     = (rgba_pixels[src + 1] as f32 / 255.0 - IMAGENET_MEAN[1]) / IMAGENET_STD[1];
			data[i + HW * 2] = (rgba_pixels[src + 2] as f32 / 255.0 - IMAGENET_MEAN[2]) / IMAGENET_STD[2];
		}
		
		let tensor = tract_ndarray::Array4::<f32>::from_shape_vec(
			(1, 3, 224, 224), data
		)
		.map_err(|e| JsValue::from_str(&e.to_string()))?;
		let tensor: Tensor = tensor.into();
		
		let result = self.model
		.run(tvec![tensor.into()])
		.map_err(|e| JsValue::from_str(&e.to_string()))?;
		
		let logits = result[0]
		.to_array_view::<f32>()
		.map_err(|e| JsValue::from_str(&e.to_string()))?;
		let logits: Vec<f32> = logits.iter().cloned().collect();
		
		#[cfg(feature = "logging")]
		{
			use web_sys::console;
			
			let s: Vec<String> = logits.iter().enumerate()
			.map(|(i, v)| format!("[{}] {:.4}", i, v)).collect();
			console::log_1(&format!("Raw logits: {}", s.join(", ")).into());
		}
		
		// Softmax
		let max  = logits.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
		let exps: Vec<f32> = logits.iter().map(|&l| (l - max).exp()).collect();
		let sum: f32 = exps.iter().sum();
		let probs: Vec<f32> = exps.iter().map(|&e| e / sum).collect();
		
		let mut matches: Vec<MatchResult> = LABELS.iter().enumerate()
		.map(|(i, &(name, code))| MatchResult {
			name:       name.to_string(),
			code:       code.to_string(),
			confidence: probs[i],
		})
		.collect();
		
		matches.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());

		Ok(serde_wasm_bindgen::to_value(&matches)?)
	}
}