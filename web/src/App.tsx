import React, { useRef, useState } from "react";
import ImageDrop from "./ImageDrop.tsx";
import init, { ModelSession } from "./wasm/rust_wasm";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Match {
	name: string;
	code: string;
	confidence: number;
}

type ModelState =
	| { tag: "loading" }
	| { tag: "ready"; session: ModelSession }
	| { tag: "error"; message: string };

type ResultState =
	| { tag: "idle" }
	| { tag: "classifying" }
	| { tag: "done"; matches: Match[] }
	| { tag: "error"; message: string };

const SAMPLES = [
	{ name: "Hangtime", make: "Gerstlauer", src: "./images/hangtime.jpg" },
	{
		name: "Steel Vengeance",
		make: "RMC",
		src: "./images/steel_vengeance.jpg",
	},
	{ name: "Mako", make: "B&M", src: "./images/mako.jpg" },
];

function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
	const s =
		size === "sm"
			? "w-4 h-4 border-2"
			: size === "lg"
				? "w-10 h-10 border-4"
				: "w-7 h-7 border-[3px]";
	return (
		<span
			className={`${s} rounded-full border-white/10 border-t-red-500 animate-spin block`}
			aria-label="Loading"
		/>
	);
}

export default function App() {
	const [model, setModel] = useState<ModelState>({ tag: "loading" });
	const [result, setResult] = useState<ResultState>({ tag: "idle" });
	const [blobURL, setBlobURL] = useState<string | null>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const prevBlob = useRef<string | null>(null);

	React.useEffect(() => {
		(async () => {
			try {
				await init();
				const buf = await (
					await fetch("./models/track_classifier.onnx")
				).arrayBuffer();
				const session = ModelSession.fromBytes(new Uint8Array(buf));
				setModel({ tag: "ready", session });
			} catch (e) {
				setModel({
					tag: "error",
					message: "Inference engine unavailable on this device.",
				});
			}
		})();
		return () => {
			if (prevBlob.current) URL.revokeObjectURL(prevBlob.current);
		};
	}, []);

	const classify = async (imgSrc: string, isBlob: boolean) => {
		if (model.tag !== "ready") return;
		setResult({ tag: "classifying" });

		const img = new Image();
		img.crossOrigin = "anonymous";
		img.src = imgSrc;
		img.onload = async () => {
			try {
				const canvas = canvasRef.current!;
				const ctx = canvas.getContext("2d")!;
				canvas.width = canvas.height = 224;
				ctx.drawImage(img, 0, 0, 224, 224);
				const raw = new Uint8Array(
					ctx.getImageData(0, 0, 224, 224).data.buffer,
				);
				const preds = (await model.session.predict(raw)) as Match[];
				const top3 = [...preds]
					.sort((a, b) => b.confidence - a.confidence)
					.slice(0, 3);
				setResult({ tag: "done", matches: top3 });
			} catch {
				setResult({
					tag: "error",
					message: "Classification failed — try another image.",
				});
			}
		};
		img.onerror = () =>
			setResult({ tag: "error", message: "Could not load image." });
	};

	const handleFile = (file: File) => {
		if (prevBlob.current) URL.revokeObjectURL(prevBlob.current);
		const url = URL.createObjectURL(file);
		prevBlob.current = url;
		setBlobURL(url);
		setResult({ tag: "idle" });
		classify(url, true);
	};

	const handleSample = (src: string) => {
		if (prevBlob.current) {
			URL.revokeObjectURL(prevBlob.current);
			prevBlob.current = null;
		}
		setBlobURL(src);
		setResult({ tag: "idle" });
		classify(src, false);
	};

	const reset = () => {
		if (prevBlob.current) {
			URL.revokeObjectURL(prevBlob.current);
			prevBlob.current = null;
		}
		setBlobURL(null);
		setResult({ tag: "idle" });
	};

	return (
		<div className="pb-20">
			{/* ── Main content ── */}
			<div className="flex flex-col w-full max-w-xl mx-auto gap-4 px-4 pt-4">
				{/* Header */}
				<header className="flex flex-col space-y-md text-center">
					<h1 className="text-6xl font-black leading-none text-red-500 uppercase">
						Track Vision
					</h1>
					<p className="text-md font-semibold tracking-wider uppercase text-white/70">
						AI Rollercoaster Classifier
					</p>
				</header>

				{/* Drop zone */}
				<ImageDrop
					modelReady={model.tag === "ready"}
					blobURL={blobURL}
					classifying={result.tag === "classifying"}
					onFile={handleFile}
					onReset={reset}
				/>

				{/* Model error */}
				{model.tag === "error" && (
					<div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5">
						<span className="font-display text-red-500 font-black text-lg leading-none">
							!
						</span>
						<p className="text-md text-white/60">{model.message}</p>
					</div>
				)}

				{/* Results area */}
				{result.tag === "classifying" && (
					<div className="flex items-center gap-3 px-4 py-5">
						<Spinner size="sm" />
						<span className="font-display font-bold text-md tracking-widest uppercase text-white/60">
							Analyzing track…
						</span>
					</div>
				)}

				{result.tag === "error" && (
					<p className="text-md text-red-400 px-1">
						{result.message}
					</p>
				)}

				{result.tag === "done" && (
					<section className="flex flex-col gap-4">
						<h2 className="font-display text-md font-bold uppercase text-white/70">
							Classification Matches
						</h2>
						<ul className="flex flex-col gap-3.5">
							{result.matches.map((m, i) => (
								<li
									key={m.code + i}
									className="flex flex-col gap-1.5"
								>
									<div className="flex justify-between items-baseline">
										<span className="font-display font-bold text-base text-white tracking-wide">
											{m.name}
										</span>
										<span className="font-display font-bold text-base text-red-500">
											{(m.confidence * 100).toFixed(1)}%
										</span>
									</div>
									<div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
										<div
											className="h-full bg-red-500 rounded-full transition-all duration-500"
											style={{
												width: `${Math.min(100, m.confidence * 100)}%`,
											}}
										/>
									</div>
								</li>
							))}
						</ul>
					</section>
				)}

				{/* Samples */}
				<section className="flex flex-col gap-3">
					<h2 className="font-display text-md font-bold tracking-[0.25em] uppercase text-white/60">
						Sample Tracks
					</h2>
					<div className="flex gap-3">
						{SAMPLES.map((s) => (
							<button
								key={s.src}
								onClick={() => handleSample(s.src)}
								disabled={
									model.tag !== "ready" ||
									result.tag === "classifying"
								}
								className="flex-1 flex flex-col items-center gap-1 group disabled:opacity-40 disabled:pointer-events-none"
							>
								{model.tag === "loading" ? (
									<div className="w-full aspect-[4/3] rounded-xl bg-white/5 flex items-center justify-center">
										<Spinner size="sm" />
									</div>
								) : (
									<img
										src={s.src}
										alt={s.name}
										className="w-full aspect-[4/3] object-cover rounded-xl border border-white/[0.07] group-hover:border-red-500/50 group-hover:scale-[1.03] transition-all duration-200"
									/>
								)}
								<div className="flex flex-col items-center w-full">
									<span className="font-display font-bold text-md tracking-wide text-white/90 leading-tight truncate w-full text-center">
										{s.name}
									</span>
									<span className="font-display font-semibold text-md tracking-[0.14em] uppercase text-red-500/90">
										{s.make}
									</span>
								</div>
							</button>
						))}
					</div>
				</section>
			</div>

			{/* Footer */}
			<footer className="fixed bottom-0 inset-x-0 flex items-center justify-center gap-2 h-12 bg-[#0c0c0e]/90 backdrop-blur border-t border-white/[0.06] text-md tracking-wide text-white/60 z-50">
				<a
					href="https://github.com/DARK-PHOTON-777/track-vision"
					target="_blank"
					rel="noopener noreferrer"
					className="hover:text-red-500 transition-colors"
				>
					GitHub Repo
				</a>
				<span className="opacity-30">·</span>
				<a
					href="https://reno-warner.github.io/portfolio/"
					target="_blank"
					rel="noopener noreferrer"
					className="hover:text-red-500 transition-colors"
				>
					Engineered by{" "}
					<strong className="text-white/80 font-semibold">
						RENO
					</strong>
				</a>
			</footer>

			<canvas ref={canvasRef} className="hidden" />
		</div>
	);
}
