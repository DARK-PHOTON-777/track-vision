# Track-Vision 🎢

Track-Vision is a high-performance web application designed to instantly identify the manufacturer of a roller coaster simply by analyzing photos of its track or trains. 

By leveraging Rust compiled to WebAssembly (WASM), the app runs machine learning inference entirely client-side in the browser, ensuring blazing-fast, private, and serverless processing.

---

## Tech Stack & Architecture

Track-Vision bridges modern Python data science with an ultra-efficient Rust/React web frontend.

* **Frontend:** React powered by Vite for a lightning-fast development experience and optimized production builds.
* **Core Computation:** A custom Rust library compiled to WebAssembly using `wasm-bindgen`.
* **ML Inference:** Built with `tract-onnx`, allowing the Rust-WASM engine to execute ONNX models natively in the browser without relying on heavy JavaScript alternatives.
* **Model Training:** Python-based Jupyter notebooks utilizing PyTorch/TensorFlow to fine-tune a MobileNetV2 backbone for custom image classification.

---

## Supported Manufacturers

The network is currently trained to classify and distinguish between the distinct track profiles and train styles of:
* Bolliger & Mabillard (B&M)
* Gerstlauer Amusement Rides
* Rocky Mountain Construction (RMC)
* Vekoma
* Schwarzkopf

---

## Getting Started

### Prerequisites
Ensure you have the following tools installed:
* [uv](https://github.com/astral-sh/uv) (Modern Python package manager)
* [Node.js & npm](https://nodejs.org/)
* [Rust & wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

---

## Installation & Build Workflow

### 1. Model Generation (Python)
The `model/` directory contains Jupyter notebooks responsible for generating labeled datasets, training the network, and exporting the weights.

Use `uv` to instantly sync dependencies and spin up the environment:
```bash
# Install dependencies and sync the virtual environment
uv sync

# Run the notebooks to train and export the model
# This pipeline fine-tunes MobileNetV2 and outputs: model/track-vision.onnx

```

### 2. Compile the Rust WASM Engine
Once you have your track-vision.onnx file, compile the Rust inference engine into WebAssembly.

```bash

cd rust
npm run build

```

### 3. Build & Preview the Web App
With the WASM bindings generated, you can now build and launch the Vite/React frontend interface.

```bash

cd web
npm run build
npm run preview

```

## Project Structure

```

├── model/             # Jupyter notebooks, dataset generation, and training scripts
├── rust/              # Rust crate utilizing tract-onnx for WASM inference
└── web/               # Vite + React frontend application

```

Note: Track-Vision runs entirely locally in your browser. Once the page and the WASM binary are loaded, no image data ever leaves your device.